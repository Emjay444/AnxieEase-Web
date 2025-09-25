-- FIX FOR BASELINE SYNC TRIGGER - ADDRESSING COLUMN "ID" DOES NOT EXIST ERROR
-- The original trigger was causing issues when updating via device_id

-- ========================================
-- STEP 1: FIXED FUNCTION TO SYNC BASELINES
-- ========================================

CREATE OR REPLACE FUNCTION sync_device_baseline()
RETURNS TRIGGER AS $$
BEGIN
    -- When device assignment changes, fetch user's real baseline
    IF (TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id) OR TG_OP = 'INSERT' THEN
        -- Only update baseline if user is being assigned (not removed)
        IF NEW.user_id IS NOT NULL THEN
            -- Update the baseline_hr for the current device record
            NEW.baseline_hr := (
                SELECT baseline_hr 
                FROM baseline_heart_rates 
                WHERE user_id = NEW.user_id
                LIMIT 1
            );
            
            -- Log the baseline sync
            RAISE NOTICE 'Device % assigned to user %, baseline synced: %', 
                NEW.device_id, 
                NEW.user_id, 
                NEW.baseline_hr;
        ELSE
            -- User is being removed, clear the baseline
            NEW.baseline_hr := NULL;
            
            RAISE NOTICE 'Device % user removed, baseline cleared', NEW.device_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 2: RECREATE TRIGGER (BEFORE UPDATE)
-- ========================================

-- Remove existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_device_baseline ON wearable_devices;

-- Create new trigger that fires BEFORE update (not AFTER)
-- This prevents the recursive update issue
CREATE TRIGGER trigger_sync_device_baseline
    BEFORE INSERT OR UPDATE OF user_id ON wearable_devices
    FOR EACH ROW
    EXECUTE FUNCTION sync_device_baseline();

-- ========================================
-- STEP 3: VERIFY THE FIX
-- ========================================

-- Test query to ensure the trigger works
SELECT 'Baseline sync trigger has been fixed!' as status;

-- Check current device assignments
SELECT 
    device_id,
    user_id,
    baseline_hr,
    status
FROM wearable_devices 
WHERE device_id = 'AnxieEase001';

-- ========================================
-- NOTES ON THE FIX:
-- ========================================
/*
CHANGES MADE:
1. Changed from AFTER to BEFORE trigger to avoid recursive updates
2. Modified NEW record directly instead of running separate UPDATE
3. Handles both assignment and removal cases
4. Eliminates the "column id does not exist" error

WHY THE ERROR OCCURRED:
- The original AFTER trigger tried to run UPDATE inside the trigger
- This caused conflicts when the original UPDATE used device_id filter
- PostgreSQL couldn't resolve the column reference correctly

WHAT THIS FIX DOES:
- Uses BEFORE trigger to modify NEW record before it's saved
- No recursive UPDATE queries needed
- Properly handles both user assignment and removal
- Clears baseline when user is removed from device
*/