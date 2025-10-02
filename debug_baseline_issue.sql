-- DEBUG BASELINE SYNC ISSUE - COMPREHENSIVE INVESTIGATION
-- Let's find out exactly why the baseline sync isn't working

-- ========================================
-- STEP 1: CHECK IF BASELINE_HEART_RATES TABLE IS ACCESSIBLE
-- ========================================
SELECT '=== CHECKING BASELINE_HEART_RATES TABLE ===' as section;

-- Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'baseline_heart_rates'
ORDER BY ordinal_position;

-- Check all data in baseline_heart_rates
SELECT 'All baselines in system:' as info;
SELECT 
    user_id,
    baseline_hr,
    recorded_readings,
    recording_start_time,
    recording_end_time
FROM baseline_heart_rates
ORDER BY recording_end_time DESC;

-- ========================================
-- STEP 2: CHECK CURRENT WEARABLE DEVICE STATE
-- ========================================
SELECT '=== CURRENT DEVICE STATE ===' as section;
SELECT 
    device_id,
    user_id,
    baseline_hr,
    status,
    linked_at,
    updated_at
FROM wearable_devices 
WHERE device_id = 'AnxieEase001';

-- ========================================
-- STEP 3: TEST DIRECT BASELINE LOOKUP
-- ========================================
SELECT '=== DIRECT BASELINE LOOKUP TEST ===' as section;

-- Test if we can directly find the baseline for current device user
SELECT 
    'Direct lookup result:' as test,
    wd.user_id as device_user,
    bhr.baseline_hr as found_baseline
FROM wearable_devices wd
LEFT JOIN baseline_heart_rates bhr ON wd.user_id = bhr.user_id
WHERE wd.device_id = 'AnxieEase001';

-- ========================================
-- STEP 4: MANUAL TRIGGER TEST
-- ========================================
SELECT '=== MANUAL TRIGGER TEST ===' as section;

-- Create a simple test function that mimics what the trigger should do
CREATE OR REPLACE FUNCTION test_baseline_lookup(test_user_id UUID)
RETURNS FLOAT8 AS $$
DECLARE
    found_baseline FLOAT8;
BEGIN
    SELECT baseline_hr INTO found_baseline
    FROM baseline_heart_rates 
    WHERE user_id = test_user_id
    ORDER BY recording_end_time DESC
    LIMIT 1;
    
    RAISE NOTICE 'Manual lookup for user %: found baseline %', test_user_id, found_baseline;
    
    RETURN found_baseline;
END;
$$ LANGUAGE plpgsql;

-- Test the lookup function with current device user
DO $$
DECLARE
    current_user_id UUID;
    test_baseline FLOAT8;
BEGIN
    -- Get current device user
    SELECT user_id INTO current_user_id
    FROM wearable_devices 
    WHERE device_id = 'AnxieEase001';
    
    -- Test baseline lookup
    SELECT test_baseline_lookup(current_user_id) INTO test_baseline;
    
    RAISE NOTICE 'Test completed for user %: baseline = %', current_user_id, test_baseline;
END $$;

-- ========================================
-- STEP 5: CHECK IF TRIGGER IS ACTUALLY FIRING
-- ========================================
SELECT '=== TRIGGER FIRING TEST ===' as section;

-- Create a simple trigger that just logs when it fires
CREATE OR REPLACE FUNCTION debug_trigger_test()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'DEBUG: Trigger fired! Operation: %, Device: %, Old User: %, New User: %', 
        TG_OP, 
        NEW.device_id,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.user_id ELSE NULL END,
        NEW.user_id;
    
    -- Just return NEW without any changes for now
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace current trigger with debug version
DROP TRIGGER IF EXISTS trigger_sync_device_baseline ON wearable_devices;
CREATE TRIGGER trigger_sync_device_baseline
    BEFORE UPDATE ON wearable_devices
    FOR EACH ROW
    EXECUTE FUNCTION debug_trigger_test();

-- Force an update to test if trigger fires
UPDATE wearable_devices 
SET updated_at = NOW()
WHERE device_id = 'AnxieEase001';

SELECT 'Debug trigger installed and tested - check logs for NOTICE messages!' as debug_status;

-- ========================================
-- STEP 6: PERMISSIONS CHECK
-- ========================================
SELECT '=== PERMISSIONS CHECK ===' as section;

-- Check if there are any RLS policies blocking access
SELECT 
    pt.schemaname,
    pt.tablename,
    pt.rowsecurity,
    pp.policies
FROM pg_tables pt
LEFT JOIN (
    SELECT 
        schemaname,
        tablename,
        array_agg(policyname) as policies
    FROM pg_policies 
    GROUP BY schemaname, tablename
) pp ON pt.schemaname = pp.schemaname AND pt.tablename = pp.tablename
WHERE pt.tablename IN ('wearable_devices', 'baseline_heart_rates');

-- ========================================
-- FINAL MANUAL UPDATE TEST
-- ========================================
SELECT '=== FINAL MANUAL UPDATE TEST ===' as section;

-- Try to manually update the baseline right now
UPDATE wearable_devices 
SET baseline_hr = (
    SELECT baseline_hr 
    FROM baseline_heart_rates 
    WHERE user_id = wearable_devices.user_id
    ORDER BY recording_end_time DESC
    LIMIT 1
)
WHERE device_id = 'AnxieEase001' AND user_id IS NOT NULL;

-- Check if manual update worked
SELECT 
    'Manual update result:' as test,
    device_id,
    user_id,
    baseline_hr as updated_baseline
FROM wearable_devices 
WHERE device_id = 'AnxieEase001';

DROP FUNCTION IF EXISTS test_baseline_lookup(UUID);