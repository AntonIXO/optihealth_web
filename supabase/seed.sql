-- Seeding Initial Data for PIHS

-- This statement inserts metric definitions into the metric_definitions table.
-- It includes various health, wellness, and environmental metrics along with a
-- user-friendly "beautiful_name" for display purposes.
-- The ON CONFLICT clause handles cases where a metric_name already exists.
-- Instead of skipping, it updates the existing row with the new beautiful_name,
-- ensuring that running this script multiple times keeps the data consistent.
INSERT INTO public.metric_definitions (metric_name, category, default_unit, beautiful_name) VALUES
-- Trainings
('activity_steps', 'Trainings', 'count', 'Steps'),
('workout_duration', 'Trainings', 'seconds', 'Workout Duration'),
('workout_distance', 'Trainings', 'meters', 'Workout Distance'),
('workout_calories_burned', 'Trainings', 'kcal', 'Calories Burned'),
('workout_type', 'Trainings', 'text', 'Workout Type'),
-- Vitals & Heart
('hr_resting', 'Vitals & Heart', 'bpm', 'Resting Heart Rate'),
('hr', 'Vitals & Heart', 'bpm', 'Heart Rate'),
('hrv_rmssd', 'Vitals & Heart', 'milliseconds', 'HRV (RMSSD)'),
('body_temperature', 'Vitals & Heart', 'celsius', 'Body Temperature'),
('blood_oxygen_spo2', 'Vitals & Heart', 'percentage', 'Blood Oxygen (SpO2)'),
('respiratory_rate', 'Vitals & Heart', 'breaths_per_minute', 'Respiratory Rate'),
-- Sleep
('sleep_duration_total', 'Sleep', 'minutes', 'Total Sleep'),
('sleep_duration_deep', 'Sleep', 'minutes', 'Deep Sleep'),
('sleep_duration_light', 'Sleep', 'minutes', 'Light Sleep'),
('sleep_duration_rem', 'Sleep', 'minutes', 'REM Sleep'),
('sleep_duration_awake', 'Sleep', 'minutes', 'Time Awake'),
('sleep_score', 'Sleep', 'number', 'Sleep Score'),
('sleep_stages', 'Sleep', 'json', 'Sleep Stages'),
-- Mental Health & Mood
('mental_health_log', 'Mental Health', 'text', 'Mental Health Log'),
-- Environment
('environment_uv_index', 'Environment', 'index', 'UV Index'),
('environment_air_quality', 'Environment', 'aqi', 'Air Quality'),
('environment_pressure', 'Environment', 'hPa', 'Atmospheric Pressure'),
('environment_location', 'Environment', 'geography', 'Location'),
-- Nutrition
('nutrition_calories', 'Nutrition', 'kcal', 'Calories Consumed'),
('nutrition_sugar', 'Nutrition', 'grams', 'Sugar Intake'),
('nutrition_glucose_blood', 'Nutrition', 'mg/dL', 'Blood Glucose'),
-- Blood pressure
('blood_pressure_systolic', 'Blood pressure', 'mmHg', 'Systolic Blood Pressure'),
('blood_pressure_diastolic', 'Blood pressure', 'mmHg', 'Diastolic Blood Pressure')
ON CONFLICT (metric_name) DO UPDATE SET
  beautiful_name = EXCLUDED.beautiful_name;

-- This statement inserts supplement definitions into the supplement_definitions table.
-- The ON CONFLICT clause prevents errors if a supplement_name already exists.
INSERT INTO public.supplement_definitions (supplement_name, category) VALUES
('Vitamin D3', 'Vitamin'),
('Magnesium Glycinate', 'Mineral'),
('Ashwagandha', 'Adaptogen'),
('Creatine Monohydrate', 'Performance')
ON CONFLICT (supplement_name) DO NOTHING;
