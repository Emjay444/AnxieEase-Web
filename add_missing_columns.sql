-- Add missing columns to existing wearable_devices table
-- Run this in your Supabase SQL editor

-- Step 1: First, let's see what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wearable_devices' 
ORDER BY ordinal_position;

-- Step 2: Add missing columns one by one (only if they don't exist)
DO $$ 
BEGIN
    -- Add device_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wearable_devices' AND column_name = 'device_name') THEN
        ALTER TABLE wearable_devices ADD COLUMN device_name TEXT DEFAULT 'AnxieEase Device';
    END IF;

    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wearable_devices' AND column_name = 'status') THEN
        ALTER TABLE wearable_devices ADD COLUMN status TEXT DEFAULT 'available';
    END IF;

    -- Add battery_level column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wearable_devices' AND column_name = 'battery_level') THEN
        ALTER TABLE wearable_devices ADD COLUMN battery_level INTEGER DEFAULT 100;
    END IF;

    -- Add last_seen_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wearable_devices' AND column_name = 'last_seen_at') THEN
        ALTER TABLE wearable_devices ADD COLUMN last_seen_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Step 3: Insert or update the device (now with existing columns only)
INSERT INTO wearable_devices (device_id)
VALUES ('AnxieEase001')
ON CONFLICT (device_id) DO NOTHING;

-- Step 4: Update the device with the new column values
UPDATE wearable_devices 
SET 
    device_name = 'AnxieEase Sensor #001',
    status = 'available',
    battery_level = 100,
    last_seen_at = NOW()
WHERE device_id = 'AnxieEase001';

-- Step 5: Enable RLS with simple policy
ALTER TABLE wearable_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON wearable_devices;
CREATE POLICY "Enable all for authenticated users" ON wearable_devices
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Step 6: Grant permissions
GRANT ALL ON wearable_devices TO authenticated;

-- Step 7: Verify the setup
SELECT 'Setup completed!' as message;
SELECT column_name FROM information_schema.columns WHERE table_name = 'wearable_devices' ORDER BY ordinal_position;
SELECT * FROM wearable_devices WHERE device_id = 'AnxieEase001';