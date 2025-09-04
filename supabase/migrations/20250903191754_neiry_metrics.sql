-- Migration: Add new cognitive and stress metrics from external CSV source
-- Inserts new metric definitions required for parsing the brainwave/HRV CSV file.
-- Using ON CONFLICT ensures this script can be safely re-run.

INSERT INTO public.metric_definitions (metric_name, category, default_unit, beautiful_name)
VALUES
    ('cognitive_score', 'Cognitive', 'score', 'Cognitive Score'),
    ('focus', 'Cognitive', 'score', 'Focus'),
    ('chill', 'Cognitive', 'score', 'Chill'),
    ('stress', 'Cognitive', 'score', 'Stress'),
    ('self_control', 'Cognitive', 'score', 'Self-Control'),
    ('anger', 'Cognitive', 'score', 'Anger'),
    ('relaxation_index', 'Cognitive', 'index', 'Relaxation Index'),
    ('concentration_index', 'Cognitive', 'index', 'Concentration Index'),
    ('fatigue_score', 'Cognitive', 'score', 'Fatigue Score'), -- Corrected typo from "fatique"
    ('reverse_fatigue', 'Cognitive', 'score', 'Reverse Fatigue'), -- Corrected typo
    ('alpha_gravity', 'Cognitive', 'score', 'Alpha Gravity')
ON CONFLICT (metric_name) DO NOTHING;

-- Note: 'hr' (heart rate) is already expected to be in the table from the initial schema.
-- We do not add it here.