-- Fixed insert for wearable_devices with required fields
-- Run this in your Supabase SQL editor

-- Step 1: Check current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'wearable_devices' 
ORDER BY ordinal_position;

-- Step 2: Insert the device with all required fields
INSERT INTO wearable_devices (device_id, device_name)
VALUES ('AnxieEase001', 'AnxieEase Sensor #001')
ON CONFLICT (device_id) DO UPDATE SET
    device_name = 'AnxieEase Sensor #001';

-- Step 3: Update any existing record to ensure it has proper values
UPDATE wearable_devices 
SET 
    device_name = COALESCE(device_name, 'AnxieEase Sensor #001'),
    status = COALESCE(status, 'available'),
    battery_level = COALESCE(battery_level, 100),
    last_seen_at = COALESCE(last_seen_at, NOW())
WHERE device_id = 'AnxieEase001';

-- Step 4: Enable RLS with simple policy
ALTER TABLE wearable_devices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all for authenticated users" ON wearable_devices;
DROP POLICY IF EXISTS "Authenticated users can read devices" ON wearable_devices;
DROP POLICY IF EXISTS "Authenticated users can insert devices" ON wearable_devices;
DROP POLICY IF EXISTS "Authenticated users can update devices" ON wearable_devices;
DROP POLICY IF EXISTS "Authenticated users can delete devices" ON wearable_devices;

-- Create single comprehensive policy
CREATE POLICY "Enable all for authenticated users" ON wearable_devices
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Step 5: Grant permissions
GRANT ALL ON wearable_devices TO authenticated;

-- Step 6: Verify the setup
SELECT 'Device setup completed successfully!' as status;
SELECT device_id, device_name, status, user_id, linked_at, battery_level 
FROM wearable_devices 
WHERE device_id = 'AnxieEase001';

-- Step 7: Test with available users
SELECT id, first_name, last_name, role 
FROM user_profiles 
WHERE role = 'patient' 
LIMIT 3;