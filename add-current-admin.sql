-- Add current admin user to admin_profiles table
-- Run this in your Supabase SQL Editor

INSERT INTO admin_profiles (id, email, full_name, created_at, updated_at) 
VALUES (
  '2fad5267-2824-4585-bc9a-b84a6e955e1e', 
  'anxieease@admin.com', 
  'AnxieEase Admin', 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- Verify the admin was added
SELECT * FROM admin_profiles WHERE email = 'anxieease@admin.com';
