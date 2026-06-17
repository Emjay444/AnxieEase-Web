-- Unify "scheduled" and "approved" status to use only "approved"
-- This migration converts all "scheduled" appointments to "approved"

-- Step 1: Check current status distribution
SELECT 
    status,
    COUNT(*) as count
FROM public.appointments
WHERE status IN ('scheduled', 'approved', 'accepted', 'confirmed', 'confirm', 'accept')
GROUP BY status
ORDER BY count DESC;

-- Step 2: Update all "scheduled" appointments to "approved"
UPDATE public.appointments
SET 
    status = 'approved',
    updated_at = NOW()
WHERE status = 'scheduled';

-- Step 3: Also normalize other legacy statuses to "approved"
UPDATE public.appointments
SET 
    status = 'approved',
    updated_at = NOW()
WHERE status IN ('accepted', 'confirmed', 'confirm', 'accept');

-- Step 4: Verify the migration
SELECT 
    status,
    COUNT(*) as count
FROM public.appointments
GROUP BY status
ORDER BY count DESC;

-- Expected result: No more "scheduled", "accepted", "confirmed", etc.
-- Only: requested, approved, declined, expired, completed

-- Step 5: Update any response messages that mention "scheduled"
UPDATE public.appointments
SET 
    response_message = REPLACE(response_message, 'scheduled', 'approved'),
    updated_at = NOW()
WHERE response_message LIKE '%scheduled%';

COMMIT;
