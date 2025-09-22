-- Test queries to verify the setup works
-- Run these in your Supabase SQL editor to verify everything is working

-- 1. Check if wearable_devices table exists and has data
SELECT 'Table exists:' as status, COUNT(*) as device_count FROM wearable_devices;

-- 2. Check the AnxieEase001 device
SELECT * FROM wearable_devices WHERE device_id = 'AnxieEase001';

-- 3. Check available users (patients)
SELECT id, first_name, last_name, email, role 
FROM user_profiles 
WHERE role = 'patient' 
LIMIT 5;

-- 4. Check RLS policies on wearable_devices
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'wearable_devices';

-- 5. Check current user's role (run this while logged in as admin)
SELECT 
  auth.uid() as current_user_id,
  up.role as current_user_role,
  CASE 
    WHEN up.role = 'admin' THEN 'Admin access granted'
    ELSE 'No admin access'
  END as admin_status
FROM user_profiles up 
WHERE up.user_id = auth.uid();