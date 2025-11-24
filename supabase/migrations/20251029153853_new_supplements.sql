-- V2 Migration: Implement Supplement Ontology (Chapter 15)
-- This script transitions from the old supplement schema to the new,
-- normalized 5-table ontology.

BEGIN;

-- Step 1: Rename old, deprecated tables to preserve data
-- We rename instead of dropping, just in case you want to
-- run a manual data migration script later.
ALTER TABLE public.supplement_logs
  RENAME TO OLD_supplement_logs;
ALTER TABLE public.product_component_link
  RENAME TO OLD_product_component_link;
ALTER TABLE public.supplement_products
  RENAME TO OLD_supplement_products;
ALTER TABLE public.supplement_components
  RENAME TO OLD_supplement_components;

-- Step 2: Create new ENUM types for the new schema
CREATE TYPE public.supplement_form_factor AS ENUM (
  'capsule',
  'tablet',
  'powder',
  'liquid',
  'softgel',
  'sublingual_strip',
  'other'
);
CREATE TYPE public.supplement_intake_form AS ENUM (
  'oral',
  'sublingual',
  'transdermal',
  'intravenous',
  'intramuscular',
  'nasal',
  'other'
);

-- Step 3: Create the new ontology tables (The "What")
-- 1. Substances (The Abstract Parent, e.g., "Magnesium")
CREATE TABLE public.substances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  imported_data_examine JSONB,
  imported_data_psychonaut JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now ()
);
COMMENT ON TABLE public.substances IS 'Chapter 15: The abstract substance (e.g., "Magnesium", "Caffeine"). Target for Examine.com import.';

-- 2. Vendors (The Manufacturer, e.g., "Thorne Research")
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  name TEXT NOT NULL UNIQUE,
  website_url TEXT,
  trust_score SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now ()
);
COMMENT ON TABLE public.vendors IS 'Chapter 15: The manufacturer or source of a product (e.g., "Thorne Research").';

-- 3. Compounds (The Specific Form, e.g., "Magnesium L-Threonate")
CREATE TABLE public.compounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  substance_id UUID NOT NULL REFERENCES public.substances (id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "L-Threonate"
  full_name TEXT NOT NULL UNIQUE, -- e.g., "Magnesium L-Threonate"
  description TEXT,
  imported_data_examine JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now ()
);
COMMENT ON TABLE public.compounds IS 'Chapter 15: The specific chemical form of a substance (e.g., "Magnesium L-Threonate").';
CREATE INDEX idx_compounds_substance_id ON public.compounds (substance_id);

-- 4. Products (The "Bottle", e.g., "Thorne Magtein 144mg")
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  compound_id UUID NOT NULL REFERENCES public.compounds (id),
  vendor_id UUID NOT NULL REFERENCES public.vendors (id),
  name_on_bottle TEXT NOT NULL, -- e.g., "Magtein"
  form_factor public.supplement_form_factor DEFAULT 'capsule',
  -- This is the core data for normalization:
  -- e.g., 1 'capsule' contains 144 'mg' of the compound.
  unit_dosage NUMERIC NOT NULL, -- e.g., 144
  unit_measure TEXT NOT NULL DEFAULT 'mg', -- e.g., 'mg', 'g', 'mcg'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now ()
);
COMMENT ON TABLE public.products IS 'Chapter 15: The specific "bottle" a user buys, linking a Compound to a Vendor.';
CREATE INDEX idx_products_compound_id ON public.products (compound_id);
CREATE INDEX idx_products_vendor_id ON public.products (vendor_id);
-- Add a unique constraint to avoid duplicate "bottles"
ALTER TABLE
  public.products
ADD
  CONSTRAINT unique_product_compound_vendor UNIQUE (compound_id, vendor_id, name_on_bottle, unit_dosage);

-- 5. Supplement Logs (The Event, e.g., "Anton took 2 capsules at 9 PM")
CREATE TABLE public.supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products (id),
  -- Allow logging a generic compound if user doesn't have a specific product
  compound_id UUID REFERENCES public.compounds (id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now (),
  -- User input: "I took 2 capsules"
  dosage_amount NUMERIC NOT NULL, -- e.g., 2
  dosage_unit TEXT NOT NULL, -- e.g., 'capsules', 'scoops', 'servings'
  intake_form public.supplement_intake_form NOT NULL DEFAULT 'oral',
  -- The magic "Chapter 15" field, calculated by the trigger:
  calculated_dosage_mg NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
);
COMMENT ON TABLE public.supplement_logs IS 'Chapter 15: A user-generated event of taking a supplement.';
CREATE INDEX idx_supplement_logs_user_id_timestamp ON public.supplement_logs (user_id, timestamp DESC);
CREATE INDEX idx_supplement_logs_product_id ON public.supplement_logs (product_id);
CREATE INDEX idx_supplement_logs_compound_id ON public.supplement_logs (compound_id);
ALTER TABLE
  public.supplement_logs
ADD
  CONSTRAINT chk_log_has_product_or_compound CHECK (
    product_id IS NOT NULL
    OR compound_id IS NOT NULL
  );

-- Step 4: Create the "magic" trigger function for normalization
CREATE
OR REPLACE FUNCTION public.calculate_normalized_dosage () RETURNS TRIGGER AS $$
DECLARE
    product_unit_dosage NUMERIC;
    product_unit_measure TEXT;
    dosage_in_mg NUMERIC;
BEGIN
    -- Only run if a specific product_id is given
    IF NEW.product_id IS NULL THEN
        NEW.calculated_dosage_mg := NULL; -- Can't calculate
        RETURN NEW;
    END IF;

    -- 1. Fetch the product's dosage info
    SELECT
        unit_dosage,
        unit_measure
    INTO
        product_unit_dosage,
        product_unit_measure
    FROM
        public.products
    WHERE
        id = NEW.product_id;

    -- 2. Calculate the total dosage
    -- This assumes NEW.dosage_amount is in the unit defined by the product
    -- (e.g., user logs "2", product is "144mg per 1 capsule")
    -- Total dosage = 2 * 144
    dosage_in_mg := NEW.dosage_amount * product_unit_dosage;

    -- 3. Normalize dosage to 'mg' (v1 just handles 'g' and 'mcg')
    IF product_unit_measure = 'g' THEN
        dosage_in_mg := dosage_in_mg * 1000;
    ELSIF product_unit_measure = 'mcg' THEN
        dosage_in_mg := dosage_in_mg / 1000;
    -- ELSE: Assume 'mg' or a unit count like 'capsule' where unit_dosage is already in mg
    END IF;

    -- 4. Set the new, calculated value
    NEW.calculated_dosage_mg := dosage_in_mg;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION public.calculate_normalized_dosage() IS 'Trigger function to auto-calculate the normalized dosage in mg when a supplement is logged.';

-- Step 5: Attach the trigger to the supplement_logs table
CREATE TRIGGER set_normalized_dosage
BEFORE INSERT
OR UPDATE ON public.supplement_logs
FOR EACH ROW
EXECUTE FUNCTION public.calculate_normalized_dosage ();

COMMIT;
