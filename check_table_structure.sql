-- Fix Device Management - Check user_profiles structure first
-- Run this in your Supabase SQL editor

-- Step 1: Check user_profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Step 2: Check wearable_devices table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'wearable_devices' 
ORDER BY ordinal_position;

-- Step 3: Show sample data from user_profiles to understand the structure
SELECT * FROM user_profiles LIMIT 3;