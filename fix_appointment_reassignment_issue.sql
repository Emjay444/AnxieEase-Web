-- Fix Appointment Reassignment Issue
-- Problem: When patients are reassigned to different psychologists, 
-- their existing appointments still show up in the original psychologist's calendar
-- Solution: Update appointments automatically when patient assignments change

-- Step 1: Clean up existing mismatched appointments
-- Update appointments where the psychologist_id doesn't match the patient's current assignment
UPDATE public.appointments 
SET psychologist_id = up.assigned_psychologist_id
FROM public.user_profiles up 
WHERE appointments.user_id = up.id 
  AND up.role = 'patient'
  AND up.assigned_psychologist_id IS NOT NULL
  AND appointments.psychologist_id != up.assigned_psychologist_id
  AND appointments.status IN ('pending', 'requested', 'approved', 'scheduled');

-- Step 2: Handle appointments for unassigned patients
-- For patients who are no longer assigned to any psychologist, 
-- we can either cancel these appointments or leave them with the original psychologist
-- Let's cancel pending/requested appointments for unassigned patients
UPDATE public.appointments 
SET status = 'cancelled',
    response_message = 'Automatically cancelled - patient unassigned',
    updated_at = NOW()
FROM public.user_profiles up 
WHERE appointments.user_id = up.id 
  AND up.role = 'patient'
  AND up.assigned_psychologist_id IS NULL
  AND appointments.status IN ('pending', 'requested');

-- Step 3: Create a trigger function to automatically update appointments when patient assignments change
CREATE OR REPLACE FUNCTION sync_appointment_psychologist_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if this is a patient and the assigned_psychologist_id changed
  IF NEW.role = 'patient' AND (OLD.assigned_psychologist_id IS DISTINCT FROM NEW.assigned_psychologist_id) THEN
    
    -- If patient is being assigned to a new psychologist
    IF NEW.assigned_psychologist_id IS NOT NULL THEN
      -- Update pending/requested/approved/scheduled appointments to the new psychologist
      UPDATE public.appointments 
      SET psychologist_id = NEW.assigned_psychologist_id,
          updated_at = NOW()
      WHERE user_id = NEW.id 
        AND status IN ('pending', 'requested', 'approved', 'scheduled');
        
      -- Log the change
      RAISE NOTICE 'Updated appointments for patient % to psychologist %', NEW.id, NEW.assigned_psychologist_id;
      
    -- If patient is being unassigned (set to NULL)
    ELSE
      -- Cancel pending/requested appointments for unassigned patients
      UPDATE public.appointments 
      SET status = 'cancelled',
          response_message = 'Automatically cancelled - patient unassigned',
          updated_at = NOW()
      WHERE user_id = NEW.id 
        AND status IN ('pending', 'requested');
        
      -- Keep approved/scheduled appointments with original psychologist
      -- (they can decide whether to keep or cancel these)
      
      RAISE NOTICE 'Cancelled pending appointments for unassigned patient %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger on user_profiles table
DROP TRIGGER IF EXISTS trigger_sync_appointment_psychologist_assignment ON public.user_profiles;
CREATE TRIGGER trigger_sync_appointment_psychologist_assignment
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_appointment_psychologist_assignment();

-- Step 5: Create a manual cleanup function for admins to run periodically
CREATE OR REPLACE FUNCTION cleanup_mismatched_appointments()
RETURNS TABLE(
  appointments_updated INTEGER,
  appointments_cancelled INTEGER,
  cleanup_summary TEXT
) AS $$
DECLARE
  updated_count INTEGER := 0;
  cancelled_count INTEGER := 0;
BEGIN
  -- Update appointments where psychologist doesn't match current assignment
  UPDATE public.appointments 
  SET psychologist_id = up.assigned_psychologist_id,
      updated_at = NOW()
  FROM public.user_profiles up 
  WHERE appointments.user_id = up.id 
    AND up.role = 'patient'
    AND up.assigned_psychologist_id IS NOT NULL
    AND appointments.psychologist_id != up.assigned_psychologist_id
    AND appointments.status IN ('pending', 'requested', 'approved', 'scheduled');
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Cancel appointments for unassigned patients
  UPDATE public.appointments 
  SET status = 'cancelled',
      response_message = 'Automatically cancelled - patient unassigned',
      updated_at = NOW()
  FROM public.user_profiles up 
  WHERE appointments.user_id = up.id 
    AND up.role = 'patient'
    AND up.assigned_psychologist_id IS NULL
    AND appointments.status IN ('pending', 'requested');
  
  GET DIAGNOSTICS cancelled_count = ROW_COUNT;
  
  RETURN QUERY SELECT 
    updated_count,
    cancelled_count,
    CASE 
      WHEN updated_count > 0 OR cancelled_count > 0 THEN 
        format('Cleanup completed: %s appointments updated, %s appointments cancelled', updated_count, cancelled_count)
      ELSE 
        'No cleanup needed - all appointments are properly assigned'
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Add a helper function to check for mismatched appointments
CREATE OR REPLACE FUNCTION check_appointment_assignments()
RETURNS TABLE(
  patient_id UUID,
  patient_name TEXT,
  current_psychologist_id TEXT,
  appointment_count BIGINT,
  mismatched_psychologist_ids TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id as patient_id,
    COALESCE(up.first_name || ' ' || up.last_name, up.email) as patient_name,
    up.assigned_psychologist_id as current_psychologist_id,
    COUNT(a.id) as appointment_count,
    ARRAY_AGG(DISTINCT a.psychologist_id) as mismatched_psychologist_ids
  FROM public.user_profiles up
  LEFT JOIN public.appointments a ON up.id = a.user_id
  WHERE up.role = 'patient'
    AND a.id IS NOT NULL
    AND a.status IN ('pending', 'requested', 'approved', 'scheduled')
    AND (
      (up.assigned_psychologist_id IS NULL) OR 
      (a.psychologist_id != up.assigned_psychologist_id)
    )
  GROUP BY up.id, up.first_name, up.last_name, up.email, up.assigned_psychologist_id
  ORDER BY appointment_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Verification queries
-- Check current state after cleanup
DO $$
DECLARE
  mismatched_count INTEGER;
  total_appointments INTEGER;
BEGIN
  -- Count mismatched appointments
  SELECT COUNT(*) INTO mismatched_count
  FROM public.appointments a
  JOIN public.user_profiles up ON a.user_id = up.id
  WHERE up.role = 'patient'
    AND up.assigned_psychologist_id IS NOT NULL
    AND a.psychologist_id != up.assigned_psychologist_id
    AND a.status IN ('pending', 'requested', 'approved', 'scheduled');
  
  -- Count total active appointments
  SELECT COUNT(*) INTO total_appointments
  FROM public.appointments
  WHERE status IN ('pending', 'requested', 'approved', 'scheduled');
  
  RAISE NOTICE 'Appointment Assignment Status:';
  RAISE NOTICE '- Total active appointments: %', total_appointments;
  RAISE NOTICE '- Mismatched appointments: %', mismatched_count;
  
  IF mismatched_count = 0 THEN
    RAISE NOTICE '✅ All appointments are properly assigned!';
  ELSE
    RAISE NOTICE '⚠️  % appointments need to be fixed', mismatched_count;
  END IF;
END $$;

-- Usage Examples:
-- To manually run cleanup: SELECT * FROM cleanup_mismatched_appointments();
-- To check for issues: SELECT * FROM check_appointment_assignments();

COMMIT;