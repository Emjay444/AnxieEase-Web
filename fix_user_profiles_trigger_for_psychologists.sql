-- Fix user_profiles trigger to prevent psychologist/admin accounts from being inserted
-- This ensures only patient accounts are synced to user_profiles table

-- Step 1: Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Create an improved sync_user_email function that checks user role
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update user_profiles if the user is a patient (not psychologist/admin)
  -- Check the role in raw_user_meta_data to determine user type
  IF (NEW.raw_user_meta_data->>'role' IS NULL 
      OR NEW.raw_user_meta_data->>'role' = 'patient') THEN
    
    -- Update existing user_profiles record if it exists
    UPDATE public.user_profiles 
    SET email = NEW.email 
    WHERE id = NEW.id;
    
    -- Log for debugging (optional)
    RAISE NOTICE 'Synced email for patient user: %', NEW.id;
  ELSE
    -- Log that we're skipping non-patient users (optional)
    RAISE NOTICE 'Skipped email sync for non-patient user (role: %): %', 
                 NEW.raw_user_meta_data->>'role', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger with the updated function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_email();

-- Step 4: Clean up any existing psychologist records from user_profiles
-- This removes psychologists that were accidentally inserted
DELETE FROM public.user_profiles
WHERE id IN (
  SELECT p.id 
  FROM public.psychologists p
  WHERE p.id = public.user_profiles.id
);

-- Step 5: Verify the fix
-- Show counts to confirm separation
DO $$
DECLARE
  patient_count INT;
  psychologist_count INT;
  overlap_count INT;
BEGIN
  -- Count patients in user_profiles
  SELECT COUNT(*) INTO patient_count
  FROM public.user_profiles
  WHERE role = 'patient' OR role IS NULL;
  
  -- Count psychologists in psychologists table
  SELECT COUNT(*) INTO psychologist_count
  FROM public.psychologists;
  
  -- Check for any overlap (should be 0 after cleanup)
  SELECT COUNT(*) INTO overlap_count
  FROM public.user_profiles up
  INNER JOIN public.psychologists p ON up.id = p.id;
  
  RAISE NOTICE '=== VERIFICATION RESULTS ===';
  RAISE NOTICE 'Patients in user_profiles: %', patient_count;
  RAISE NOTICE 'Psychologists in psychologists table: %', psychologist_count;
  RAISE NOTICE 'Overlap (should be 0): %', overlap_count;
  
  IF overlap_count > 0 THEN
    RAISE WARNING 'There are still % psychologists in user_profiles!', overlap_count;
  ELSE
    RAISE NOTICE '✓ Success! No psychologists in user_profiles table.';
  END IF;
END $$;

-- Step 6: Add a comment for documentation
COMMENT ON FUNCTION sync_user_email() IS 
'Syncs email from auth.users to user_profiles ONLY for patient accounts. 
Psychologists and admins are excluded and managed in their respective tables.';
