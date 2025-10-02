-- DIAGNOSTIC SCRIPT: WHY IS BASELINE_HR NULL?
-- This will help us understand why the baseline sync isn't working

-- ========================================
-- STEP 1: CHECK CURRENT DEVICE ASSIGNMENT
-- ========================================
SELECT '=== CURRENT DEVICE STATE ===' as section;
SELECT 
    device_id,
    user_id,
    baseline_hr as device_baseline,
    status,
    linked_at
FROM wearable_devices 
WHERE device_id = 'AnxieEase001';

-- ========================================
-- STEP 2: CHECK USER'S BASELINE IN baseline_heart_rates
-- ========================================
SELECT '=== USER BASELINES AVAILABLE ===' as section;
SELECT 
    user_id,
    baseline_hr,
    recorded_readings,
    recording_start_time,
    recording_end_time
FROM baseline_heart_rates
WHERE user_id = (
    SELECT user_id FROM wearable_devices WHERE device_id = 'AnxieEase001'
);

-- ========================================
-- STEP 3: CHECK IF TRIGGER EXISTS
-- ========================================
SELECT '=== TRIGGER STATUS ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_sync_device_baseline';

-- ========================================
-- STEP 4: CHECK FUNCTION EXISTS
-- ========================================
SELECT '=== FUNCTION STATUS ===' as section;
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'sync_device_baseline';

-- ========================================
-- STEP 5: MANUAL SYNC TEST
-- ========================================
SELECT '=== MANUAL SYNC TEST ===' as section;

-- Get the current user_id from the device
DO $$
DECLARE
    current_user_id UUID;
    user_baseline FLOAT8;
BEGIN
    -- Get the current user assigned to the device
    SELECT user_id INTO current_user_id
    FROM wearable_devices 
    WHERE device_id = 'AnxieEase001';
    
    IF current_user_id IS NOT NULL THEN
        -- Get their baseline
        SELECT baseline_hr INTO user_baseline
        FROM baseline_heart_rates 
        WHERE user_id = current_user_id
        LIMIT 1;
        
        RAISE NOTICE 'Device user: %, User baseline: %', current_user_id, user_baseline;
        
        -- Try to update the device baseline manually
        UPDATE wearable_devices 
        SET baseline_hr = user_baseline
        WHERE device_id = 'AnxieEase001';
        
        RAISE NOTICE 'Manual baseline update attempted';
    ELSE
        RAISE NOTICE 'No user assigned to device';
    END IF;
END $$;

-- ========================================
-- STEP 6: VERIFY MANUAL UPDATE WORKED
-- ========================================
SELECT '=== AFTER MANUAL UPDATE ===' as section;
SELECT 
    device_id,
    user_id,
    baseline_hr as device_baseline,
    'Manual update result' as note
FROM wearable_devices 
WHERE device_id = 'AnxieEase001';

-- ========================================
-- STEP 7: JOIN QUERY TO SEE MISMATCH
-- ========================================
SELECT '=== BASELINE COMPARISON ===' as section;
SELECT 
    wd.device_id,
    wd.user_id,
    wd.baseline_hr as device_baseline,
    bhr.baseline_hr as user_baseline,
    CASE 
        WHEN wd.baseline_hr = bhr.baseline_hr THEN '✅ SYNCED'
        WHEN wd.baseline_hr IS NULL AND bhr.baseline_hr IS NOT NULL THEN '❌ DEVICE BASELINE MISSING'
        WHEN wd.baseline_hr IS NOT NULL AND bhr.baseline_hr IS NULL THEN '❌ USER BASELINE MISSING'
        WHEN wd.baseline_hr != bhr.baseline_hr THEN '❌ MISMATCH'
        ELSE '⚠️ UNKNOWN STATE'
    END as sync_status
FROM wearable_devices wd
LEFT JOIN baseline_heart_rates bhr ON wd.user_id = bhr.user_id
WHERE wd.device_id = 'AnxieEase001';