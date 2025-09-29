-- Check the admin_profiles table structure
-- Run this in your Supabase SQL Editor to see the table structure

-- Check table structure and constraints
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'admin_profiles' 
ORDER BY ordinal_position;

-- Check constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'admin_profiles'::regclass;

-- Check if there are any existing records
SELECT * FROM admin_profiles LIMIT 5;
