-- File: supabase/migrations/YYYYMMDDHHMMSS_create_bulk_insert_function.sql
-- This function is designed to be called via RPC from a Supabase Edge Function.
-- It efficiently inserts a batch of data points for the currently authenticated user.

-- First, we need a custom type that matches the structure of our JSON payload objects.
-- This allows PostgreSQL to understand the array of objects we'll pass in.
CREATE TYPE public.new_data_point AS (
    metric_source_id BIGINT,
    metric_name TEXT,
    "timestamp" TIMESTAMPTZ,
    value_numeric DOUBLE PRECISION,
    value_text TEXT,
    value_json JSONB,
    value_geography GEOGRAPHY(Point, 4326)
);

-- Now, create the main function.
CREATE OR REPLACE FUNCTION public.bulk_insert_data_points(points public.new_data_point[])
RETURNS void -- It doesn't need to return anything on success.
LANGUAGE plpgsql
-- SECURITY DEFINER is crucial here. It makes the function run with the permissions
-- of the user who defined it (the postgres role), bypassing RLS for the duration
-- of the function. We then manually enforce security by checking auth.uid().
-- This is more performant than letting RLS check every single row during a bulk insert.
SECURITY DEFINER
AS $$
DECLARE
    -- Variable to hold the authenticated user's ID.
    current_user_id UUID := auth.uid();
    -- Variable to iterate through the incoming data points.
    point public.new_data_point;
BEGIN
    -- Check if the user is actually authenticated. If not, raise an exception.
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User is not authenticated.';
    END IF;

    -- Use an UNNEST and a temporary table (via the VALUES clause) for high performance.
    -- This is much faster than looping and inserting one by one.
    INSERT INTO public.data_points (
        user_id,
        metric_source_id,
        metric_id,
        "timestamp",
        value_numeric,
        value_text,
        value_json,
        value_geography
    )
    SELECT
        current_user_id, -- Enforce that all data belongs to the calling user.
        p.metric_source_id,
        md.id, -- Look up the metric_id from the metric_name.
        p.timestamp,
        p.value_numeric,
        p.value_text,
        p.value_json,
        p.value_geography
    FROM
        UNNEST(points) AS p
    -- Join with metric_definitions to convert the text name into a foreign key ID.
    -- This keeps the payload from the client simple (using names) while keeping the
    -- database normalized and efficient (using integer IDs).
    JOIN
        public.metric_definitions md ON md.metric_name = p.metric_name
    -- ON CONFLICT DO NOTHING is the key to preventing duplicates.
    -- If a row with the same unique key (user_id, metric_source_id, metric_id, timestamp)
    -- already exists, the INSERT for that row is simply ignored without raising an error.
    ON CONFLICT (user_id, metric_source_id, metric_id, "timestamp") DO NOTHING;

END;
$$;
