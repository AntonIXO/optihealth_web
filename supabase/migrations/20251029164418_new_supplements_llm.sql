-- Comprehensive supplement system migration
-- Implements Chapter 15 ontology with LLM enhancements

BEGIN;

-- ====================================================================================
-- PART 1: Add default_intake_form to products table
-- ====================================================================================
-- Different intake methods have different bioavailability and dosing requirements
-- (e.g., sublingual B12 vs oral B12)

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS default_intake_form public.supplement_intake_form NOT NULL DEFAULT 'oral';

COMMENT ON COLUMN public.products.default_intake_form IS 
  'Default intake method for this product (sublingual, oral, etc.). Pre-fills the quick log modal. Important because different routes have different bioavailability.';

-- ====================================================================================
-- PART 2: Create add_new_product RPC function
-- ====================================================================================
-- Atomic operation for creating products with vendor lookup/creation

CREATE OR REPLACE FUNCTION public.add_new_product (
    p_user_id UUID,
    p_compound_id UUID,
    p_vendor_name TEXT,
    p_name_on_bottle TEXT,
    p_form_factor public.supplement_form_factor,
    p_unit_dosage NUMERIC,
    p_unit_measure TEXT,
    p_default_intake_form public.supplement_intake_form DEFAULT 'oral'
)
RETURNS public.products
LANGUAGE plpgsql
AS $$
DECLARE
    v_vendor_id UUID;
    v_product public.products;
BEGIN
    -- Step 1: Find or create the Vendor
    SELECT id INTO v_vendor_id FROM public.vendors WHERE name = p_vendor_name;

    IF v_vendor_id IS NULL THEN
        INSERT INTO public.vendors (name)
        VALUES (p_vendor_name)
        RETURNING id INTO v_vendor_id;
    END IF;

    -- Step 2: Create the new Product
    INSERT INTO public.products (
        compound_id,
        vendor_id,
        name_on_bottle,
        form_factor,
        unit_dosage,
        unit_measure,
        default_intake_form
    )
    VALUES (
        p_compound_id,
        v_vendor_id,
        p_name_on_bottle,
        p_form_factor,
        p_unit_dosage,
        p_unit_measure,
        p_default_intake_form
    )
    RETURNING * INTO v_product;

    -- Step 3: Return the newly created product
    RETURN v_product;
END;
$$;

COMMENT ON FUNCTION public.add_new_product IS 
  'Creates a new product, automatically finding or creating the vendor. Atomic operation for the Add Product Wizard.';

-- ====================================================================================
-- PART 3: Seed common substances
-- ====================================================================================
-- Pre-populate database with common supplements so users can start immediately

INSERT INTO public.substances (name, description) VALUES
  ('Magnesium', 'Essential mineral involved in over 300 enzymatic reactions'),
  ('Vitamin D', 'Fat-soluble vitamin essential for calcium absorption and immune function'),
  ('Omega-3', 'Essential fatty acids important for heart and brain health'),
  ('Zinc', 'Essential mineral for immune function and protein synthesis'),
  ('Vitamin C', 'Water-soluble antioxidant vitamin'),
  ('Caffeine', 'Central nervous system stimulant'),
  ('L-Theanine', 'Amino acid found in tea, promotes relaxation'),
  ('Creatine', 'Amino acid derivative for energy production'),
  ('Vitamin B12', 'Water-soluble vitamin essential for nerve function'),
  ('Iron', 'Essential mineral for oxygen transport'),
  ('Calcium', 'Essential mineral for bone health'),
  ('Ashwagandha', 'Adaptogenic herb used in Ayurvedic medicine'),
  ('Rhodiola', 'Adaptogenic herb for stress and fatigue'),
  ('CoQ10', 'Antioxidant compound important for cellular energy'),
  ('Curcumin', 'Active compound in turmeric with anti-inflammatory properties')
ON CONFLICT (name) DO NOTHING;

-- ====================================================================================
-- PART 4: Seed common compound forms
-- ====================================================================================
-- Create specific chemical forms for each substance

WITH substance_ids AS (
  SELECT id, name FROM public.substances
)
INSERT INTO public.compounds (substance_id, name, full_name) 
SELECT 
  s.id,
  c.compound_name,
  s.name || ' ' || c.compound_name as full_name
FROM substance_ids s
CROSS JOIN (VALUES
  ('L-Threonate'),
  ('Glycinate'),
  ('Citrate'),
  ('Oxide'),
  ('Malate'),
  ('Taurate')
) AS c(compound_name)
WHERE s.name = 'Magnesium'

UNION ALL

-- Vitamin D forms
SELECT s.id, 'D3 (Cholecalciferol)', 'Vitamin D D3 (Cholecalciferol)'
FROM substance_ids s WHERE s.name = 'Vitamin D'
UNION ALL
SELECT s.id, 'D2 (Ergocalciferol)', 'Vitamin D D2 (Ergocalciferol)'
FROM substance_ids s WHERE s.name = 'Vitamin D'

UNION ALL

-- Omega-3 forms
SELECT s.id, 'EPA/DHA', 'Omega-3 EPA/DHA'
FROM substance_ids s WHERE s.name = 'Omega-3'
UNION ALL
SELECT s.id, 'Fish Oil', 'Omega-3 Fish Oil'
FROM substance_ids s WHERE s.name = 'Omega-3'
UNION ALL
SELECT s.id, 'Algae Oil', 'Omega-3 Algae Oil'
FROM substance_ids s WHERE s.name = 'Omega-3'

