-- migration: 20250821162400_create_what_analysis_functions
-- description: Adds a comprehensive suite of database functions for the "What" analysis layer,
-- powering real-time dashboards and summaries.

BEGIN;

-- -----------------------------------------------------------------------------
-- Section 1: Core Metric Analysis (`data_points` table)
-- -----------------------------------------------------------------------------

/**
 * @function get_metric_time_bucketed
 * @description Aggregates a numeric metric into time buckets (e.g., daily, weekly).
 * Essential for generating data for charts.
 *
 * @param user_id_input UUID - The user's ID.
 * @param metric_name_input TEXT - The name of the metric to analyze (e.g., 'hr_resting').
 * @param start_date TIMESTAMPTZ - The beginning of the analysis period.
 * @param end_date TIMESTAMPTZ - The end of the analysis period.
 * @param bucket_interval TEXT - The time interval for bucketing ('hour', 'day', 'week', 'month').
 * @param aggregation_type TEXT - The aggregation to perform ('avg', 'sum', 'max', 'min').
 *
 * @returns TABLE(bucket TIMESTAMPTZ, value DOUBLE PRECISION)
 */
CREATE OR REPLACE FUNCTION public.get_metric_time_bucketed(
    user_id_input UUID,
    metric_name_input TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    bucket_interval TEXT,
    aggregation_type TEXT DEFAULT 'avg'
)
RETURNS TABLE(bucket TIMESTAMPTZ, value DOUBLE PRECISION) AS $$
DECLARE
    metric_record RECORD;
