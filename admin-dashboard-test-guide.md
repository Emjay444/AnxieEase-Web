# Admin Dashboard Test Cases - Testing Guide

## Test Environment Setup

1. **Prerequisites**:

   - Development server running at `http://localhost:5173/`
   - Admin user account with proper credentials
   - Database with sample psychologists and patients

2. **Access Admin Dashboard**:
   - Navigate to `http://localhost:5173/login`
   - Login with admin credentials
   - Should redirect to `/admin` (admin dashboard)

## Test Case Execution

### AE-DASH-001: Dashboard Overview Statistics

**Test**: Verify display of total psychologists, patients, and active assignments

**Steps**:

1. Login as Admin
2. Navigate to Dashboard (should be automatic)
3. Locate the statistics cards in the overview section

**Expected Results**:

- ✅ **Total Psychologists**: Displays count from `psychologists` table (all records)
- ✅ **Total Patients**: Displays count from `user_profiles` where role is 'patient' or null
- ✅ **Active Assignments**: Displays count of patients with `assigned_psychologist_id` not null

**Implementation Details**:

- Stats calculated by `adminService.getDashboardStats()`
- Data refreshed on component mount and after adding new users
- Breakdown shows Active vs Inactive psychologists

---

### AE-DASH-002: Add Psychologist Quick Action

**Test**: Verify "Add Psychologist" button functionality

**Steps**:

1. On Dashboard, locate "Quick Actions" section
2. Click "Add Psychologist" button
3. Verify navigation behavior

**Expected Results**:

- ✅ **Navigation**: Should switch to "psychologists" tab
- ✅ **UI Update**: Psychologists management section should be displayed
- ✅ **Button Behavior**: Hover effects and visual feedback work properly

**Implementation Details**:

- Button calls `setActiveTab("psychologists")`
- Uses emerald color scheme for consistent branding
- Includes descriptive text: "Create new psychologist profile"

---

### AE-DASH-003: Assign Patient Quick Action

**Test**: Verify "Assign Patient" button functionality

**Steps**:

1. On Dashboard, locate "Quick Actions" section
2. Click "Assign Patient" button
3. Verify navigation behavior

**Expected Results**:

- ✅ **Navigation**: Should switch to "patients" tab
- ✅ **UI Update**: Patient management section should be displayed
- ✅ **Button Behavior**: Hover effects work with blue color scheme

**Implementation Details**:

- Button calls `setActiveTab("patients")`
- Uses blue color scheme for differentiation
- Includes descriptive text: "View and manage patient assignments"

---

### AE-DASH-004: Gender Distribution Chart

**Test**: Validate gender distribution pie chart

**Steps**:

1. Login as Admin
2. Navigate to Dashboard
3. Locate "Gender Distribution" chart in Analytics section
4. Verify chart data matches actual patient counts

**Expected Results**:

- ✅ **Chart Type**: Pie chart with "Male" and "Female" segments
- ✅ **Data Accuracy**: Chart reflects actual patient gender distribution
- ✅ **Colors**: Green for male, red for female with white borders
- ✅ **Legend**: Positioned at bottom of chart
- ✅ **Total Display**: Shows total patient count below chart

**Implementation Details**:

- Data from `analyticsData.genderDistribution.male/female`
- Chart.js Pie component with responsive design
- Colors: `["#22c55e", "#ef4444"]` (green, red)

---

### AE-DASH-005: Age Distribution Chart

**Test**: Validate age distribution bar chart

**Steps**:

1. Login as Admin
2. Navigate to Dashboard
3. Locate "Age Distribution" chart in Analytics section
4. Verify chart shows correct age ranges and counts

**Expected Results**:

