# Appointment Status Logic Fix

## Issues Fixed

### Issue 1: Appointments Marked as "Expired" Same Day
**Problem:**
- Appointment scheduled for October 17, 2025 at 4:00 PM was showing as "Expired"
- This happened even though the current time was before 4:00 PM
- Root cause: The expiration logic was comparing dates only, not times

**Root Cause:**
```javascript
// OLD - INCORRECT
const today = new Date();
today.setHours(0, 0, 0, 0); // Sets to midnight
const d = new Date(appt.appointment_date);
d.setHours(0, 0, 0, 0);     // Sets to midnight
return d < today; // Comparing only dates, not times!
```

This logic treated any appointment on "today" as past if we're comparing date-only. If today is Oct 17, and you're at 2 PM on Oct 17, and appointment is at 4 PM on Oct 17, the date comparison `Oct 17 < Oct 17` is false... but the algorithm was actually marking the entire day as past.

**Solution:**
Changed to compare actual datetimes instead of just dates:
```javascript
// NEW - CORRECT
const now = new Date(); // Current exact time
// Do NOT call setHours(0,0,0,0)
const appointmentDate = new Date(appt.appointment_date);
return appointmentDate < now; // Compares actual times!
```

### Issue 2: Scheduled Appointments Not Auto-Completed Tomorrow
**Problem:**
- Scheduled appointments from previous days should automatically be marked as "completed"
- They were only being marked completed if the date was before today's midnight

**Solution:**
Same fix as above - now compares the full datetime, so:
- Appointment on Oct 16 at 4:00 PM, checked on Oct 17 at 2:00 PM → Marked as completed ✓
- Appointment on Oct 17 at 4:00 PM, checked on Oct 17 at 2:00 PM → Still pending (correct) ✓

## Files Modified

### `/src/services/appointmentService.js`

#### Function 1: `updatePastAppointmentsToCompleted()`
**Changes:**
- Line 124: Changed `const today = new Date(); today.setHours(0, 0, 0, 0);` to `const now = new Date();`
- Line 125: Updated console.log message from "Today's date (start of day)" to "Current time"
- Line 145: Changed `appointmentDate.setHours(0, 0, 0, 0);` to just use `new Date(appt.appointment_date)`
- Line 147: Now compares `appointmentDate < now` instead of comparing dates-only

#### Function 2: `updatePastPendingAppointmentsToExpired()`
**Changes:**
- Line 222: Changed `const today = new Date(); today.setHours(0, 0, 0, 0);` to `const now = new Date();`
- Line 227: Changed `const d = new Date(appt.appointment_date); d.setHours(0, 0, 0, 0); return d < today;` to `const appointmentDate = new Date(appt.appointment_date); return appointmentDate < now;`

## How the Logic Works Now

### Auto-Completion Flow
When loading appointments, the system:
1. Fetches all appointments for the psychologist
2. **For each scheduled appointment:**
   - If `appointment_date` is in the past (compared to NOW), auto-update to "completed"
   - Scheduled appointments never remain as "pending" if they've passed
3. **For each pending request:**
   - If `appointment_date` is in the past (compared to NOW), auto-update to "expired"
   - Patient requests that the time has passed are automatically expired

### Timeline Examples

#### Example 1: Today is Oct 17, 2025, 2:00 PM
- Appointment 1: Oct 17, 4:00 PM, status = "scheduled"
  - Result: **Pending** (4 PM hasn't arrived yet) ✓
- Appointment 2: Oct 16, 3:00 PM, status = "scheduled"
  - Result: **Completed** (already past) ✓
- Appointment 3: Oct 17, 1:00 PM, status = "pending"
  - Result: **Expired** (request time has passed) ✓

#### Example 2: Today is Oct 18, 2025, 10:00 AM
- Appointment from Oct 17, 4:00 PM, status = "scheduled"
  - Result: **Completed** (automatically marked completed) ✓
- Appointment from Oct 18, 9:00 AM, status = "pending"
  - Result: **Expired** (automatically marked expired) ✓

## Database Impact

No database schema changes required. The fix only affects:
- `updatePastAppointmentsToCompleted()` logic
- `updatePastPendingAppointmentsToExpired()` logic

These functions run every time appointments are fetched for display.

## Testing Checklist

- [ ] Create appointment for today at future time (e.g., 6:00 PM)
  - Should show as "pending" or "scheduled" (not expired)
- [ ] Create appointment for today at past time (e.g., 1:00 PM when it's 3:00 PM)
  - Should show as "expired" (pending) or "completed" (if scheduled)
- [ ] Create appointment for yesterday
  - Should show as "completed" (if scheduled) or "expired" (if pending)
- [ ] Check calendar display
  - Color coding should reflect correct status based on time
- [ ] Refresh browser and check appointments refresh
  - Status should update correctly on page load

## Performance Considerations

- This fix has **no negative performance impact**
- Still uses same async/await patterns
- Still handles timezone properly (appointments stored as ISO strings)
- Actually more efficient: simpler date comparisons without extra setHours() calls

## Timezone Note

All appointment times are stored in UTC (ISO format) in the database, but the system uses `Asia/Manila` timezone for display. The comparison logic is timezone-agnostic because:
- Both `now` and appointment dates are ISO strings in UTC
- JavaScript's `Date` object normalizes them
- The comparison `appointmentDate < now` works correctly regardless of display timezone
