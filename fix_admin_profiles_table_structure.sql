-- Fix admin_profiles table to allow invitation flow
-- Run this in your Supabase SQL Editor

-- First check current structure
\d admin_profiles;

-- Option 1: If id is NOT NULL, make it nullable temporarily for invitations
-- Then we'll update it during setup
ALTER TABLE admin_profiles ALTER COLUMN id DROP NOT NULL;

-- Option 2: Or create a separate invitation_token field to track pending invitations
-- This would be a cleaner approach
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS invitation_token UUID DEFAULT gen_random_uuid();
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;

-- Update existing records to mark them as completed
UPDATE admin_profiles SET setup_completed = true WHERE id IS NOT NULL;

-- Check the updated structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_profiles' 
ORDER BY ordinal_position;
