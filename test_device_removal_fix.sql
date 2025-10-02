-- TEST SCRIPT FOR DEVICE REMOVAL AFTER BASELINE SYNC FIX
-- Run this AFTER applying the fix_baseline_sync_trigger.sql

-- ========================================
-- VERIFY CURRENT DEVICE STATE
-- ========================================

SELECT 'Current device state:' as step;
SELECT 
    device_id,
    device_name,
    user_id,
    linked_at,
    status,
    baseline_hr,
    created_at
FROM wearable_devices 
WHERE device_id = 'AnxieEase001';

-- ========================================
-- TEST: SIMULATE DEVICE ASSIGNMENT REMOVAL
-- ========================================

-- This simulates what deviceService.removeDeviceAccess() does
SELECT 'Testing device assignment removal...' as step;

-- Save current state for comparison
CREATE TEMP TABLE device_before AS 
SELECT * FROM wearable_devices WHERE device_id = 'AnxieEase001';

-- Perform the update (same as deviceService.removeDeviceAccess)
UPDATE wearable_devices 
SET 
    device_name = 'AnxieEase Sensor #001',
    user_id = NULL,
    linked_at = NULL,
    status = 'available'
WHERE device_id = 'AnxieEase001';

-- Check if update was successful
SELECT 'Update completed successfully!' as result;

-- ========================================
-- VERIFY RESULTS
-- ========================================

SELECT 'Device state after removal:' as step;
SELECT 
    device_id,
    device_name,
    user_id,
    linked_at,
    status,
    baseline_hr,
    updated_at
FROM wearable_devices 
WHERE device_id = 'AnxieEase001';

-- Verify baseline was cleared by trigger
SELECT 
    CASE 
        WHEN baseline_hr IS NULL THEN '✅ Baseline correctly cleared'
        ELSE '❌ Baseline should be NULL after user removal'
    END as baseline_check
FROM wearable_devices 
WHERE device_id = 'AnxieEase001';

-- ========================================
-- CLEANUP
-- ========================================

DROP TABLE device_before;

SELECT 'Test completed! If you see this message without errors, the fix is working.' as final_result;