# Appointment Reassignment Fix

## Problem Description
When a patient is reassigned from one psychologist to another in the admin dashboard, their existing appointments continue to appear in the original psychologist's calendar instead of being transferred to the new psychologist's calendar.

## Root Cause
The appointments table has a `psychologist_id` field that was not being updated when the patient's `assigned_psychologist_id` was changed in the `user_profiles` table. This created a data inconsistency where:

1. Patient's current assignment: Psychologist B
2. Patient's existing appointments: Still showing under Psychologist A

## Solution Overview
The fix includes three components:

### 1. Database Trigger (Automatic)
- **File**: `fix_appointment_reassignment_issue.sql`
- **Function**: Automatically updates appointments when patient assignments change
- **Behavior**:
  - When patient is reassigned: Updates pending/requested/approved/scheduled appointments to new psychologist
  - When patient is unassigned: Cancels pending/requested appointments, keeps scheduled ones with original psychologist

### 2. Frontend Service Methods
- **Files**: 
  - `src/services/appointmentService.js` - Added cleanup and check methods
  - `src/services/adminService.js` - Added admin utilities
- **Functions**:
  - `cleanupMismatchedAppointments()` - Manual cleanup function
  - `checkAppointmentAssignmentIssues()` - Diagnostic function

### 3. Data Cleanup
- Fixes existing mismatched appointments in the database
- Handles unassigned patients appropriately

## How It Works

### Automatic (Database Trigger)
```sql
-- Trigger fires when user_profiles.assigned_psychologist_id changes
-- Automatically updates appointments to match new assignment
```

### Manual Cleanup (If Needed)
```javascript
// In admin dashboard, you can call:
const result = await adminService.cleanupAppointmentAssignments();
console.log(result.cleanup_summary);
```

### Diagnostic Check
```javascript
// Check for assignment issues:
const issues = await adminService.checkAppointmentAssignmentIssues();
if (issues.hasIssues) {
  console.log("Found assignment issues:", issues.issues);
}
```

## Implementation Steps

### 1. Run Database Script
Execute `fix_appointment_reassignment_issue.sql` in your Supabase SQL editor:

```sql
-- This will:
-- 1. Clean up existing mismatched appointments
-- 2. Install the automatic trigger
-- 3. Create utility functions
```

### 2. Frontend Changes
The service methods are already added to:
- `appointmentService.js`
- `adminService.js`

### 3. Verification
After running the script, you can verify the fix:

```sql
-- Check for any remaining issues
SELECT * FROM check_appointment_assignments();

-- Manual cleanup if needed
SELECT * FROM cleanup_mismatched_appointments();
```

## Appointment Status Handling

### When Patient is Reassigned
- **Pending/Requested appointments**: Transferred to new psychologist
- **Approved/Scheduled appointments**: Transferred to new psychologist
- **Completed appointments**: Left unchanged (historical data)
- **Cancelled appointments**: Left unchanged

### When Patient is Unassigned
- **Pending/Requested appointments**: Automatically cancelled
- **Approved/Scheduled appointments**: Kept with original psychologist (they can decide)
- **Completed appointments**: Left unchanged
- **Cancelled appointments**: Left unchanged

## Benefits

1. **Automatic Sync**: No manual intervention needed for future reassignments
2. **Data Consistency**: Appointments always reflect current patient assignments
3. **Historical Integrity**: Completed appointments remain with original psychologist
4. **Admin Control**: Manual cleanup tools available when needed
5. **Diagnostic Tools**: Easy to check for and identify issues

## Monitoring

### Check Current Status
```sql
-- See appointment assignment status
DO $$
DECLARE
  mismatched_count INTEGER;
  total_appointments INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatched_count
  FROM public.appointments a
  JOIN public.user_profiles up ON a.user_id = up.id
  WHERE up.role = 'patient'
    AND up.assigned_psychologist_id IS NOT NULL
    AND a.psychologist_id != up.assigned_psychologist_id
    AND a.status IN ('pending', 'requested', 'approved', 'scheduled');
  
  RAISE NOTICE 'Mismatched appointments: %', mismatched_count;
END $$;
```

### Regular Maintenance
You can set up a periodic cleanup job or run manual checks as needed:

```javascript
// In admin dashboard
const checkResult = await adminService.checkAppointmentAssignmentIssues();
if (checkResult.hasIssues) {
  const cleanupResult = await adminService.cleanupAppointmentAssignments();
  console.log(cleanupResult.cleanup_summary);
}
```

## Testing the Fix

1. **Before Fix**: 
   - Assign Patient A to Psychologist 1
   - Patient A requests appointment (appears in Psychologist 1's calendar)
   - Reassign Patient A to Psychologist 2
   - Appointment still appears in Psychologist 1's calendar ❌

2. **After Fix**:
   - Assign Patient B to Psychologist 1
   - Patient B requests appointment (appears in Psychologist 1's calendar)
   - Reassign Patient B to Psychologist 2
   - Appointment automatically moves to Psychologist 2's calendar ✅

## Notes

- The trigger only affects active appointments (pending, requested, approved, scheduled)
- Completed and cancelled appointments are preserved for historical accuracy
- The fix is backward compatible and handles existing data
- All changes are logged for audit purposes