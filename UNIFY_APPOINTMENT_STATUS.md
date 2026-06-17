# Unifying "scheduled" and "approved" Status

## Problem Identified
The codebase had **two different statuses** that meant the same thing:
- **"scheduled"** - Used in some parts (DashboardNew_fixed.jsx)
- **"approved"** - Used in other parts (PatientProfileView.jsx)

This created confusion and inconsistency.

## Solution
**Unified everything to use "approved"** as the single standard status.

### Why "Approved"?
1. ✅ More user-friendly and clear
2. ✅ Better matches the user action ("Approve" button)
3. ✅ More intuitive for patients to understand
4. ✅ Shorter and simpler than "scheduled"

## Changes Made

### 1. Frontend Components

#### `/src/components/DashboardNew_fixed.jsx`
**Before:**
```javascript
const status = action === "approve" ? "scheduled" : "declined";
```

**After:**
```javascript
const status = action === "approve" ? "approved" : "declined";
```

- Confirmation modal now says "Change status to 'approved'" instead of "scheduled"
- Maintains backward compatibility with existing "scheduled" appointments

#### `/src/components/FullCalendar.jsx`
**Before:**
- Legend showed "Scheduled" with green color
- Default status fallback was "scheduled"

**After:**
- Legend shows "Approved" with green color (emerald-600)
- Comments updated to reflect "approved appointments"

#### `/src/components/PatientProfileView.jsx`
- Already used "approved" ✓
- Updated modal text to say "approved" instead of "scheduled"

### 2. Backend Service

#### `/src/services/appointmentService.js`

**Updated Function Names & Logic:**
```javascript
// OLD
const scheduledLike = new Set(["scheduled", "approved", ...]);
const pastScheduledAppointments = appointments.filter(...);

// NEW
const approvedLike = new Set(["approved", "scheduled", ...]); // "scheduled" marked as legacy
const pastApprovedAppointments = appointments.filter(...);
```

**Key Changes:**
1. "approved" is now the primary status
2. "scheduled" is treated as legacy (still supported for backward compatibility)
3. Auto-completion logic uses "approved" terminology
4. Conflict detection checks for "approved" first

### 3. Database Migration

Created `unify_appointment_status_to_approved.sql` to:
1. Check current status distribution
2. Convert all "scheduled" → "approved"
3. Normalize other legacy statuses (accepted, confirmed, etc.) → "approved"
4. Update response messages
5. Verify migration success

## Status Flow (Updated)

```
Patient creates request
    ↓
[requested] ← Waiting for psychologist
    ↓
Psychologist clicks "Approve"
    ↓
[approved] ← Shows in calendar (green)
    ↓
Time passes (after appointment datetime)
    ↓
[completed] ← Auto-marked by system
```

## Supported Statuses (After Unification)

| Status | Description | Color | Used For |
|--------|-------------|-------|----------|
| **requested** | Patient sent request, waiting for approval | Amber | New requests |
| **approved** | Psychologist approved the appointment | Emerald Green | Confirmed appointments |
| **declined** | Psychologist declined the request | Red | Rejected requests |
| **expired** | Request time passed before approval | Gray | Auto-expired requests |
| **cancelled** | Appointment was cancelled | Red | Cancelled by either party |
| **completed** | Appointment finished | Gray | Past appointments |

## Legacy Status Support

The system still **recognizes** these legacy statuses but **converts them** to "approved":
- ~~scheduled~~ → approved
- ~~accepted~~ → approved
- ~~confirmed~~ → approved
- ~~confirm~~ → approved
- ~~accept~~ → approved

This ensures backward compatibility with existing data.

## How to Apply Changes

### 1. Frontend (Automatic)
- Changes are already in the code
- Will take effect immediately on next page load
- No user action required

### 2. Database (Run SQL Migration)
Run the migration file to update existing records:

```bash
# In Supabase SQL Editor or psql:
```
```sql
-- Run: unify_appointment_status_to_approved.sql
```

This will:
- Convert all existing "scheduled" appointments to "approved"
- Normalize other legacy statuses
- Update any messages that reference "scheduled"

### 3. Verify Changes
After migration:
1. Refresh browser (Ctrl+Shift+R)
2. Check calendar - should show "Approved" instead of "Scheduled"
3. Create new appointment request
4. Approve it - should show status as "approved" in database
5. Check patient view - should see "Approved" status

## Benefits of Unification

### For Developers
✅ **Single source of truth** - No more guessing which status to use
✅ **Easier maintenance** - Less conditional logic for status checks
✅ **Clearer code** - Variable names match actual status values

### For Users
✅ **Consistent experience** - Same terminology everywhere
✅ **Clearer communication** - "Approved" is more intuitive than "Scheduled"
✅ **Better UX** - Color coding matches action taken

## Testing Checklist

- [ ] Create new appointment request
- [ ] Approve request - verify status shows as "approved"
- [ ] Check calendar - green appointment should say "Approved"
- [ ] Check database - status column should be "approved"
- [ ] Check patient view - should show "Approved" status
- [ ] Test auto-completion - approved appointments should auto-mark as completed when time passes
- [ ] Test conflict detection - should work with "approved" status

## Rollback Plan (If Needed)

If you need to revert, run:
```sql
UPDATE public.appointments
SET status = 'scheduled', updated_at = NOW()
WHERE status = 'approved';
```

Then revert the code changes using git:
```bash
git checkout HEAD~1 -- src/components/DashboardNew_fixed.jsx
git checkout HEAD~1 -- src/components/FullCalendar.jsx
git checkout HEAD~1 -- src/services/appointmentService.js
```

## Summary

**Before:** Confusing mix of "scheduled" and "approved"
**After:** Clean, unified "approved" status everywhere

All changes maintain backward compatibility while moving forward with a single, clear status name. 🎉
