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
('sleep_stages', 'Sleep', 'json', 'Sleep Stages'),
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
('blood_pressure_diastolic', 'Blood pressure', 'mmHg', 'Diastolic Blood Pressure'),

-- Neiry
('cognitive_score', 'Neiry', 'score', 'Cognitive Score'),
('focus', 'Neiry', 'score', 'Focus'),
('chill', 'Neiry', 'score', 'Chill'),
('stress', 'Neiry', 'score', 'Stress'),
('self_control', 'Neiry', 'score', 'Self-Control'),
('anger', 'Neiry', 'score', 'Anger'),
('relaxation_index', 'Neiry', 'index', 'Relaxation Index'),
('concentration_index', 'Neiry', 'index', 'Concentration Index'),
('fatigue_score', 'Neiry', 'score', 'Fatigue Score'),
('reverse_fatigue', 'Neiry', 'score', 'Reverse Fatigue'),
('alpha_gravity', 'Neiry', 'score', 'Alpha Gravity'),

-- Brain
('iAF', 'Brain', 'hz', 'Individual Alpha Frequency'),
('iAPF', 'Brain', 'hz', 'Individual Alpha Peak Frequency')

ON CONFLICT (metric_name) DO UPDATE SET
  beautiful_name = EXCLUDED.beautiful_name;

-- ====================================================================================
-- Supplements seeding
-- ====================================================================================

-- Substances
INSERT INTO public.substances (name, description) VALUES
  ('Magnesium', 'Essential mineral involved in over 300 enzymatic reactions'),
  ('Vitamin D', 'Fat-soluble vitamin essential for calcium absorption and immune function'),
  ('Omega-3', 'Essential fatty acids important for heart and brain health'),
  ('Zinc', 'Essential mineral for immune function and protein synthesis'),
  ('Vitamin C', 'Water-soluble antioxidant vitamin'),
  ('Caffeine', 'Central nervous system stimulant'),
  ('L-Theanine', 'Amino acid found in tea, promotes relaxation'),
  ('Creatine', 'Amino acid derivative for energy production'),
  ('Vitamin B12', 'Water-soluble vitamin essential for nerve function'),
  ('Iron', 'Essential mineral for oxygen transport'),
  ('Calcium', 'Essential mineral for bone health'),
  ('Ashwagandha', 'Adaptogenic herb used in Ayurvedic medicine'),
  ('Rhodiola', 'Adaptogenic herb for stress and fatigue'),
  ('CoQ10', 'Antioxidant compound important for cellular energy'),
  ('Curcumin', 'Active compound in turmeric with anti-inflammatory properties')
ON CONFLICT (name) DO NOTHING;

-- Compounds
WITH substance_ids AS (
  SELECT id, name FROM public.substances
)
INSERT INTO public.compounds (substance_id, name, full_name)
SELECT
  s.id,
  c.compound_name,
  s.name || ' ' || c.compound_name as full_name
FROM substance_ids s
CROSS JOIN (VALUES
  ('L-Threonate'),
  ('Glycinate'),
  ('Citrate'),
  ('Oxide'),
  ('Malate'),
  ('Taurate')
) AS c(compound_name)
WHERE s.name = 'Magnesium'

UNION ALL

-- Vitamin D forms
SELECT s.id, 'D3 (Cholecalciferol)', 'Vitamin D D3 (Cholecalciferol)'
FROM substance_ids s WHERE s.name = 'Vitamin D'
UNION ALL
SELECT s.id, 'D2 (Ergocalciferol)', 'Vitamin D D2 (Ergocalciferol)'
FROM substance_ids s WHERE s.name = 'Vitamin D'

UNION ALL

-- Omega-3 forms
SELECT s.id, 'EPA/DHA', 'Omega-3 EPA/DHA'
FROM substance_ids s WHERE s.name = 'Omega-3'
UNION ALL
SELECT s.id, 'Fish Oil', 'Omega-3 Fish Oil'
FROM substance_ids s WHERE s.name = 'Omega-3'
UNION ALL
SELECT s.id, 'Algae Oil', 'Omega-3 Algae Oil'
FROM substance_ids s WHERE s.name = 'Omega-3'

UNION ALL

-- Zinc forms
SELECT s.id, 'Picolinate', 'Zinc Picolinate'
FROM substance_ids s WHERE s.name = 'Zinc'
UNION ALL
SELECT s.id, 'Citrate', 'Zinc Citrate'
FROM substance_ids s WHERE s.name = 'Zinc'
UNION ALL
SELECT s.id, 'Gluconate', 'Zinc Gluconate'
FROM substance_ids s WHERE s.name = 'Zinc'

