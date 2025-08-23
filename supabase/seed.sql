-- Seeding Initial Data for PIHS

INSERT INTO public.metric_definitions (metric_name, category, default_unit) VALUES
 
-- Trainings
('activity_steps', 'Trainings', 'count'),
('workout_duration', 'Trainings', 'seconds'),
('workout_distance', 'Trainings', 'meters'),
('workout_calories_burned', 'Trainings', 'kcal'),
('workout_type', 'Trainings', 'text'),
-- Vitals & Heart
('hr_resting', 'Vitals & Heart', 'bpm'),
('hr', 'Vitals & Heart', 'bpm'),
('hrv_rmssd', 'Vitals & Heart', 'milliseconds'),
('body_temperature', 'Vitals & Heart', 'celsius'),
('blood_oxygen_spo2', 'Vitals & Heart', 'percentage'),
('respiratory_rate', 'Vitals & Heart', 'breaths_per_minute'),
-- Sleep
('sleep_duration_total', 'Sleep', 'minutes'),
('sleep_duration_deep', 'Sleep', 'minutes'),
('sleep_duration_light', 'Sleep', 'minutes'),
('sleep_duration_rem', 'Sleep', 'minutes'),
('sleep_duration_awake', 'Sleep', 'minutes'),
('sleep_score', 'Sleep', 'number'),
('sleep_stages', 'Sleep', 'json'),
-- Mental Health & Mood
('mental_health_log', 'Mental Health', 'text'),
-- Environment
('environment_uv_index', 'Environment', 'index'),
('environment_air_quality', 'Environment', 'aqi'),
('environment_pressure', 'Environment', 'hPa'),
('environment_location', 'Environment', 'geography'),
-- Nutrition
('nutrition_calories', 'Nutrition', 'kcal'),
('nutrition_sugar', 'Nutrition', 'grams'),
('nutrition_glucose_blood', 'Nutrition', 'mg/dL'),
-- Blood pressure
('blood_pressure_systolic', 'Blood pressure', 'mmHg'),
('blood_pressure_diastolic', 'Blood pressure', 'mmHg')
ON CONFLICT (metric_name) DO NOTHING;

INSERT INTO public.supplement_definitions (supplement_name, category) VALUES
('Vitamin D3', 'Vitamin'),
('Magnesium Glycinate', 'Mineral'),
('Ashwagandha', 'Adaptogen'),
('Creatine Monohydrate', 'Performance')
ON CONFLICT (supplement_name) DO NOTHING;