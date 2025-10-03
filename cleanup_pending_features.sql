-- Cleanup Pending Admin Features
-- Run this in your Supabase SQL Editor to remove the pending admin functionality

-- Step 1: Remove the pending-related columns from admin_profiles table
ALTER TABLE admin_profiles 
DROP COLUMN IF EXISTS setup_completed,
DROP COLUMN IF EXISTS invitation_token,
DROP COLUMN IF EXISTS updated_at;

-- Step 2: Remove the helper function for generating pending admin IDs
DROP FUNCTION IF EXISTS generate_pending_admin_id();

-- Step 3: Restore the original user sync trigger (if needed)
-- This ensures normal user profile syncing works correctly
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the corresponding user_profiles record
  UPDATE public.user_profiles 
  SET email = NEW.email 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Verify the cleanup
SELECT 'Pending admin features cleaned up successfully' as status;

-- Step 5: Check current admin_profiles structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'admin_profiles' 
ORDER BY ordinal_position;