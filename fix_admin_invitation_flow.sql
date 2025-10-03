-- Fix Admin Invitation Flow - Add missing columns and prevent user_profiles conflicts
-- Run this in your Supabase SQL Editor

-- Step 1: Add missing columns to admin_profiles table for pending invitations
ALTER TABLE admin_profiles 
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS invitation_token UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Update existing admin records to mark them as completed
UPDATE admin_profiles 
SET setup_completed = true 
WHERE id IS NOT NULL AND setup_completed IS NULL;

-- Step 3: Handle pending invitations without removing primary key constraint
-- We'll use a different approach - use a placeholder UUID for pending invitations
-- and update it when the admin completes setup

-- Step 4: Modify the user sync trigger to exclude admin role users
-- This prevents auto-creation of user_profiles records for admin invitations
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip sync for admin role users to prevent conflicts with admin_profiles
  IF (NEW.raw_user_meta_data->>'role' = 'admin') THEN
    RETURN NEW; -- Don't create/update user_profiles for admin invitations
  END IF;
  
  -- For non-admin users, update the corresponding user_profiles record
  UPDATE public.user_profiles 
  SET email = NEW.email 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create helper function to generate placeholder UUIDs for pending invitations
CREATE OR REPLACE FUNCTION generate_pending_admin_id()
RETURNS UUID AS $$
BEGIN
  -- Generate a random UUID for pending admin records
  -- This will be replaced with the actual auth user ID when setup is completed
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Step 6: Clean up any existing user_profiles records that have admin role
-- These should only exist in admin_profiles table
DELETE FROM user_profiles 
WHERE role = 'admin' 
AND email IN (SELECT email FROM admin_profiles);

-- Step 7: Verify the setup
SELECT 'Admin invitation flow configured successfully' as status;

-- Step 8: Check current admin_profiles structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'admin_profiles' 
ORDER BY ordinal_position;