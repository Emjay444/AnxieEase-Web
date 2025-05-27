-- Create Psychologist Profile Script for AnxieEase
-- This script helps create a psychologist profile for a user that's already registered

-- Replace these values with your actual user information
-- USER_EMAIL: The email of the registered user
-- USER_ID: The auth.uid of the registered user (can be found in the auth.users table)
-- PSYCHOLOGIST_NAME: The full name of the psychologist
-- CONTACT_NUMBER: The contact number of the psychologist
-- LICENSE_NUMBER: The license number of the psychologist

-- Step 1: Create the psychologist profile
INSERT INTO psychologists (
  id, 
  user_id, 
  name, 
  email, 
  contact, 
  is_active, 
  created_at, 
  updated_at
)
VALUES (
  'PSY-' || SUBSTRING(gen_random_uuid()::text, 1, 8), -- Generate a random ID with PSY- prefix
  'YOUR_USER_ID_HERE', -- Replace with actual user ID from auth.users
  'YOUR_PSYCHOLOGIST_NAME_HERE', -- Replace with actual name
  'YOUR_EMAIL_HERE', -- Replace with actual email
  'YOUR_CONTACT_NUMBER_HERE', -- Replace with actual contact
  true, -- Active by default
  NOW(), -- Current timestamp
  NOW() -- Current timestamp
);

-- Step 2: Verify the psychologist profile was created
SELECT * FROM psychologists WHERE email = 'YOUR_EMAIL_HERE';

-- Step 3 (Optional): Update user role to 'psychologist' if needed
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"psychologist"'
)
WHERE email = 'YOUR_EMAIL_HERE';

-- Step 4: Verify the user role was updated
SELECT id, email, raw_user_meta_data->'role' as role 
FROM auth.users 
WHERE email = 'YOUR_EMAIL_HERE'; 