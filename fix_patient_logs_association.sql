-- Fix Patient Logs Association Script for AnxieEase
-- This script helps associate anxiety logs with the correct patient ID

-- Step 1: Check the current anxiety_logs table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'anxiety_logs';

-- Step 2: Check the existing logs
SELECT * FROM anxiety_logs LIMIT 10;

-- Step 3: Check the patients table to find the correct patient IDs
SELECT id, name, email, user_id FROM patients;

-- Step 4: Check the auth.users table to see the user IDs
SELECT id, email, raw_user_meta_data FROM auth.users;

-- Step 5: Update the user_id in anxiety_logs to match the patient ID
-- Replace 'USER_EMAIL_HERE' with the actual user email
-- Replace 'PATIENT_ID_HERE' with the correct patient ID
/*
UPDATE anxiety_logs
SET user_id = 'PATIENT_ID_HERE'
WHERE user_id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'USER_EMAIL_HERE'
);
*/

-- Step 6: Verify the update was successful
-- SELECT * FROM anxiety_logs WHERE user_id = 'PATIENT_ID_HERE';

-- Step 7: Create a view that joins anxiety_logs with patient data for easier querying
CREATE OR REPLACE VIEW patient_mood_logs AS
SELECT 
  a.id,
  a.user_id AS patient_id,
  p.name AS patient_name,
  a.date AS log_date,
  a.feelings,
  a.stress_level,
  a.symptoms,
  a.journal,
  a.created_at
FROM 
  anxiety_logs a
LEFT JOIN
  patients p ON a.user_id = p.id;

-- Step 8: Query the view to verify it works
SELECT * FROM patient_mood_logs LIMIT 10; 