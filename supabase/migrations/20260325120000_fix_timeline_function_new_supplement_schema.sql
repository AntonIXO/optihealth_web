-- migration: 20260325120000_fix_timeline_function_new_supplement_schema
-- description: Update get_daily_timeline to use the post-ontology supplement schema

BEGIN;

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

    -- Supplement logs from the current ontology schema
    SELECT
        'supplement'::TEXT as item_type,
        sl.timestamp as timestamp_value,
        COALESCE(p.name_on_bottle, product_compound.full_name, direct_compound.full_name, 'Supplement') as title,
        (
            sl.dosage_amount::TEXT || ' ' || sl.dosage_unit ||
            CASE WHEN sl.notes IS NOT NULL AND btrim(sl.notes) <> '' THEN ' - ' || sl.notes ELSE '' END
        ) as description,
        sl.dosage_amount::DOUBLE PRECISION as value_numeric,
        sl.notes as value_text,
        sl.dosage_unit as unit,
        'supplement'::TEXT as category,
        json_build_object(
            'notes', sl.notes,
            'dosage_amount', sl.dosage_amount,
            'dosage_unit', sl.dosage_unit,
            'intake_form', sl.intake_form::TEXT,
            'calculated_dosage_mg', sl.calculated_dosage_mg,
            'product_id', sl.product_id,
            'product_name', p.name_on_bottle,
            'vendor_name', v.name,
            'product_compound', product_compound.full_name,
            'compound_id', COALESCE(sl.compound_id, p.compound_id),
            'compound_name', COALESCE(direct_compound.full_name, product_compound.full_name)
        )::JSONB as properties
    FROM public.supplement_logs sl
    LEFT JOIN public.products p ON sl.product_id = p.id
    LEFT JOIN public.vendors v ON p.vendor_id = v.id
    LEFT JOIN public.compounds product_compound ON p.compound_id = product_compound.id
    LEFT JOIN public.compounds direct_compound ON sl.compound_id = direct_compound.id
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

COMMIT;
