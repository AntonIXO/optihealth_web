-- -----------------------------------------------------------------------------
-- MIGRATION: Supplement analysis-extraction layer
-- version: 20260630160000
--
-- PURPOSE:
--   Make supplement data optimally extractable for the analysis engine without
--   changing the normalized "Chapter 15" ontology write-model.
--
--   1. Denormalize substance_id onto supplement_logs (analysis grain).
--   2. Harden calculate_normalized_dosage() so it resolves substance_id for BOTH
--      the product path (product -> compound -> substance) and the compound-only
--      path (compound -> substance), keeping the existing mg calculation intact.
--   3. Backfill substance_id for existing rows.
--   4. Add a covering index matching the per-user/substance/time access pattern.
--   5. Expose public.analysis_daily_supplement_intake (security_invoker view):
--      one stable, flat, analysis-ready surface that aggregates dosage per
--      user/day/substance, so the worker reads one object instead of a 3-hop join.
--
-- SAFE TO RE-RUN: all steps are idempotent (IF NOT EXISTS / OR REPLACE / guarded).
-- TARGET: PostgreSQL 17 (Supabase). Single transaction.
-- -----------------------------------------------------------------------------

BEGIN;

-- Section 1: Denormalized analysis-grain column ------------------------------
ALTER TABLE public.supplement_logs
  ADD COLUMN IF NOT EXISTS substance_id UUID REFERENCES public.substances(id);

COMMENT ON COLUMN public.supplement_logs.substance_id IS
  'Denormalized analysis grain (Magnesium L-Threonate and Magnesium Citrate both roll up to Magnesium). Auto-filled by calculate_normalized_dosage() trigger from product->compound->substance, or compound->substance for product-less logs.';

-- Section 2: Harden the normalization trigger --------------------------------
-- Adds substance_id resolution; preserves the existing calculated_dosage_mg
-- logic exactly (product-driven; compound-only stays NULL for mg).
CREATE OR REPLACE FUNCTION public.calculate_normalized_dosage()
RETURNS TRIGGER AS $$
DECLARE
    v_compound_id        UUID;
    product_unit_dosage  NUMERIC;
    product_unit_measure TEXT;
    dosage_in_mg         NUMERIC;
BEGIN
    -- (A) Resolve the effective compound: product's compound wins, else the
    --     directly-logged compound_id.
    IF NEW.product_id IS NOT NULL THEN
        SELECT compound_id INTO v_compound_id
        FROM public.products WHERE id = NEW.product_id;
    END IF;
    v_compound_id := COALESCE(v_compound_id, NEW.compound_id);

    -- (B) Denormalize substance_id from that compound (analysis grain).
    IF v_compound_id IS NOT NULL THEN
        SELECT substance_id INTO NEW.substance_id
        FROM public.compounds WHERE id = v_compound_id;
    ELSE
        NEW.substance_id := NULL;
    END IF;

    -- (C) Normalized mg dosage -- unchanged semantics: only computable when a
    --     specific product (with unit_dosage/measure) is known.
    IF NEW.product_id IS NULL THEN
        NEW.calculated_dosage_mg := NULL; -- compound-only: no per-unit mg known
        RETURN NEW;
    END IF;

    SELECT unit_dosage, unit_measure
      INTO product_unit_dosage, product_unit_measure
      FROM public.products
     WHERE id = NEW.product_id;

    dosage_in_mg := NEW.dosage_amount * product_unit_dosage;

    IF product_unit_measure = 'g' THEN
        dosage_in_mg := dosage_in_mg * 1000;
    ELSIF product_unit_measure = 'mcg' THEN
        dosage_in_mg := dosage_in_mg / 1000;
    -- ELSE: 'mg' or a unit count where unit_dosage is already in mg
    END IF;

    NEW.calculated_dosage_mg := dosage_in_mg;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_normalized_dosage() IS
  'BEFORE INSERT/UPDATE on supplement_logs: resolves denormalized substance_id (product->compound->substance or compound->substance) and computes calculated_dosage_mg from the product unit dosage.';

-- Trigger already exists (set_normalized_dosage); recreate idempotently so the
-- new function body is guaranteed bound even on a fresh replica.
DROP TRIGGER IF EXISTS set_normalized_dosage ON public.supplement_logs;
CREATE TRIGGER set_normalized_dosage
  BEFORE INSERT OR UPDATE ON public.supplement_logs
  FOR EACH ROW EXECUTE FUNCTION public.calculate_normalized_dosage();

-- Section 3: Backfill existing rows ------------------------------------------
UPDATE public.supplement_logs sl
   SET substance_id = c.substance_id
  FROM public.compounds c
 WHERE c.id = COALESCE(
         (SELECT p.compound_id FROM public.products p WHERE p.id = sl.product_id),
         sl.compound_id)
   AND sl.substance_id IS DISTINCT FROM c.substance_id;

-- Section 4: Covering index for the analysis access pattern ------------------
CREATE INDEX IF NOT EXISTS idx_supplement_logs_user_substance_ts
  ON public.supplement_logs (user_id, substance_id, timestamp DESC);

-- Section 5: Analysis-ready view ---------------------------------------------
-- Flat projection the worker selects from. security_invoker keeps RLS for any
-- authenticated reader; the service_role worker bypasses RLS as today.
CREATE OR REPLACE VIEW public.analysis_daily_supplement_intake
WITH (security_invoker = true) AS
SELECT
    sl.user_id,
    (sl.timestamp AT TIME ZONE 'UTC')::date AS day,
    sl.substance_id,
    s.name                                  AS substance_name,
    SUM(sl.calculated_dosage_mg)            AS total_dosage_mg,
    COUNT(*)                                AS n_doses
FROM public.supplement_logs sl
JOIN public.substances s ON s.id = sl.substance_id
WHERE sl.substance_id IS NOT NULL
GROUP BY sl.user_id, (sl.timestamp AT TIME ZONE 'UTC')::date, sl.substance_id, s.name;

COMMENT ON VIEW public.analysis_daily_supplement_intake IS
  'Analysis-optimized surface: per user/day/substance total mg (calculated_dosage_mg summed) and dose count. Consumed by optihealth_analysis worker; decouples the engine from physical supplement-table churn.';

COMMIT;
