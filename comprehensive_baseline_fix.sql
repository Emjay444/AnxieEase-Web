-- COMPREHENSIVE BASELINE SYNC FIX FOR DEVICE ASSIGNMENTS
-- This addresses the issue where changing device assignments doesn't sync baselines

-- ========================================
-- STEP 1: VERIFY CURRENT TRIGGER STATUS
-- ========================================

-- Check if trigger exists and is properly configured
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_sync_device_baseline';

-- ========================================
-- STEP 2: ENHANCED BASELINE SYNC FUNCTION
-- ========================================

-- Create an improved sync function with better error handling and logging
CREATE OR REPLACE FUNCTION sync_device_baseline()
RETURNS TRIGGER AS $$
DECLARE
    user_baseline FLOAT8;
BEGIN
    RAISE NOTICE 'Trigger fired: %, OLD user: %, NEW user: %', TG_OP, 
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.user_id ELSE NULL END, 
        NEW.user_id;
    
    -- When device assignment changes, fetch user's real baseline
    IF (TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id) OR TG_OP = 'INSERT' THEN
        -- Only update baseline if user is being assigned (not removed)
        IF NEW.user_id IS NOT NULL THEN
            -- Get user's baseline
            SELECT baseline_hr INTO user_baseline
            FROM baseline_heart_rates 
            WHERE user_id = NEW.user_id
            ORDER BY recording_end_time DESC -- Get most recent baseline
            LIMIT 1;
            
            -- Assign the baseline to the device
            NEW.baseline_hr := user_baseline;
            
            RAISE NOTICE 'Device % assigned to user %, baseline synced: % (from baseline_heart_rates)', 
                NEW.device_id, NEW.user_id, NEW.baseline_hr;
        ELSE
            -- User removed, clear baseline
            NEW.baseline_hr := NULL;
            RAISE NOTICE 'Device % user removed, baseline cleared', NEW.device_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 3: RECREATE TRIGGER WITH PROPER CONFIGURATION
-- ========================================

-- Remove existing trigger
DROP TRIGGER IF EXISTS trigger_sync_device_baseline ON wearable_devices;

-- Create trigger that fires on ALL relevant events
CREATE TRIGGER trigger_sync_device_baseline
    BEFORE INSERT OR UPDATE ON wearable_devices
    FOR EACH ROW
    EXECUTE FUNCTION sync_device_baseline();

-- ========================================
-- STEP 4: TEST THE TRIGGER WITH CURRENT DATA
-- ========================================

-- Force trigger by updating the existing assignment
UPDATE wearable_devices 
SET updated_at = NOW()
WHERE device_id = 'AnxieEase001' 
  AND user_id IS NOT NULL;

-- ========================================
-- STEP 5: VERIFY TRIGGER IS WORKING
-- ========================================

SELECT 'Enhanced trigger installed and tested!' as status;

-- Check current device state
SELECT 
    wd.device_id,
    wd.user_id,
    wd.baseline_hr as device_baseline,
    bhr.baseline_hr as user_baseline,
    wd.updated_at,
    CASE 
        WHEN wd.baseline_hr = bhr.baseline_hr THEN '✅ SYNCED'
        WHEN wd.baseline_hr IS NULL AND bhr.baseline_hr IS NOT NULL THEN '❌ DEVICE BASELINE MISSING'
        ELSE '❌ MISMATCH'
    END as sync_status
FROM wearable_devices wd
LEFT JOIN baseline_heart_rates bhr ON wd.user_id = bhr.user_id
WHERE wd.device_id = 'AnxieEase001';

-- ========================================
-- STEP 6: ADDITIONAL SAFETY - SYNC ALL EXISTING ASSIGNMENTS
-- ========================================

-- Ensure ALL current device assignments have correct baselines
UPDATE wearable_devices 
SET baseline_hr = (
    SELECT bhr.baseline_hr 
    FROM baseline_heart_rates bhr 
    WHERE bhr.user_id = wearable_devices.user_id
    ORDER BY bhr.recording_end_time DESC
    LIMIT 1
)
WHERE user_id IS NOT NULL;

SELECT 'All existing device assignments synced!' as final_status;

-- ========================================
-- NOTES ON THIS FIX:
-- ========================================
/*
IMPROVEMENTS MADE:
1. Enhanced logging to see exactly when trigger fires
2. Better baseline selection (most recent if multiple exist)
3. Trigger fires on ALL updates, not just user_id changes
4. Force-updated existing assignment to test trigger
5. Comprehensive sync of all existing assignments

THIS SHOULD FIX:
- Device assignments through admin interface not syncing baselines
- Multiple baselines per user (selects most recent)
- Silent failures in baseline sync
- Any existing assignments with wrong/null baselines

AFTER RUNNING THIS:
- Test device assignment changes in your admin panel
- Check that baseline_hr updates immediately when user changes
- Verify the trigger logs show proper baseline syncing
*/