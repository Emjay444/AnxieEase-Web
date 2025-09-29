-- Fix admin_profiles table permissions for admin setup flow
-- Run this in your Supabase SQL Editor

-- First, check if the admin_profiles table exists and has RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admin_profiles';

-- Enable RLS if not already enabled
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow admin profile creation during setup" ON admin_profiles;
DROP POLICY IF EXISTS "Allow admin profile read during setup" ON admin_profiles;
DROP POLICY IF EXISTS "Allow admin profile update during setup" ON admin_profiles;
DROP POLICY IF EXISTS "Allow admin profile delete during setup" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can manage admin profiles" ON admin_profiles;

-- Policy 1: Allow anyone to read admin profiles during setup (for checking if profile exists)
-- This is needed during the setup process before the user is fully authenticated
CREATE POLICY "Allow admin profile read during setup" ON admin_profiles
FOR SELECT TO authenticated
USING (true);

-- Policy 2: Allow anyone to insert admin profiles (for creating invitations)
-- This is needed when the main admin creates new admin invitations
CREATE POLICY "Allow admin profile creation during setup" ON admin_profiles
FOR INSERT TO authenticated
WITH CHECK (true);

-- Policy 3: Allow anyone to update admin profiles during setup
-- This is needed when linking the profile to the auth user
CREATE POLICY "Allow admin profile update during setup" ON admin_profiles
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow anyone to delete admin profiles during setup
-- This is needed when replacing the old profile with the linked one
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
