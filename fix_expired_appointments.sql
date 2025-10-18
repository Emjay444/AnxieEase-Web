-- Fix Appointments Incorrectly Marked as Expired
-- This script will revert appointments that were marked as "expired" but their scheduled time hasn't passed yet

-- Step 1: Find appointments marked as expired but with future appointment times
-- (Run this first to see what will be affected)
SELECT 
    id,
    user_id,
    psychologist_id,
    appointment_date,
    status,
    response_message,
    created_at,
    updated_at
FROM public.appointments
WHERE status = 'expired'
  AND appointment_date > NOW()
ORDER BY appointment_date;

-- Step 2: Revert expired appointments back to their original status if time hasn't passed
-- For appointments that were pending/requested and incorrectly marked expired
UPDATE public.appointments
SET 
    status = 'requested',
    response_message = NULL,
    updated_at = NOW()
WHERE status = 'expired'
  AND appointment_date > NOW()
  AND (response_message LIKE '%Auto-expired%' OR response_message IS NULL);

-- Step 3: Verify the fix
SELECT 
    id,
    user_id,
    appointment_date,
    status,
    response_message
FROM public.appointments
WHERE appointment_date > NOW()
  AND appointment_date < NOW() + INTERVAL '24 hours'
ORDER BY appointment_date;

-- Note: After running this, refresh your browser to see the updated status
