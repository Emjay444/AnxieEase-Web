-- Fix Device Management - Step by Step
-- Run this in your Supabase SQL editor

-- Step 1: Check existing table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'wearable_devices' 
ORDER BY ordinal_position;

-- Step 2: Add missing columns if they don't exist
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

-- Step 3: Insert or update the AnxieEase001 device
INSERT INTO wearable_devices (device_id, device_name)
VALUES ('AnxieEase001', 'AnxieEase Sensor #001')
ON CONFLICT (device_id) DO UPDATE SET
    device_name = 'AnxieEase Sensor #001';

-- Step 4: Update existing device to have proper status if column was just added
UPDATE wearable_devices 
SET status = 'available' 
WHERE device_id = 'AnxieEase001' AND status IS NULL;

-- Step 5: Enable Row Level Security
ALTER TABLE wearable_devices ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Admins can read all devices" ON wearable_devices;
DROP POLICY IF EXISTS "Admins can insert devices" ON wearable_devices;
DROP POLICY IF EXISTS "Admins can update devices" ON wearable_devices;
DROP POLICY IF EXISTS "Admins can delete devices" ON wearable_devices;

-- Create RLS policies for wearable_devices table
CREATE POLICY "Admins can read all devices" ON wearable_devices
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert devices" ON wearable_devices
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update devices" ON wearable_devices
FOR UPDATE TO authenticated
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

CREATE POLICY "Admins can delete devices" ON wearable_devices
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- Step 7: Fix user_profiles policies
DROP POLICY IF EXISTS "Admins can read all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;

CREATE POLICY "Admins can read all user profiles" ON user_profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'admin'
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Admins can update user profiles" ON user_profiles
FOR UPDATE TO authenticated
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

-- Step 8: Grant permissions
GRANT ALL ON wearable_devices TO authenticated;
GRANT ALL ON user_profiles TO authenticated;

-- Step 9: Create indexes
CREATE INDEX IF NOT EXISTS idx_wearable_devices_device_id ON wearable_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_wearable_devices_user_id ON wearable_devices(user_id);

-- Step 10: Final verification
SELECT 'Setup completed successfully!' as status;
SELECT * FROM wearable_devices WHERE device_id = 'AnxieEase001';