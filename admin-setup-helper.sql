-- Admin Setup Helper Script
-- Use this in your Supabase SQL Editor to manage admin users

-- 1. Check current admins table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admins' 
ORDER BY ordinal_position;

-- 2. View all current admin users
SELECT id, email, created_at 
FROM admins 
ORDER BY created_at DESC;

-- 3. View all Supabase Auth users with their metadata
SELECT 
  id, 
  email, 
  user_metadata,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC;

-- 4. Find users with admin role in metadata but not in admins table
SELECT 
  u.id,
  u.email,
  u.user_metadata,
  a.id as admin_table_id
FROM auth.users u
LEFT JOIN admins a ON u.id = a.id
WHERE u.user_metadata->>'role' = 'admin'
  AND a.id IS NULL;

-- 5. Add a specific user to admins table (replace with actual user ID and email)
-- INSERT INTO admins (id, email) 
-- VALUES ('your-user-id-here', 'admin@example.com');

-- 6. Remove a user from admins table (replace with actual user ID)
-- DELETE FROM admins WHERE id = 'your-user-id-here';

-- 7. Update user metadata to include admin role (use Supabase Auth API instead)
-- This is just for reference - use the adminService.promoteToAdmin() function instead

-- 8. Check RLS policies for admins table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'admins';

-- 9. Test admin access to other tables (should work if user is in admins table)
-- SELECT COUNT(*) FROM psychologists; -- Should work for admins
-- SELECT COUNT(*) FROM patients;      -- Should work for admins

-- 10. Create a test admin user (for development only)
-- DO $$
-- DECLARE
--   test_user_id uuid;
-- BEGIN
--   -- Insert into auth.users (this is usually done via Supabase Auth API)
--   -- For production, create users through the application
--   
--   -- Example: Add existing authenticated user to admins table
--   -- Replace 'existing-user-email@example.com' with actual email
--   INSERT INTO admins (id, email)
--   SELECT id, email 
--   FROM auth.users 
--   WHERE email = 'existing-user-email@example.com'
--   ON CONFLICT (id) DO NOTHING;
-- END $$;
