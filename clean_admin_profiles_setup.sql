-- Fix admin_profiles table permissions for admin setup flow
-- Run this in your Supabase SQL Editor

-- First, check if the admin_profiles table exists
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admin_profiles';

-- Since RLS is not enabled yet, let's enable it
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies to allow admin setup operations
CREATE POLICY "Allow admin profile read during setup" ON admin_profiles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow admin profile creation during setup" ON admin_profiles
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow admin profile update during setup" ON admin_profiles
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow admin profile delete during setup" ON admin_profiles
FOR DELETE TO authenticated
USING (true);

-- Grant necessary permissions
GRANT ALL ON admin_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'admin_profiles'
ORDER BY policyname;

-- Test query to make sure it works
SELECT COUNT(*) as admin_profiles_count FROM admin_profiles;
