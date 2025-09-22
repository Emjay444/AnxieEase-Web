-- Simplified setup for wearable_devices based on user_profiles structure
-- Run this in your Supabase SQL editor

-- Step 1: Check if wearable_devices exists, if not create it
CREATE TABLE IF NOT EXISTS wearable_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL UNIQUE,
  device_name TEXT DEFAULT 'AnxieEase Device',
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'available',
  battery_level INTEGER DEFAULT 100,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Insert the AnxieEase001 device
INSERT INTO wearable_devices (device_id, device_name, status)
VALUES ('AnxieEase001', 'AnxieEase Sensor #001', 'available')
ON CONFLICT (device_id) DO UPDATE SET
    device_name = 'AnxieEase Sensor #001',
    status = 'available';

-- Step 3: Enable RLS with simple policies
ALTER TABLE wearable_devices ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable all for authenticated users" ON wearable_devices;

-- Create simple policy for authenticated users
CREATE POLICY "Enable all for authenticated users" ON wearable_devices
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Step 4: Grant permissions
GRANT ALL ON wearable_devices TO authenticated;

-- Step 5: Test the setup
SELECT 'Setup complete!' as status;
SELECT * FROM wearable_devices WHERE device_id = 'AnxieEase001';
SELECT id, first_name, last_name, role FROM user_profiles WHERE role = 'patient' LIMIT 3;