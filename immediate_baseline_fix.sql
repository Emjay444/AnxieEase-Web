-- IMMEDIATE FIX: SYNC BASELINE FOR CURRENT DEVICE ASSIGNMENT
-- This will fix the NULL baseline_hr issue right now

-- ========================================
-- IMMEDIATE BASELINE SYNC FIX
-- ========================================

-- Update the device baseline to match the user's actual baseline
UPDATE wearable_devices 
SET baseline_hr = (
    SELECT bhr.baseline_hr 
    FROM baseline_heart_rates bhr 
    WHERE bhr.user_id = wearable_devices.user_id
    LIMIT 1
)
WHERE device_id = 'AnxieEase001' 
  AND user_id IS NOT NULL;

-- Verify the fix worked
SELECT 'Baseline sync fix applied!' as result;

SELECT 
    wd.device_id,
    wd.user_id,
    wd.baseline_hr as device_baseline,
    bhr.baseline_hr as user_baseline,
    CASE 
        WHEN wd.baseline_hr = bhr.baseline_hr THEN '✅ NOW SYNCED'
        ELSE '❌ STILL MISMATCH'
    END as sync_status
FROM wearable_devices wd
LEFT JOIN baseline_heart_rates bhr ON wd.user_id = bhr.user_id
WHERE wd.device_id = 'AnxieEase001';

-- ========================================
-- ALSO FIX THE TRIGGER FOR FUTURE ASSIGNMENTS
-- ========================================

-- Ensure trigger exists and works correctly
CREATE OR REPLACE FUNCTION sync_device_baseline()
RETURNS TRIGGER AS $$
BEGIN
    -- When device assignment changes, fetch user's real baseline
    IF (TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id) OR TG_OP = 'INSERT' THEN
        -- Only update baseline if user is being assigned (not removed)
        IF NEW.user_id IS NOT NULL THEN
            -- Get user's baseline and assign to device
            SELECT baseline_hr INTO NEW.baseline_hr
            FROM baseline_heart_rates 
            WHERE user_id = NEW.user_id
            LIMIT 1;
            
            RAISE NOTICE 'Device % assigned to user %, baseline synced: %', 
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_sync_device_baseline ON wearable_devices;

CREATE TRIGGER trigger_sync_device_baseline
    BEFORE INSERT OR UPDATE OF user_id ON wearable_devices
    FOR EACH ROW
    EXECUTE FUNCTION sync_device_baseline();

SELECT 'Trigger recreated for future assignments!' as trigger_status;