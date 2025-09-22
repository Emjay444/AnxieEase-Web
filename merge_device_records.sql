-- Clean up and merge device records
-- Run this in your Supabase SQL editor

-- Step 1: Check current state
SELECT 'Current devices:' as info;
SELECT device_id, device_name, user_id, status FROM wearable_devices ORDER BY linked_at;

-- Step 2: Delete the duplicate device with user suffix, keep the base one
DELETE FROM wearable_devices 
WHERE device_id LIKE 'AnxieEase001_%';

-- Step 3: Update the base device to show current assignment
-- (This assumes the user 5afad7d should be assigned to the base device)
UPDATE wearable_devices 
SET 
    device_name = 'AnxieEase Device (User: 5afad7d)',
    user_id = '5afad7d4-3dcd-4353-badb-4f155303419a',
    status = 'assigned',
    linked_at = NOW()
WHERE device_id = 'AnxieEase001';

-- Step 4: Verify the result
SELECT 'After cleanup:' as info;
SELECT device_id, device_name, user_id, status, linked_at FROM wearable_devices;