-- migration: 20250824131455_update_get_metric_time_bucketed_date_text
-- description: Update get_metric_time_bucketed to accept date-only strings and handle timezone consistently

BEGIN;

CREATE OR REPLACE FUNCTION public.get_metric_time_bucketed(
    user_id_input UUID,
    metric_name_input TEXT,
    start_date_input TEXT,   -- 'YYYY-MM-DD'
    end_date_input TEXT,     -- 'YYYY-MM-DD'
    bucket_interval TEXT,
    aggregation_type TEXT DEFAULT 'avg'
)
RETURNS TABLE(bucket TIMESTAMPTZ, value DOUBLE PRECISION) AS $$
DECLARE
    metric_record RECORD;
    start_ts TIMESTAMPTZ;
    end_ts TIMESTAMPTZ;
BEGIN
    -- Convert input dates to full-day UTC bounds
    start_ts := (start_date_input || 'T00:00:00Z')::TIMESTAMPTZ;
    end_ts := (end_date_input || 'T23:59:59.999Z')::TIMESTAMPTZ;

    -- Find the metric_id once
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
        CASE
            WHEN lower(aggregation_type) = 'avg' THEN 'avg'
            WHEN lower(aggregation_type) = 'sum' THEN 'sum'
            WHEN lower(aggregation_type) = 'max' THEN 'max'
            WHEN lower(aggregation_type) = 'min' THEN 'min'
            ELSE 'avg'
        END,
        user_id_input,
        metric_record.id,
        start_ts,
        end_ts
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMIT;
