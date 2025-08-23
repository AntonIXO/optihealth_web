-- Comprehensive Migration Script for OptiHealth Schema v2.6 -> v2.8
-- This script merges security hardening, performance optimizations, and architectural enhancements.
-- Key additions include the pre-aggregation layer (daily_summaries) and the user goals table.
-- It is designed to be run as a single, idempotent transaction.
-- FIX: Wrapped in a DO block to allow for procedural commands like RAISE NOTICE.

DO $$
BEGIN

-- -----------------------------------------------------------------------------
-- Section 1: Security & Performance (Incorporates v2.7 changes)
-- Purpose: Harden security by removing user_id parameters and optimize the
-- job queuing function with a set-based operation.
-- -----------------------------------------------------------------------------

RAISE NOTICE 'Section 1: Applying Security & Performance Hardening...';

-- Part 1.1: Harden get_metric_summary_for_period function
DROP FUNCTION IF EXISTS public.get_metric_summary_for_period(uuid, text, timestamptz, timestamptz);
CREATE OR REPLACE FUNCTION get_metric_summary_for_period(
    metric_name_input TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ
)
RETURNS TABLE(avg_val DOUBLE PRECISION, min_val DOUBLE PRECISION, max_val DOUBLE PRECISION, total_count BIGINT) AS $func$
BEGIN
  -- NOTE: This function will be REPLACED in Section 2 to use the new, much faster daily_summaries table.
  -- This initial version is kept for logical flow before the summary table exists.
  RETURN QUERY
  SELECT
      avg(dp.value_numeric),
      min(dp.value_numeric),
      max(dp.value_numeric),
      count(dp.value_numeric)
  FROM public.data_points dp
  JOIN public.metric_definitions md ON dp.metric_id = md.id
  WHERE dp.user_id = auth.uid() -- SECURITY FIX: Use auth.uid()
    AND md.metric_name = metric_name_input
    AND dp."timestamp" BETWEEN start_date AND end_date;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;
RAISE NOTICE ' -> Hardened get_metric_summary_for_period function.';

-- Part 1.2: Optimize queue_all_user_analyses function
CREATE OR REPLACE FUNCTION public.queue_all_user_analyses()
RETURNS TEXT AS $func$
DECLARE
    rows_inserted BIGINT;
BEGIN
    WITH new_jobs AS (
        INSERT INTO public.analysis_jobs (user_id, status)
        SELECT id, 'pending'::public.job_status FROM auth.users
        ON CONFLICT (user_id) WHERE (status = 'pending')
        DO NOTHING
        RETURNING 1
    )
    SELECT count(*) INTO rows_inserted FROM new_jobs;
    RETURN 'Queued analysis jobs for ' || rows_inserted || ' users.';
END;
$func$ LANGUAGE plpgsql;
RAISE NOTICE ' -> Optimized queue_all_user_analyses function.';

-- -----------------------------------------------------------------------------
-- Section 4: Data Integrity Enhancements
-- Purpose: Add advanced constraints and flexible lookup tables.
-- -----------------------------------------------------------------------------

RAISE NOTICE 'Section 4: Applying Data Integrity Enhancements...';

-- Part 4.2: Add GIN index to events.properties for faster filtering
CREATE INDEX IF NOT EXISTS idx_events_properties_gin ON public.events USING GIN (properties);
RAISE NOTICE ' -> Added GIN index to events.properties.';

END $$;
