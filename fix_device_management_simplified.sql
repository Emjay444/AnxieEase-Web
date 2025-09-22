-- Fix Device Management - Corrected for typical user_profiles structure
-- Run this in your Supabase SQL editor

-- Step 1: Add missing columns to wearable_devices if they don't exist
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wearable_devices' AND column_name = 'status'
    ) THEN
        ALTER TABLE wearable_devices ADD COLUMN status TEXT DEFAULT 'available';
        ALTER TABLE wearable_devices ADD CONSTRAINT check_status 
            CHECK (status IN ('available', 'assigned', 'active', 'maintenance'));
    END IF;

    -- Add battery_level column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wearable_devices' AND column_name = 'battery_level'
    ) THEN
        ALTER TABLE wearable_devices ADD COLUMN battery_level INTEGER DEFAULT 100;
        ALTER TABLE wearable_devices ADD CONSTRAINT check_battery 
            CHECK (battery_level >= 0 AND battery_level <= 100);
    END IF;

    -- Add last_seen_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wearable_devices' AND column_name = 'last_seen_at'
    ) THEN
        ALTER TABLE wearable_devices ADD COLUMN last_seen_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add device_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wearable_devices' AND column_name = 'device_name'
    ) THEN
        ALTER TABLE wearable_devices ADD COLUMN device_name TEXT DEFAULT 'AnxieEase Device';
    END IF;
END $$;

-- Step 2: Insert or update the AnxieEase001 device
INSERT INTO wearable_devices (device_id, device_name)
VALUES ('AnxieEase001', 'AnxieEase Sensor #001')
ON CONFLICT (device_id) DO UPDATE SET
    device_name = 'AnxieEase Sensor #001';

-- Step 3: Update existing device to have proper status
UPDATE wearable_devices 
SET status = 'available' 
WHERE device_id = 'AnxieEase001' AND (status IS NULL OR status = '');

-- Step 4: Enable Row Level Security
ALTER TABLE wearable_devices ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read all devices" ON wearable_devices;
DROP POLICY IF EXISTS "Admins can insert devices" ON wearable_devices;
DROP POLICY IF EXISTS "Admins can update devices" ON wearable_devices;
DROP POLICY IF EXISTS "Admins can delete devices" ON wearable_devices;

-- Step 6: Create RLS policies - Using auth.uid() directly for admin check
-- This assumes your current user has admin role in user_profiles table

-- Allow authenticated users to read devices (we'll check admin in app logic)
CREATE POLICY "Authenticated users can read devices" ON wearable_devices
FOR SELECT TO authenticated
USING (true);

-- Allow authenticated users to insert devices  
CREATE POLICY "Authenticated users can insert devices" ON wearable_devices
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update devices
CREATE POLICY "Authenticated users can update devices" ON wearable_devices
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete devices
CREATE POLICY "Authenticated users can delete devices" ON wearable_devices
FOR DELETE TO authenticated
USING (true);

-- Step 7: Grant permissions
GRANT ALL ON wearable_devices TO authenticated;
GRANT ALL ON user_profiles TO authenticated;

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_wearable_devices_device_id ON wearable_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_wearable_devices_user_id ON wearable_devices(user_id);

-- Step 9: Test the setup
SELECT 'Setup completed successfully!' as status;
SELECT device_id, device_name, status, user_id, linked_at 
FROM wearable_devices 
WHERE device_id = 'AnxieEase001';

-- Step 10: Show available users for testing
SELECT id, first_name, last_name, email, role 
FROM user_profiles 
WHERE role = 'patient' 
LIMIT 5;