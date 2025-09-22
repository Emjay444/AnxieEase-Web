-- Step-by-step fix: Add columns first, then insert data
-- Run this in your Supabase SQL editor

-- Step 1: Check what columns currently exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'wearable_devices' 
ORDER BY ordinal_position;

-- Step 2: Add missing columns one by one
ALTER TABLE wearable_devices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE wearable_devices ADD COLUMN IF NOT EXISTS battery_level INTEGER DEFAULT 100;
ALTER TABLE wearable_devices ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- Step 3: Now insert/update the device record
INSERT INTO wearable_devices (device_id, device_name, status, battery_level, last_seen_at)
VALUES ('AnxieEase001', 'AnxieEase Sensor #001', 'available', 100, NOW())
ON CONFLICT (device_id) DO UPDATE SET
    device_name = 'AnxieEase Sensor #001',
    status = 'available',
    battery_level = 100,
    last_seen_at = NOW();

-- Step 4: Enable RLS
ALTER TABLE wearable_devices ENABLE ROW LEVEL SECURITY;

-- Step 5: Clean up existing policies and create new one
DROP POLICY IF EXISTS "Enable all for authenticated users" ON wearable_devices;
DROP POLICY IF EXISTS "Authenticated users can read devices" ON wearable_devices;
DROP POLICY IF EXISTS "Authenticated users can insert devices" ON wearable_devices;
DROP POLICY IF EXISTS "Authenticated users can update devices" ON wearable_devices;
DROP POLICY IF EXISTS "Authenticated users can delete devices" ON wearable_devices;

CREATE POLICY "Enable all for authenticated users" ON wearable_devices
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Step 6: Grant permissions
GRANT ALL ON wearable_devices TO authenticated;

-- Step 7: Verify everything works
SELECT 'Setup completed!' as message;
SELECT column_name FROM information_schema.columns WHERE table_name = 'wearable_devices';
SELECT * FROM wearable_devices WHERE device_id = 'AnxieEase001';