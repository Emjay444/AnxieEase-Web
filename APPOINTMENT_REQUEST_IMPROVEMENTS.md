# Appointment Request Handling Improvements

## Summary of Changes

This document outlines the improvements made to the appointment request approval/decline system in the AnxieEase application.

## Issues Found & Fixed

### 1. **Confirmation Modal Enhancement**
- **Issue**: While a confirmation modal already existed, it didn't capture the reason for declining requests
- **Solution**: Enhanced the confirmation modals in both:
  - `DashboardNew_fixed.jsx` (Psychologist Dashboard)
  - `PatientProfileView.jsx` (Patient Profile View when psychologist is managing requests)
  
- Added optional text area for psychologist to provide a decline reason

### 2. **Decline Reason Capture & Storage**
- **Implementation**:
  - Added state: `declineReason` (in DashboardNew_fixed.jsx)
  - Added state: `requestDeclineReason` (in PatientProfileView.jsx)
  - Reason is included in the `response_message` field when updating appointment status
  - Format: `"Declined by psychologist: {reason}"` or `"Declined by psychologist"` if no reason provided

### 3. **Patient-Facing Display of Decline Reason**
- **Location**: Patient's appointment list (Appointments Tab in Patient Profile)
- **Display Logic**:
  - When an appointment has `status = "declined"` and a `responseMessage`, it displays:
    - Red-highlighted box with decline icon
    - "Psychologist Response:" header
    - Full message including the decline reason
  - Existing code already had this display logic, now enhanced with reason content

## Files Modified

### 1. `/src/components/DashboardNew_fixed.jsx`
**Changes:**
- Added state: `const [declineReason, setDeclineReason] = useState("");`
- Updated `confirmAppointmentAction()` to include decline reason in response message
- Enhanced confirmation modal UI to show optional textarea for decline reason when action is "decline"
- Updated cleanup logic to reset declineReason on modal close

**Key Code:**
```javascript
// Decline reason is now captured
let responseMessage = "";
if (action === "approve") {
  responseMessage = "Approved by psychologist";
} else {
  responseMessage = declineReason ? `Declined by psychologist: ${declineReason}` : "Declined by psychologist";
}
```

### 2. `/src/components/PatientProfileView.jsx`
**Changes:**
- Added states:
  - `const [showRequestConfirmModal, setShowRequestConfirmModal] = useState(false);`
  - `const [pendingRequestAction, setPendingRequestAction] = useState(null);`
  - `const [requestDeclineReason, setRequestDeclineReason] = useState("");`

- Refactored `handleRequestAction()` to show confirmation modal instead of immediate action
- Added `confirmRequestAction()` function to handle confirmed actions with reason capture
- Added confirmation modal UI with decline reason textarea
- Modal displays same confirmation details as dashboard

### 3. `/src/services/appointmentService.js`
**No changes required** - Already supports `updateAppointmentStatus(appointmentId, status, notes)` where notes is the decline reason

## User Flow

### Psychologist Dashboard (Main Flow)
1. Psychologist sees pending appointment request card
2. Clicks "Approve" or "Decline" button
3. Confirmation modal appears with action details
4. If declining, psychologist can optionally enter a reason
5. Clicks "Decline" button to confirm
6. Appointment status updates to "declined" with reason stored

### Patient Profile View (When Psychologist Manages Requests)
1. Psychologist clicks "Approve" or "Decline" in Pending Appointment Requests section
2. Confirmation modal appears (same as dashboard)
3. If declining, reason can be entered
4. Confirmation triggers update with reason

### Patient View (Patient Home/Profile)
1. Patient sees their appointments list
2. Declined appointments display in red
3. Contains the decline reason in the response message
4. Patient can read the psychologist's feedback

## Validation & Conflict Checking

The system maintains existing validation:
- **Time Conflict Detection**: When approving/scheduling, checks for conflicts with other appointments
- **Auto-completion**: Past appointments auto-update status
- **Database Constraints**: Enforced via Supabase RLS policies

## Response Message Format

When an appointment is declined:
- **With reason**: `"Declined by psychologist: Patient requested emergency appointment"`
- **Without reason**: `"Declined by psychologist"`

When approved:
- **Always**: `"Approved by psychologist"`

## Testing Recommendations

1. **Test Approve Flow**:
   - Click approve button
   - Confirm in modal
   - Verify appointment appears in calendar
   - Remove from pending requests

2. **Test Decline with Reason**:
   - Click decline button
   - Enter a decline reason
   - Confirm in modal
   - Check patient's view shows the reason

3. **Test Decline without Reason**:
   - Click decline button
   - Leave reason blank
   - Confirm in modal
   - Verify default message shows to patient

4. **Test Modal Cancellation**:
   - Click approve/decline
   - Click cancel in modal
   - Verify request remains unchanged
   - Verify form state is reset

## Database Schema Note

The decline reason is stored in the existing `response_message` column of the `appointments` table:
```sql
-- Column used for storing decline reasons
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS response_message TEXT;
```

This column already exists and is properly utilized.

## Future Enhancements

1. **Predefined Decline Reasons**: Add quick-select buttons for common decline reasons
2. **Reason Templates**: Allow psychologists to create custom decline reason templates
3. **Notification**: Send email/SMS to patient with decline reason
4. **Analytics**: Track common decline reasons to identify patterns
