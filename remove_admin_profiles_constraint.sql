-- Remove the foreign key constraint that's causing the 409 Conflict
-- This allows the new invitation flow to work properly

-- Remove the existing foreign key constraint
ALTER TABLE admin_profiles DROP CONSTRAINT admin_profiles_id_fkey;

-- Verify the constraint was removed
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'admin_profiles'::regclass;

-- Check current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_profiles' 
ORDER BY ordinal_position;