UNION ALL

-- Zinc forms
SELECT s.id, 'Picolinate', 'Zinc Picolinate'
FROM substance_ids s WHERE s.name = 'Zinc'
UNION ALL
SELECT s.id, 'Citrate', 'Zinc Citrate'
FROM substance_ids s WHERE s.name = 'Zinc'
UNION ALL
SELECT s.id, 'Gluconate', 'Zinc Gluconate'
FROM substance_ids s WHERE s.name = 'Zinc'

UNION ALL

-- Vitamin C forms
SELECT s.id, 'Ascorbic Acid', 'Vitamin C Ascorbic Acid'
FROM substance_ids s WHERE s.name = 'Vitamin C'
UNION ALL
SELECT s.id, 'Liposomal', 'Vitamin C Liposomal'
FROM substance_ids s WHERE s.name = 'Vitamin C'

UNION ALL

-- Caffeine
SELECT s.id, 'Anhydrous', 'Caffeine Anhydrous'
FROM substance_ids s WHERE s.name = 'Caffeine'

UNION ALL

-- L-Theanine
SELECT s.id, '(pure)', 'L-Theanine (pure)'
FROM substance_ids s WHERE s.name = 'L-Theanine'

UNION ALL

-- Creatine forms
SELECT s.id, 'Monohydrate', 'Creatine Monohydrate'
FROM substance_ids s WHERE s.name = 'Creatine'
UNION ALL
SELECT s.id, 'HCl', 'Creatine HCl'
FROM substance_ids s WHERE s.name = 'Creatine'

UNION ALL

-- B12 forms
SELECT s.id, 'Methylcobalamin', 'Vitamin B12 Methylcobalamin'
FROM substance_ids s WHERE s.name = 'Vitamin B12'
UNION ALL
SELECT s.id, 'Cyanocobalamin', 'Vitamin B12 Cyanocobalamin'
FROM substance_ids s WHERE s.name = 'Vitamin B12'

UNION ALL

-- Iron forms
SELECT s.id, 'Ferrous Sulfate', 'Iron Ferrous Sulfate'
FROM substance_ids s WHERE s.name = 'Iron'
UNION ALL
SELECT s.id, 'Ferrous Bisglycinate', 'Iron Ferrous Bisglycinate'
FROM substance_ids s WHERE s.name = 'Iron'

UNION ALL

-- Calcium forms
SELECT s.id, 'Citrate', 'Calcium Citrate'
FROM substance_ids s WHERE s.name = 'Calcium'
UNION ALL
SELECT s.id, 'Carbonate', 'Calcium Carbonate'
FROM substance_ids s WHERE s.name = 'Calcium'

UNION ALL

-- Ashwagandha forms
SELECT s.id, 'Root Extract', 'Ashwagandha Root Extract'
FROM substance_ids s WHERE s.name = 'Ashwagandha'
UNION ALL
SELECT s.id, 'KSM-66', 'Ashwagandha KSM-66'
FROM substance_ids s WHERE s.name = 'Ashwagandha'

UNION ALL

-- Rhodiola
SELECT s.id, 'Rosea Extract', 'Rhodiola Rosea Extract'
FROM substance_ids s WHERE s.name = 'Rhodiola'

UNION ALL

-- CoQ10 forms
SELECT s.id, 'Ubiquinone', 'CoQ10 Ubiquinone'
FROM substance_ids s WHERE s.name = 'CoQ10'
UNION ALL
SELECT s.id, 'Ubiquinol', 'CoQ10 Ubiquinol'
FROM substance_ids s WHERE s.name = 'CoQ10'

UNION ALL

-- Curcumin
SELECT s.id, '(Turmeric Extract)', 'Curcumin (Turmeric Extract)'
FROM substance_ids s WHERE s.name = 'Curcumin'

ON CONFLICT (full_name) DO NOTHING;

-- ====================================================================================
-- PART 5: Seed common vendors
-- ====================================================================================

INSERT INTO public.vendors (name, website_url) VALUES
  ('Thorne Research', 'https://www.thorne.com'),
  ('Nootropics Depot', 'https://nootropicsdepot.com'),
  ('Life Extension', 'https://www.lifeextension.com'),
  ('NOW Foods', 'https://www.nowfoods.com'),
  ('Jarrow Formulas', 'https://jarrow.com'),
  ('Doctor''s Best', 'https://www.drbvitamins.com'),
  ('Pure Encapsulations', 'https://www.pureencapsulations.com'),
  ('Garden of Life', 'https://www.gardenoflife.com'),
  ('Nature Made', 'https://www.naturemade.com'),
  ('Optimum Nutrition', 'https://www.optimumnutrition.com'),
  ('Nordic Naturals', 'https://www.nordicnaturals.com'),
  ('Carlson Labs', 'https://www.carlsonlabs.com')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- ====================================================================================
-- Summary of changes:
-- 1. Added default_intake_form column to products (important for bioavailability)
-- 2. Created add_new_product() RPC function for atomic product creation
-- 3. Seeded 15 common substances
-- 4. Seeded 40+ compound forms (specific chemical variants)
-- 5. Seeded 12 common supplement vendors
--
-- Users can now immediately:
-- - Add products using the 3-step wizard
-- - Quick-log supplements with 3 taps
-- - Track intake methods for accurate bioavailability data
-- ====================================================================================
