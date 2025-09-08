-- Fix Mark Joseph's role from 'psychologist' to 'patient'
-- This script corrects the role for Mark Joseph in the user_profiles table

-- First, let's check the current data for Mark Joseph
SELECT 
    id, 
    first_name, 
    last_name, 
    email, 
    role, 
    created_at, 
    updated_at
FROM public.user_profiles 
WHERE email = 'mjmolina444@gmail.com' 
   OR (first_name ILIKE '%mark%' AND last_name ILIKE '%joseph%')
   OR (first_name ILIKE '%mj%' AND last_name ILIKE '%molina%');

-- Update Mark Joseph's role to 'patient'
UPDATE public.user_profiles 
SET 
    role = 'patient',
    updated_at = NOW()
WHERE email = 'mjmolina444@gmail.com';

-- Also fix by ID if email match doesn't work
UPDATE public.user_profiles 
SET 
    role = 'patient',
    updated_at = NOW()
WHERE id = '1b2d48a9-1a2d-4dfb-92ef-632130a15f84';

-- Verify the update
SELECT 
    id, 
    first_name, 
    last_name, 
    email, 
    role, 
    created_at, 
    updated_at
FROM public.user_profiles 
WHERE email = 'mjmolina444@gmail.com' 
   OR id = '1b2d48a9-1a2d-4dfb-92ef-632130a15f84';

-- Also check if there are any other users with incorrect psychologist role
-- (who should be patients instead)
SELECT 
    id, 
    first_name, 
    last_name, 
    email, 
    role, 
    created_at
FROM public.user_profiles 
WHERE role = 'psychologist'
ORDER BY created_at DESC;

-- Optional: Set default role to 'patient' for user_profiles table if not already set
-- ALTER TABLE public.user_profiles ALTER COLUMN role SET DEFAULT 'patient';
