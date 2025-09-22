-- Clean up duplicate devices and implement user-specific device IDs
-- Run this in your Supabase SQL editor

-- Step 1: Check current devices
SELECT device_id, device_name, user_id, status, linked_at 
FROM wearable_devices 
ORDER BY linked_at DESC;

-- Step 2: Delete the old base device (AnxieEase001) if it exists without user
DELETE FROM wearable_devices 
WHERE device_id = 'AnxieEase001' 
AND user_id IS NULL;

-- Step 3: Keep only user-specific devices (those with user suffix)
-- This query shows what we're keeping
SELECT 'Keeping these user-specific devices:' as info;
SELECT device_id, device_name, user_id, status 
FROM wearable_devices 
WHERE device_id LIKE 'AnxieEase001_%';

-- Step 4: Set up RLS policies
ALTER TABLE wearable_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON wearable_devices;
CREATE POLICY "Enable all for authenticated users" ON wearable_devices
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Step 5: Verify the cleanup
SELECT 'Final device list:' as status;
SELECT device_id, device_name, user_id, status, linked_at 
FROM wearable_devices 
ORDER BY linked_at DESC;