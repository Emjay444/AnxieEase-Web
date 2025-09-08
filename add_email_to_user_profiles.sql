-- Add email field to user_profiles table
-- This script adds an email column to the user_profiles table and populates it with data from auth.users

-- Step 1: Add the email column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Create a function to sync email from auth.users to user_profiles
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user is created in auth.users, update the corresponding user_profiles record
  UPDATE public.user_profiles 
  SET email = NEW.email 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create a trigger to automatically sync email when auth.users is updated
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_email();

-- Step 4: Populate existing user_profiles with emails from auth.users
UPDATE public.user_profiles 
SET email = auth.users.email
FROM auth.users 
WHERE public.user_profiles.id = auth.users.id 
AND public.user_profiles.email IS NULL;

-- Step 5: Create a function to get user profile with email for easier querying
CREATE OR REPLACE FUNCTION get_user_profiles_with_email()
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  email TEXT,
  contact_number TEXT,
  emergency_contact TEXT,
  birth_date DATE,
  gender TEXT,
  assigned_psychologist_id UUID,
  role VARCHAR,
  is_email_verified BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.first_name,
    up.middle_name,
    up.last_name,
    COALESCE(up.email, au.email) as email,
    up.contact_number,
    up.emergency_contact,
    up.birth_date,
    up.gender,
    up.assigned_psychologist_id,
    up.role,
    up.is_email_verified,
    up.created_at,
    up.updated_at
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON up.id = au.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profiles_with_email() TO authenticated;

-- Optional: Add a unique constraint on email (uncomment if needed)
-- ALTER TABLE public.user_profiles ADD CONSTRAINT unique_user_profiles_email UNIQUE (email);

-- Optional: Add an index on email for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