BEGIN
    -- Find the metric_id once to avoid joining in the main query's WHERE clause
    SELECT id INTO metric_record FROM public.metric_definitions WHERE metric_name = metric_name_input;
    IF metric_record IS NULL THEN
        RAISE EXCEPTION 'Metric not found: %', metric_name_input;
    END IF;

    RETURN QUERY EXECUTE format(
        'SELECT
            date_trunc(%L, "timestamp")::TIMESTAMPTZ as bucket,
            %s(value_numeric) as value
        FROM public.data_points
        WHERE user_id = %L AND metric_id = %L AND "timestamp" BETWEEN %L AND %L
        GROUP BY bucket
        ORDER BY bucket ASC;',
        bucket_interval,
        -- Safely inject the aggregation function name
        CASE
            WHEN lower(aggregation_type) = 'avg' THEN 'avg'
            WHEN lower(aggregation_type) = 'sum' THEN 'sum'
            WHEN lower(aggregation_type) = 'max' THEN 'max'
            WHEN lower(aggregation_type) = 'min' THEN 'min'
            ELSE 'avg' -- Default to average
        END,
        user_id_input,
        metric_record.id,
        start_date,
        end_date
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


/**
 * @function get_latest_metric_value
 * @description Retrieves the most recent value for a given numeric metric.
 *
 * @param user_id_input UUID - The user's ID.
 * @param metric_name_input TEXT - The name of the metric.
 *
 * @returns RECORD (value DOUBLE PRECISION, "timestamp" TIMESTAMPTZ)
 */
CREATE OR REPLACE FUNCTION public.get_latest_metric_value(
    user_id_input UUID,
    metric_name_input TEXT
)
RETURNS TABLE (value DOUBLE PRECISION, "timestamp" TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT dp.value_numeric, dp."timestamp"
    FROM public.data_points dp
    JOIN public.metric_definitions md ON dp.metric_id = md.id
    WHERE dp.user_id = user_id_input
      AND md.metric_name = metric_name_input
      AND dp.value_numeric IS NOT NULL
    ORDER BY dp."timestamp" DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


/**
 * @function get_metric_goal_adherence
 * @description Counts the number of days a user met a specific metric goal within a period.
 *
 * @param user_id_input UUID - The user's ID.
 * @param metric_name_input TEXT - The name of the metric.
 * @param start_date TIMESTAMPTZ - The beginning of the period.
 * @param end_date TIMESTAMPTZ - The end of the period.
 * @param operator TEXT - The comparison operator (e.g., '>', '<', '=', '>=').
 * @param goal_value DOUBLE PRECISION - The value to compare against.
 *
 * @returns BIGINT - The number of days the goal was met.
 */
CREATE OR REPLACE FUNCTION public.get_metric_goal_adherence(
    user_id_input UUID,
    metric_name_input TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    operator TEXT,
    goal_value DOUBLE PRECISION
)
RETURNS BIGINT AS $$
DECLARE
    adherent_days BIGINT;
BEGIN
    EXECUTE format(
        'SELECT count(*) FROM (
            SELECT 1
            FROM public.data_points dp
            JOIN public.metric_definitions md ON dp.metric_id = md.id
            WHERE dp.user_id = %L
              AND md.metric_name = %L
              AND dp."timestamp" BETWEEN %L AND %L
              AND dp.value_numeric %s %L
            GROUP BY date_trunc(''day'', dp."timestamp")
        ) as daily_adherence;',
        user_id_input,
        metric_name_input,
        start_date,
        end_date,
        -- Safely validate and inject the operator
        CASE
            WHEN operator IN ('>', '<', '=', '>=', '<=', '!=') THEN operator
            ELSE '='
        END,
        goal_value
    ) INTO adherent_days;

    RETURN adherent_days;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- -----------------------------------------------------------------------------
-- Section 2: Event Analysis (`events` table)
-- -----------------------------------------------------------------------------

/**
 * @function get_event_summary
 * @description Provides a summary of events, including total count and duration.
 *
 * @param user_id_input UUID - The user's ID.
 * @param start_date TIMESTAMPTZ - The beginning of the period.
 * @param end_date TIMESTAMPTZ - The end of the period.
 * @param event_name_filter TEXT - (Optional) Filter by a specific event name.
 *
 * @returns RECORD (total_count BIGINT, total_duration_seconds NUMERIC)
 */
CREATE OR REPLACE FUNCTION public.get_event_summary(
    user_id_input UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    event_name_filter TEXT DEFAULT NULL
)
RETURNS TABLE (total_count BIGINT, total_duration_seconds NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT
        count(*),
        COALESCE(SUM(EXTRACT(EPOCH FROM (end_timestamp - start_timestamp))), 0)
    FROM public.events
    WHERE user_id = user_id_input
      AND start_timestamp BETWEEN start_date AND end_date
      AND (event_name_filter IS NULL OR event_name = event_name_filter);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


/**
 * @function get_event_property_distribution
 * @description Calculates the frequency distribution for a key in the `properties` JSONB field.
 *
 * @param user_id_input UUID - The user's ID.
 * @param start_date TIMESTAMPTZ - The beginning of the period.
 * @param end_date TIMESTAMPTZ - The end of the period.
 * @param property_key TEXT - The JSONB key to analyze (e.g., 'workout_type').
 *
 * @returns TABLE(property_value TEXT, frequency BIGINT)
 */
CREATE OR REPLACE FUNCTION public.get_event_property_distribution(
    user_id_input UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    property_key TEXT
)
RETURNS TABLE(property_value TEXT, frequency BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        properties ->> property_key as prop_val,
        count(*) as freq
    FROM public.events
    WHERE user_id = user_id_input
      AND start_timestamp BETWEEN start_date AND end_date
      AND properties ->> property_key IS NOT NULL
    GROUP BY prop_val
    ORDER BY freq DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- -----------------------------------------------------------------------------
-- Section 3: Structured Log Analysis (`supplement_logs` & `app_usage_logs`)
-- -----------------------------------------------------------------------------

/**
 * @function get_supplement_summary
 * @description Summarizes the total amount of a specific supplement taken over a period.
 *
 * @param user_id_input UUID - The user's ID.
 * @param start_date TIMESTAMPTZ - The beginning of the period.
 * @param end_date TIMESTAMPTZ - The end of the period.
 * @param supplement_name_input TEXT - The name of the supplement.
 *
 * @returns TABLE(total_amount DOUBLE PRECISION, unit TEXT)
 */
CREATE OR REPLACE FUNCTION public.get_supplement_summary(
    user_id_input UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    supplement_name_input TEXT
)
RETURNS TABLE(total_amount DOUBLE PRECISION, unit TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT sum(sl.amount), sl.unit::TEXT
    FROM public.supplement_logs sl
    JOIN public.supplement_definitions sd ON sl.supplement_id = sd.id
    WHERE sl.user_id = user_id_input
      AND sd.supplement_name = supplement_name_input
      AND sl."timestamp" BETWEEN start_date AND end_date
    GROUP BY sl.unit
    ORDER BY sum(sl.amount) DESC; -- Returns totals for each unit used
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


/**
 * @function get_app_usage_summary
 * @description Summarizes total app usage duration, grouped by app name or category.
 *
 * @param user_id_input UUID - The user's ID.
 * @param start_date TIMESTAMPTZ - The beginning of the period.
 * @param end_date TIMESTAMPTZ - The end of the period.
 * @param group_by_key TEXT - How to group results ('app_name' or 'app_category').
 *
 * @returns TABLE(grouping_key TEXT, total_duration_seconds BIGINT)
 */
CREATE OR REPLACE FUNCTION public.get_app_usage_summary(
    user_id_input UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    group_by_key TEXT DEFAULT 'app_category'
)
RETURNS TABLE(grouping_key TEXT, total_duration_seconds BIGINT) AS $$
BEGIN
    IF lower(group_by_key) = 'app_name' THEN
        RETURN QUERY
        SELECT app_name, sum(duration_seconds)::BIGINT
        FROM public.app_usage_logs
        WHERE user_id = user_id_input
          AND start_timestamp BETWEEN start_date AND end_date
        GROUP BY app_name
        ORDER BY sum(duration_seconds) DESC;
    ELSE -- Default to 'app_category'
        RETURN QUERY
        SELECT COALESCE(app_category, 'Uncategorized'), sum(duration_seconds)::BIGINT
        FROM public.app_usage_logs
        WHERE user_id = user_id_input
          AND start_timestamp BETWEEN start_date AND end_date
        GROUP BY app_category
        ORDER BY sum(duration_seconds) DESC;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


COMMIT;