UNION ALL

-- Vitamin C forms
SELECT s.id, 'Ascorbic Acid', 'Vitamin C Ascorbic Acid'
FROM substance_ids s WHERE s.name = 'Vitamin C'
UNION ALL
SELECT s.id, 'Liposomal', 'Vitamin C Liposomal'
FROM substance_ids s WHERE s.name = 'Vitamin C'

UNION ALL

-- Caffeine
SELECT s.id, 'Anhydrous', 'Caffeine Anhydrous'
FROM substance_ids s WHERE s.name = 'Caffeine'

UNION ALL

-- L-Theanine
SELECT s.id, '(pure)', 'L-Theanine (pure)'
FROM substance_ids s WHERE s.name = 'L-Theanine'

UNION ALL

-- Creatine forms
SELECT s.id, 'Monohydrate', 'Creatine Monohydrate'
FROM substance_ids s WHERE s.name = 'Creatine'
UNION ALL
SELECT s.id, 'HCl', 'Creatine HCl'
FROM substance_ids s WHERE s.name = 'Creatine'

UNION ALL

-- B12 forms
SELECT s.id, 'Methylcobalamin', 'Vitamin B12 Methylcobalamin'
FROM substance_ids s WHERE s.name = 'Vitamin B12'
UNION ALL
SELECT s.id, 'Cyanocobalamin', 'Vitamin B12 Cyanocobalamin'
FROM substance_ids s WHERE s.name = 'Vitamin B12'

UNION ALL

-- Iron forms
SELECT s.id, 'Ferrous Sulfate', 'Iron Ferrous Sulfate'
FROM substance_ids s WHERE s.name = 'Iron'
UNION ALL
SELECT s.id, 'Ferrous Bisglycinate', 'Iron Ferrous Bisglycinate'
FROM substance_ids s WHERE s.name = 'Iron'

UNION ALL

-- Calcium forms
SELECT s.id, 'Citrate', 'Calcium Citrate'
FROM substance_ids s WHERE s.name = 'Calcium'
UNION ALL
SELECT s.id, 'Carbonate', 'Calcium Carbonate'
FROM substance_ids s WHERE s.name = 'Calcium'

UNION ALL

-- Ashwagandha forms
SELECT s.id, 'Root Extract', 'Ashwagandha Root Extract'
FROM substance_ids s WHERE s.name = 'Ashwagandha'
UNION ALL
SELECT s.id, 'KSM-66', 'Ashwagandha KSM-66'
FROM substance_ids s WHERE s.name = 'Ashwagandha'

UNION ALL

-- Rhodiola
SELECT s.id, 'Rosea Extract', 'Rhodiola Rosea Extract'
FROM substance_ids s WHERE s.name = 'Rhodiola'

UNION ALL

-- CoQ10 forms
SELECT s.id, 'Ubiquinone', 'CoQ10 Ubiquinone'
FROM substance_ids s WHERE s.name = 'CoQ10'
UNION ALL
SELECT s.id, 'Ubiquinol', 'CoQ10 Ubiquinol'
FROM substance_ids s WHERE s.name = 'CoQ10'

UNION ALL

-- Curcumin
SELECT s.id, '(Turmeric Extract)', 'Curcumin (Turmeric Extract)'
FROM substance_ids s WHERE s.name = 'Curcumin'

ON CONFLICT (full_name) DO NOTHING;

-- Vendors
INSERT INTO public.vendors (name, website_url) VALUES
  ('Thorne Research', 'https://www.thorne.com'),
  ('Nootropics Depot', 'https://nootropicsdepot.com'),
  ('Life Extension', 'https://www.lifeextension.com'),
  ('NOW Foods', 'https://www.nowfoods.com'),
  ('Jarrow Formulas', 'https://jarrow.com'),
  ('Doctor''s Best', 'https://www.drbvitamins.com'),
  ('Pure Encapsulations', 'https://www.pureencapsulations.com'),
  ('Garden of Life', 'https://www.gardenoflife.com'),
  ('Nature Made', 'https://www.naturemade.com'),
  ('Optimum Nutrition', 'https://www.optimumnutrition.com'),
  ('Nordic Naturals', 'https://www.nordicnaturals.com'),
  ('Carlson Labs', 'https://www.carlsonlabs.com')
ON CONFLICT (name) DO NOTHING;