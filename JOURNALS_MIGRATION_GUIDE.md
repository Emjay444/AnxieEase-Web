# Journals and Wellness Logs Separation - Implementation Guide

## What Changed

We've separated journal entries from wellness logs to have clearer data separation:

### Before:
- ❌ Single `wellness_logs` table with mixed data
- ❌ Journal field in wellness_logs (optional)
- ❌ Confusing when wellness log has no mood data but has journal
- ❌ Hard to manage separate features

### After:
- ✅ `wellness_logs` table - ONLY for mood/stress/symptoms tracking
- ✅ `journals` table - ONLY for personal journal entries
- ✅ Clear separation of concerns
- ✅ Each table has required fields that make sense

## Database Changes

### New `journals` Table:
```sql
- id (UUID)
- user_id (UUID) - references auth.users
- date (DATE)
- title (TEXT) - optional
- content (TEXT) - the journal entry
- shared_with_psychologist (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Updated `wellness_logs` Table:
```sql
Removed columns:
- journal (moved to journals table)
- shared_with_psychologist (moved to journals table)

Remaining columns:
- id, user_id, date
- feelings (JSONB) - for mood
- stress_level (number) - for stress tracking
- symptoms (JSONB) - for symptoms
- timestamp, created_at
```

## Migration Steps

### 1. Run the SQL Migration
Execute the file: `create_journals_table_and_migrate.sql` in your Supabase SQL Editor

This will:
1. ✅ Create the journals table
2. ✅ Migrate existing journal data from wellness_logs
3. ✅ Remove journal & shared columns from wellness_logs
4. ✅ Set up proper RLS policies
5. ✅ Create necessary indexes

### 2. Code Changes (Already Done)
- ✅ Created `journalService.js` for journal operations
- ✅ Updated `PatientProfileView.jsx` to use separate journals state
- ✅ Updated `patientService.js` to remove journal/shared fields
- ✅ Journaling tab now uses dedicated journals data

## How It Works Now

### Wellness Logs (Charts):
- Patient fills in:
  - Mood/feelings (REQUIRED)
  - Stress level 1-10 (REQUIRED)
  - Symptoms (REQUIRED)
- Data shows in:
  - Stress Level Trend chart
  - Mood & Stress Trends chart
  - Common Symptoms pie chart
  - Anxiety Attacks chart

### Journals (Journaling Tab):
- Patient writes:
  - Title (optional)
  - Content (REQUIRED)
  - Share with psychologist checkbox
- Only shared journals (shared_with_psychologist = true) show to psychologist
- Appears in dedicated "Journaling" tab

## Testing Checklist

### After Running Migration:

1. **Verify Migration Success:**
   ```sql
   -- Check journals were created
   SELECT COUNT(*) FROM journals;
   
   -- Check wellness_logs columns removed
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'wellness_logs';
   ```

2. **Test Wellness Logs:**
   - Patient creates wellness log with mood/stress/symptoms
   - Check if data appears in psychologist dashboard charts
   - Verify Recent Mood Logs section shows data

3. **Test Journals:**
   - Patient creates journal entry
   - Patient marks "Share with psychologist"
   - Check if journal appears in psychologist's Journaling tab
   - Verify unshared journals don't appear

4. **Test Separation:**
   - Create wellness log WITHOUT journal → Should show in charts only
   - Create journal WITHOUT wellness data → Should show in Journaling tab only
   - Both should work independently

## API Functions Available

### Journal Service (`journalService.js`):
```javascript
// For psychologist (view patient journals)
journalService.getPatientJournals(patientId)

// For patient (view own journals)
journalService.getMyJournals(userId)

// Create journal
journalService.createJournal(userId, { content, title, shared_with_psychologist })

// Update journal
journalService.updateJournal(journalId, updates)

// Delete journal
journalService.deleteJournal(journalId)

// Toggle sharing
journalService.toggleSharing(journalId, true/false)
```

## Troubleshooting

### If charts are still empty:
1. Check if wellness_logs have actual mood/stress/symptoms data (not empty arrays)
2. Verify the month/year filter matches the wellness log dates
3. Check browser console for data processing logs

### If journals don't show:
1. Verify journal has `shared_with_psychologist = true`
2. Check if patient is assigned to the psychologist
3. Look for errors in browser console

### If migration fails:
1. Backup your wellness_logs table first
2. Run each step of the migration individually
3. Check for existing journals table (drop if needed)

## Next Steps

1. **Run the migration** in Supabase SQL Editor
2. **Test with sample data** (both wellness logs and journals)
3. **Update patient-facing app** to use new journals table for creating journal entries
4. **Monitor** for any issues and check console logs

---

**Note:** The wellness logs will now ONLY contain mood/stress/symptoms data. Journals are completely separate. This makes the data cleaner and easier to manage!
