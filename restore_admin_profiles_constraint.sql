-- Optional: Restore the foreign key constraint after admin setup is working
-- This ensures data integrity but can be done later

-- Add the foreign key constraint back
ALTER TABLE admin_profiles 
ADD CONSTRAINT admin_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the constraint was added
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'admin_profiles'::regclass;
