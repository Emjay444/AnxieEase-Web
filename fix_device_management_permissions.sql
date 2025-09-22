-- Fix Device Management Permissions and Create Missing Tables
-- Run this in your Supabase SQL editor

-- 1. Create wearable_devices table if it doesn't exist
CREATE TABLE IF NOT EXISTS wearable_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL DEFAULT 'AnxieEase Device',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'active', 'maintenance')),
  battery_level INTEGER DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert the AnxieEase001 device if it doesn't exist
INSERT INTO wearable_devices (device_id, device_name, status)
VALUES ('AnxieEase001', 'AnxieEase Sensor #001', 'available')
ON CONFLICT (device_id) DO NOTHING;

-- 3. Enable Row Level Security on wearable_devices
ALTER TABLE wearable_devices ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for wearable_devices table

-- Allow admins to read all devices
CREATE POLICY "Admins can read all devices" ON wearable_devices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- Allow admins to insert devices
CREATE POLICY "Admins can insert devices" ON wearable_devices
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- Allow admins to update devices
CREATE POLICY "Admins can update devices" ON wearable_devices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- Allow admins to delete devices
CREATE POLICY "Admins can delete devices" ON wearable_devices
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- 5. Fix user_profiles table permissions for admin updates

-- Allow admins to read all user profiles
DROP POLICY IF EXISTS "Admins can read all user profiles" ON user_profiles;
CREATE POLICY "Admins can read all user profiles" ON user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'admin'
  )
  OR user_id = auth.uid()
);

-- Allow admins to update user profiles
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;
CREATE POLICY "Admins can update user profiles" ON user_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'admin'
  )
  OR user_id = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'admin'
  )
  OR user_id = auth.uid()
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wearable_devices_device_id ON wearable_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_wearable_devices_user_id ON wearable_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_devices_status ON wearable_devices(status);

-- 7. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_wearable_devices_updated_at ON wearable_devices;
CREATE TRIGGER update_wearable_devices_updated_at
    BEFORE UPDATE ON wearable_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Grant necessary permissions to authenticated users
GRANT ALL ON wearable_devices TO authenticated;
GRANT ALL ON user_profiles TO authenticated;

-- 10. Verify the setup
SELECT 'wearable_devices table created and configured successfully' as status;