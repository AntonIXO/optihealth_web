-- -----------------------------------------------------------------------------
-- MIGRATION SCRIPT: v3 - Supplement Multi-Component Architecture
--
-- PURPOSE:
-- This script upgrades the database schema to support multi-component supplements.
-- It transitions from a simple log model to a "product-component" model, where
-- users define a product (e.g., a specific multivitamin brand) and its formula
-- (the individual components and their dosages). This enables more powerful and
-- accurate analysis of individual supplement components.
--
-- RUNNING THIS SCRIPT:
-- 1. !! BACK UP YOUR DATABASE BEFORE RUNNING !! This is a critical step.
-- 2. Run this entire script as a single transaction in the Supabase SQL Editor.
--
-- WHAT THIS SCRIPT DOES:
-- 1. Renames `supplement_definitions` to `supplement_components`.
-- 2. Creates new `supplement_products` and `product_component_link` tables.
-- 3. Intelligently migrates existing supplement logs into the new structure by:
--    a. Creating a new "product" for each unique supplement previously logged by a user.
--    b. Linking that product to its single component.
--    c. Updating the old logs to point to these new products.
-- 4. Alters the `supplement_logs` table to use the new product-centric format.
-- -----------------------------------------------------------------------------

BEGIN; -- Start Transaction

-- Section 1: Schema Renaming and Creation
-- -----------------------------------------------------------------------------

-- Step 1.1: Rename the existing definitions table to reflect its new purpose.
ALTER TABLE public.supplement_definitions
RENAME TO supplement_components;

-- Step 1.2: Create the new table for user-defined supplement products.
CREATE TABLE IF NOT EXISTS public.supplement_products (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    serving_size_unit TEXT DEFAULT 'pill' NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, product_name)
);
ALTER TABLE public.supplement_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own supplement products." ON public.supplement_products FOR ALL USING (auth.uid() = user_id);
COMMENT ON TABLE public.supplement_products IS 'Stores user-defined supplement products, like a specific brand of multivitamin.';

-- Step 1.3: Create the linking table to define the formula of each product.
CREATE TABLE IF NOT EXISTS public.product_component_link (
    product_id BIGINT NOT NULL REFERENCES public.supplement_products(id) ON DELETE CASCADE,
    component_id BIGINT NOT NULL REFERENCES public.supplement_components(id) ON DELETE CASCADE,
    amount DOUBLE PRECISION NOT NULL,
    unit supplement_unit NOT NULL, -- Re-uses the existing ENUM type
    PRIMARY KEY (product_id, component_id)
);
ALTER TABLE public.product_component_link ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage links for their own products." ON public.product_component_link FOR ALL
    USING (EXISTS (SELECT 1 FROM supplement_products WHERE id = product_id AND user_id = auth.uid()));
COMMENT ON TABLE public.product_component_link IS 'Defines the components and dosages for each supplement product.';


-- Section 2: Data Migration
-- -----------------------------------------------------------------------------
-- This section migrates existing log data into the new structure.
-- We will create a temporary function to handle the logic.

CREATE OR REPLACE FUNCTION public.migrate_old_supplement_logs()
RETURNS void AS $$
DECLARE
    -- A record variable to hold each unique user/supplement combination
    log_rec RECORD;
    -- Variable to store the ID of the newly created product
    new_product_id BIGINT;
BEGIN
    RAISE NOTICE 'Starting supplement log data migration...';

    -- Loop through every unique combination of user and supplement they have previously logged.
    FOR log_rec IN
        SELECT DISTINCT user_id, supplement_id FROM public.supplement_logs
    LOOP
        -- Step 2.1: Create a new product for this unique combination.
        -- We'll use the component's name as the new product's name.
        INSERT INTO public.supplement_products (user_id, product_name, serving_size_unit)
        SELECT
            log_rec.user_id,
            sc.supplement_name,
            'unit' -- A generic unit, as old logs could have mixed units
        FROM public.supplement_components sc
        WHERE sc.id = log_rec.supplement_id
        RETURNING id INTO new_product_id;

        -- Step 2.2: Create a link for this new product.
        -- We assume the old log's "amount" was for 1 serving of this auto-created product.
        -- Therefore, the formula is 1:1. The amount is 1, and the unit is 'pill' or generic.
        INSERT INTO public.product_component_link (product_id, component_id, amount, unit)
        VALUES (new_product_id, log_rec.supplement_id, 1, 'pill');

        -- Step 2.3: Update the old log entries to point to this new product.
        -- We add the product_id and will clean up the old columns later.
        UPDATE public.supplement_logs
        SET temp_product_id = new_product_id
        WHERE user_id = log_rec.user_id AND supplement_id = log_rec.supplement_id;

        RAISE NOTICE 'Migrated logs for user % and component % to new product %', log_rec.user_id, log_rec.supplement_id, new_product_id;
    END LOOP;

    RAISE NOTICE 'Data migration mapping complete.';
END;
$$ LANGUAGE plpgsql;

-- Step 2.4: Prepare the logs table and run the migration function.
ALTER TABLE public.supplement_logs ADD COLUMN temp_product_id BIGINT;
SELECT public.migrate_old_supplement_logs();
DROP FUNCTION public.migrate_old_supplement_logs();


-- Section 3: Alter `supplement_logs` Table Structure
-- -----------------------------------------------------------------------------
-- Now that the data is mapped, we can finalize the table structure.

-- Step 3.1: Drop the old foreign key constraint.
-- First, find the constraint name. It's usually `supplement_logs_supplement_id_fkey`.
-- If you have a different name, replace it below.
ALTER TABLE public.supplement_logs
DROP CONSTRAINT IF EXISTS supplement_logs_supplement_id_fkey;

-- Step 3.2: Rename `amount` to `servings`.
ALTER TABLE public.supplement_logs
RENAME COLUMN amount TO servings;
COMMENT ON COLUMN public.supplement_logs.servings IS 'Number of servings taken, e.g., 2 pills or 1.5 scoops.';

-- Step 3.3: Drop the now-redundant `unit` column.
ALTER TABLE public.supplement_logs
DROP COLUMN unit;

-- Step 3.4: Drop the old `supplement_id` column.
ALTER TABLE public.supplement_logs
DROP COLUMN supplement_id;

-- Step 3.5: Rename the temporary column to its final name.
ALTER TABLE public.supplement_logs
RENAME COLUMN temp_product_id TO product_id;

-- Step 3.6: Add the new foreign key constraint and make the column NOT NULL.
ALTER TABLE public.supplement_logs
ALTER COLUMN product_id SET NOT NULL;

ALTER TABLE public.supplement_logs
ADD CONSTRAINT supplement_logs_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.supplement_products(id) ON DELETE CASCADE;

-- Step 3.7: Create a new index for efficient querying.
CREATE INDEX idx_supplement_logs_user_product_id ON public.supplement_logs(user_id, product_id);

DO $$
BEGIN
    RAISE NOTICE 'Supplement-related tables have been successfully migrated.';
END;
$$;

COMMIT; -- End Transaction

