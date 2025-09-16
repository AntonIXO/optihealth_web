-- -----------------------------------------------------------------------------
-- MIGRATION: Fix RLS Policies for Supplement System
-- 
-- ISSUE: "new row violates row-level security policy for table supplement_products"
-- CAUSE: Missing INSERT policy for supplement_products table
-- 
-- This migration adds missing RLS policies and ensures all supplement tables
-- have proper INSERT/UPDATE/DELETE policies for authenticated users.
-- -----------------------------------------------------------------------------

BEGIN;

-- Fix supplement_products RLS policies
-- The existing policy only covers general operations but may not handle INSERT specifically
DROP POLICY IF EXISTS "Users can manage their own supplement products." ON public.supplement_products;

-- Separate policies for better clarity and debugging
CREATE POLICY "Users can insert their own supplement products"
ON public.supplement_products
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplement products"
ON public.supplement_products
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own supplement products"
ON public.supplement_products
FOR DELETE
USING (auth.uid() = user_id);

-- Keep the existing SELECT policy for public + owned products
-- (This should already exist from previous migration)

-- Fix product_component_link RLS policies
DROP POLICY IF EXISTS "Users can manage links for their own products." ON public.product_component_link;

CREATE POLICY "Users can insert links for their own products"
ON public.product_component_link
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.supplement_products sp
  WHERE sp.id = product_id AND sp.user_id = auth.uid()
));

CREATE POLICY "Users can update links for their own products"
ON public.product_component_link
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.supplement_products sp
  WHERE sp.id = product_id AND sp.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.supplement_products sp
  WHERE sp.id = product_id AND sp.user_id = auth.uid()
));

CREATE POLICY "Users can delete links for their own products"
ON public.product_component_link
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.supplement_products sp
  WHERE sp.id = product_id AND sp.user_id = auth.uid()
));

-- Keep the existing SELECT policy for readable products
-- (This should already exist from previous migration)

-- Ensure supplement_logs has proper RLS policies
-- Users should be able to manage logs for their own products
ALTER TABLE public.supplement_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own supplement logs" ON public.supplement_logs;

CREATE POLICY "Users can insert their own supplement logs"
ON public.supplement_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own supplement logs"
ON public.supplement_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplement logs"
ON public.supplement_logs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own supplement logs"
ON public.supplement_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Ensure supplement_components is readable by all authenticated users
-- (Master list should be publicly readable for autocomplete)
ALTER TABLE public.supplement_components ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read supplement components" ON public.supplement_components;
CREATE POLICY "Authenticated users can read supplement components"
ON public.supplement_components
FOR SELECT
USING (auth.role() = 'authenticated');

-- Component submissions should already have proper RLS from previous migration
-- But let's ensure it's complete
DROP POLICY IF EXISTS "Users can manage their own submissions." ON public.component_submissions;

CREATE POLICY "Users can insert their own submissions"
ON public.component_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own submissions"
ON public.component_submissions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions"
ON public.component_submissions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Keep admin SELECT policy for component_submissions
-- (Should already exist from previous migration)

COMMIT;