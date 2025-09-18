-- Quick verification script to check psychologist data state
-- Run this in Supabase SQL editor to see what data exists

-- Check current psychologist data structure (name column already removed)
SELECT 
  id,
  user_id,
  email,
  first_name,
  middle_name, 
  last_name,
  is_active,
  avatar_url,
  specialization,
  CASE 
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 
      CASE 
        WHEN middle_name IS NOT NULL AND middle_name != '' THEN 
          concat(first_name, ' ', middle_name, ' ', last_name)
        ELSE 
          concat(first_name, ' ', last_name)
      END
    ELSE 'No Name Available'
  END as constructed_full_name
FROM psychologists 
WHERE is_active = true
ORDER BY created_at DESC;

-- Check if there are user_id mismatches with auth.users
SELECT 
  p.id as psych_id,
  p.user_id as psych_user_id,
  p.email as psych_email,
  p.first_name,
  p.last_name,
  au.id as auth_user_id,
  au.email as auth_email
FROM psychologists p
LEFT JOIN auth.users au ON p.user_id = au.id
WHERE p.is_active = true
ORDER BY p.created_at DESC;

-- Also check user_profiles table for psychologist data
SELECT 
  id,
  email,
  role,
  first_name,
  middle_name,
  last_name,
  avatar_url,
  specialization,
  is_email_verified,
  CASE 
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 
      CASE 
        WHEN middle_name IS NOT NULL AND middle_name != '' THEN 
          concat(first_name, ' ', middle_name, ' ', last_name)
        ELSE 
          concat(first_name, ' ', last_name)
      END
    ELSE 'No Name Available'
  END as constructed_full_name
FROM user_profiles 
WHERE role = 'psychologist'
ORDER BY created_at DESC;