- ✅ **Chart Type**: Bar chart with age group ranges (0-4, 5-9, etc.)
- ✅ **Age Groups**: 16 predefined ranges from "0-4" to "75+"
- ✅ **Data Accuracy**: Bars reflect actual patient age distribution
- ✅ **Styling**: Blue bars (#3b82f6) with rounded corners
- ✅ **Tooltips**: Show detailed breakdown for each age group

**Implementation Details**:

- Data from `analyticsData.ageHistogram`
- 16 age groups with 5-year ranges
- Bar chart with `barThickness: 40` and `categoryPercentage: 0.8`
- Custom tooltip showing age breakdown within each group

---

### AE-DASH-006: Monthly Registrations Chart

**Test**: Verify registration trend graph

**Steps**:

1. Login as Admin
2. Navigate to Dashboard
3. Locate "Monthly Registrations" chart in Analytics section
4. Check if graph shows patient registration trends for current year

**Expected Results**:

- ✅ **Chart Type**: Line chart showing monthly registration trends
- ✅ **Time Period**: Displays data for selected year (default: current year)
- ✅ **Data Points**: All 12 months displayed with correct registration counts
- ✅ **Styling**: Smooth line with filled area underneath
- ✅ **Total Summary**: Shows total registrations for selected year

**Implementation Details**:

- Data from `analyticsData.monthlyRegistrations`
- Line chart with filled area (`fill: true`)
- Responsive design with gradient fill
- Shows total registrations below chart

---

### AE-DASH-007: Year Filter Functionality

**Test**: Validate dropdown filter for registration chart

**Steps**:

1. Navigate to Monthly Registrations chart
2. Locate year dropdown (shows current year by default)
3. Click dropdown and select different year (e.g., 2024, 2023)
4. Verify chart updates with new data

**Expected Results**:

- ✅ **Dropdown Display**: Shows current year by default
- ✅ **Year Options**: Available years based on patient registration data
- ✅ **Chart Update**: Graph refreshes when year is changed
- ✅ **Data Accuracy**: Chart shows correct registrations for selected year
- ✅ **Label Update**: Chart title reflects selected year

**Implementation Details**:

- Controlled by `selectedYear` state
- `onChange={(e) => setSelectedYear(parseInt(e.target.value))`
- Triggers `loadAnalyticsData(selectedYear)` on change
- Chart label shows: `Registrations ${selectedYear}`

---

### AE-DASH-008: Data Synchronization

**Test**: Verify updated counts after adding new patient/psychologist

**Steps**:

1. Note current dashboard statistics (Total Psychologists, Total Patients, Active Assignments)
2. Add a new Psychologist through the admin panel
3. Add a new Patient through available interface
4. Navigate back to Dashboard overview
5. Verify statistics have updated

**Expected Results**:

- ✅ **Auto-Refresh**: Statistics update automatically after changes
- ✅ **Accurate Counts**: New totals reflect added users
- ✅ **Real-time Updates**: No manual refresh required
- ✅ **Chart Updates**: Analytics charts also reflect new data

**Implementation Details**:

- `loadDashboardData()` called after psychologist creation
- Statistics recalculated from database on each refresh
- Charts update with new analytics data
- No caching issues preventing updates

## Testing Checklist

### Pre-Test Setup

- [ ] Development server running (`npm run dev`)
- [ ] Admin user credentials available
- [ ] Database has sample data (psychologists and patients)
- [ ] Browser developer tools open for debugging

### During Testing

- [ ] Check console for any JavaScript errors
- [ ] Verify responsive design on different screen sizes
- [ ] Test loading states and error handling
- [ ] Validate data accuracy against database records

### Post-Test Verification

- [ ] All test cases pass expected results
- [ ] No broken functionality or UI issues
- [ ] Performance is acceptable for dashboard loading
- [ ] Analytics charts render correctly

## Common Issues and Solutions

### Issue: Statistics show 0 or incorrect values

**Solution**: Check database connection and ensure proper table relationships

### Issue: Charts not rendering

**Solution**: Verify Chart.js is properly installed and configured

### Issue: Year filter not updating chart

**Solution**: Check `selectedYear` state management and analytics data loading

### Issue: Quick action buttons not working

**Solution**: Verify `setActiveTab` function and tab navigation logic

## Test Data Requirements

For comprehensive testing, ensure your database has:

- At least 5-10 psychologists (mix of active/inactive)
- At least 10-20 patients with varied demographics
- Patients with different registration dates across multiple years
- Mix of assigned and unassigned patients
- Gender distribution data (male/female)
- Age distribution across different ranges
