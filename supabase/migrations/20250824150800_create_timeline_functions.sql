-- migration: 20250824150800_create_timeline_functions
-- description: Adds functions to fetch timeline data for dashboard

BEGIN;

/**
 * @function get_daily_timeline
 * @description Fetches all events and data points for a specific day, ordered chronologically
 *
 * @param user_id_input UUID - The user's ID
 * @param target_date DATE - The date to fetch timeline for (defaults to today)
 *
 * @returns TABLE with timeline items including type, timestamp, title, description, value, unit
 */
CREATE OR REPLACE FUNCTION public.get_daily_timeline(
    user_id_input UUID,
    target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    item_type TEXT,
    timestamp_value TIMESTAMPTZ,
    title TEXT,
    description TEXT,
    value_numeric DOUBLE PRECISION,
    value_text TEXT,
    unit TEXT,
    category TEXT,
    properties JSONB
) AS $$
BEGIN
    RETURN QUERY
    -- Events from the events table
    SELECT 
        'event'::TEXT as item_type,
        e.start_timestamp as timestamp_value,
        e.event_name as title,
        e.description,
        NULL::DOUBLE PRECISION as value_numeric,
        NULL::TEXT as value_text,
        NULL::TEXT as unit,
        'event'::TEXT as category,
        e.properties
    FROM public.events e
    WHERE e.user_id = user_id_input
      AND DATE(e.start_timestamp) = target_date
    
    UNION ALL
    
    -- Data points from the data_points table
    SELECT 
        'metric'::TEXT as item_type,
        dp.timestamp as timestamp_value,
        COALESCE(md.beautiful_name, md.metric_name) as title,
        CASE 
            WHEN dp.value_numeric IS NOT NULL THEN 
                CASE 
                    WHEN md.default_unit IS NOT NULL THEN 
                        dp.value_numeric::TEXT || ' ' || md.default_unit
                    ELSE dp.value_numeric::TEXT
                END
            WHEN dp.value_text IS NOT NULL THEN dp.value_text
            ELSE 'Logged'
        END as description,
        dp.value_numeric,
        dp.value_text,
        md.default_unit as unit,
        md.category,
        dp.value_json as properties
    FROM public.data_points dp
    JOIN public.metric_definitions md ON dp.metric_id = md.id
    WHERE dp.user_id = user_id_input
      AND DATE(dp.timestamp) = target_date
    
    UNION ALL
    
    -- Supplement logs
    SELECT 
        'supplement'::TEXT as item_type,
        sl.timestamp as timestamp_value,
        sd.supplement_name as title,
        sl.amount::TEXT || ' ' || sl.unit::TEXT || 
        CASE WHEN sl.notes IS NOT NULL THEN ' - ' || sl.notes ELSE '' END as description,
        sl.amount as value_numeric,
        sl.notes as value_text,
        sl.unit::TEXT as unit,
        'supplement'::TEXT as category,
        json_build_object('notes', sl.notes)::JSONB as properties
    FROM public.supplement_logs sl
    JOIN public.supplement_definitions sd ON sl.supplement_id = sd.id
    WHERE sl.user_id = user_id_input
      AND DATE(sl.timestamp) = target_date
    
    UNION ALL
    
    -- App usage logs (aggregated by hour for readability)
    SELECT 
        'app_usage'::TEXT as item_type,
        date_trunc('hour', aul.start_timestamp) as timestamp_value,
        'Screen Time' as title,
        'Used ' || string_agg(DISTINCT aul.app_name, ', ') || ' for ' || 
        ROUND(SUM(aul.duration_seconds) / 60.0, 1)::TEXT || ' minutes' as description,
        SUM(aul.duration_seconds) as value_numeric,
        string_agg(DISTINCT aul.app_name, ', ') as value_text,
        'seconds'::TEXT as unit,
        'digital_wellness'::TEXT as category,
        json_build_object(
            'total_duration_seconds', SUM(aul.duration_seconds),
            'apps', json_agg(DISTINCT aul.app_name)
        )::JSONB as properties
    FROM public.app_usage_logs aul
    WHERE aul.user_id = user_id_input
      AND DATE(aul.start_timestamp) = target_date
    GROUP BY date_trunc('hour', aul.start_timestamp)
    
    ORDER BY timestamp_value ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

/**
 * @function get_daily_summary_stats
 * @description Gets key summary statistics for the current day
 *
 * @param user_id_input UUID - The user's ID
 * @param target_date DATE - The date to get stats for (defaults to today)
 *
 * @returns TABLE with key metrics for the day
 */
CREATE OR REPLACE FUNCTION public.get_daily_summary_stats(
    user_id_input UUID,
    target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    steps_today BIGINT,
    resting_hr DOUBLE PRECISION,
    sleep_score DOUBLE PRECISION,
    events_count BIGINT,
    metrics_logged BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Steps today
        (SELECT COALESCE(SUM(dp.value_numeric), 0)::BIGINT
         FROM public.data_points dp
         JOIN public.metric_definitions md ON dp.metric_id = md.id
         WHERE dp.user_id = user_id_input
           AND md.metric_name = 'activity_steps'
           AND DATE(dp.timestamp) = target_date) as steps_today,
        
        -- Latest resting heart rate
        (SELECT dp.value_numeric
         FROM public.data_points dp
         JOIN public.metric_definitions md ON dp.metric_id = md.id
         WHERE dp.user_id = user_id_input
           AND md.metric_name = 'hr_resting'
           AND DATE(dp.timestamp) = target_date
         ORDER BY dp.timestamp DESC
         LIMIT 1) as resting_hr,
        
        -- Latest sleep score
        (SELECT dp.value_numeric
         FROM public.data_points dp
         JOIN public.metric_definitions md ON dp.metric_id = md.id
         WHERE dp.user_id = user_id_input
           AND md.metric_name = 'sleep_score'
           AND DATE(dp.timestamp) = target_date
         ORDER BY dp.timestamp DESC
         LIMIT 1) as sleep_score,
        
        -- Events count
        (SELECT COUNT(*)
         FROM public.events e
         WHERE e.user_id = user_id_input
           AND DATE(e.start_timestamp) = target_date) as events_count,
        
        -- Metrics logged count
        (SELECT COUNT(*)
         FROM public.data_points dp
         WHERE dp.user_id = user_id_input
           AND DATE(dp.timestamp) = target_date) as metrics_logged;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMIT;
