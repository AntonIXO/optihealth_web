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
-- PART 1b: Add soft-delete (is_archived) to products
-- ====================================================================================
-- Avoid FK violations with supplement_logs by archiving instead of deleting

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_is_archived ON public.products(is_archived);

COMMENT ON COLUMN public.products.is_archived IS 'Soft-delete flag. Archived products are hidden from cabinet/widgets but preserved for history integrity.';

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

COMMIT;

-- ====================================================================================
-- Summary of changes:
-- 1. Added default_intake_form column to products (important for bioavailability)
-- 2. Created add_new_product() RPC function for atomic product creation
--
-- Users can now immediately:
-- - Add products using the 3-step wizard
-- - Quick-log supplements with 3 taps
-- - Track intake methods for accurate bioavailability data
-- ====================================================================================

