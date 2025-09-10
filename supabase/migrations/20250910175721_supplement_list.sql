-- -----------------------------------------------------------------------------
-- MIGRATION SCRIPT: v4 - Curated Supplement Database & Enhanced UX
--
-- PURPOSE:
-- This script adds a moderation queue for new supplement components, extends
-- supplement products with barcode and public sharing capabilities, and updates
-- Row-Level Security (RLS) policies to allow users to view public products.
--
-- FIXES:
-- - Corrects syntax error by replacing all `CREATE POLICY IF NOT EXISTS` calls
--   with the proper `DROP POLICY IF EXISTS ...; CREATE POLICY ...;` pattern.
-- -----------------------------------------------------------------------------

BEGIN; -- Start Transaction

-- Section 1: Create Moderation Queue for Supplement Component Submissions
-- -----------------------------------------------------------------------------

-- Ensure the ENUM type for submission status exists.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
    CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END$$;

-- Create the table to hold user submissions.
CREATE TABLE IF NOT EXISTS public.component_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_name TEXT NOT NULL,
  category_suggestion TEXT NULL,
  notes TEXT NULL,                -- For users to provide links/context for admin
  status submission_status DEFAULT 'pending' NOT NULL,
  admin_notes TEXT NULL,          -- For admin to explain rejection or add info
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.component_submissions IS 'User-submitted requests for new supplement components, moderated by an admin.';

-- Enable Row-Level Security on the submissions table.
ALTER TABLE public.component_submissions ENABLE ROW LEVEL SECURITY;

-- Apply RLS Policies for submissions.
-- Users can manage their own submissions.
DROP POLICY IF EXISTS "Users can manage their own submissions." ON public.component_submissions;
CREATE POLICY "Users can manage their own submissions."
ON public.component_submissions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins (service_role) can read all submissions.
DROP POLICY IF EXISTS "Admins can see all submissions." ON public.component_submissions;
CREATE POLICY "Admins can see all submissions."
ON public.component_submissions
FOR SELECT
USING (auth.role() = 'service_role');

-- Add trigger for the updated_at timestamp.
DROP TRIGGER IF EXISTS on_component_submissions_updated ON public.component_submissions;
CREATE TRIGGER on_component_submissions_updated
BEFORE UPDATE ON public.component_submissions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Section 2: Extend Products Table with Barcode and Public Flag
-- -----------------------------------------------------------------------------
-- The public.supplement_products table was created in the previous migration.
ALTER TABLE public.supplement_products
  ADD COLUMN IF NOT EXISTS barcode TEXT NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN public.supplement_products.barcode IS 'Stores the GTIN/UPC barcode of the product for easy lookup by scanning.';
COMMENT ON COLUMN public.supplement_products.is_public IS 'If true, this product definition can be shared with and viewed by other users.';

-- Add a case-insensitive search index for the product_name.
CREATE INDEX IF NOT EXISTS idx_supplement_products_name_ci
ON public.supplement_products (LOWER(product_name));

-- Section 3: Update RLS Policies for Products and Formulas
-- -----------------------------------------------------------------------------

-- RLS for public.supplement_products table.
-- Users should be able to manage their own products (for any operation).
DROP POLICY IF EXISTS "Users can manage their own supplement products." ON public.supplement_products;
CREATE POLICY "Users can manage their own supplement products."
ON public.supplement_products
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users should be able to read (SELECT) public products in addition to their own.
DROP POLICY IF EXISTS "Users can read public or own products" ON public.supplement_products;
CREATE POLICY "Users can read public or own products"
ON public.supplement_products
FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

-- RLS for public.product_component_link table.
-- This table defines the formula of a product. Its visibility must match the parent product.
ALTER TABLE public.product_component_link ENABLE ROW LEVEL SECURITY;

-- Users can manage the formulas for their own products.
DROP POLICY IF EXISTS "Users can manage links for their own products." ON public.product_component_link;
CREATE POLICY "Users can manage links for their own products."
ON public.product_component_link
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.supplement_products sp
  WHERE sp.id = product_id AND sp.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.supplement_products sp
  WHERE sp.id = product_id AND sp.user_id = auth.uid()
));

-- Users can read formulas if the parent product is readable (i.e., it is public or their own).
DROP POLICY IF EXISTS "Users can read links of readable products" ON public.product_component_link;
CREATE POLICY "Users can read links of readable products"
ON public.product_component_link
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.supplement_products sp
  WHERE sp.id = product_id
    AND (sp.is_public = true OR sp.user_id = auth.uid())
));

COMMIT; -- End Transaction
