# Fix: Prevent Psychologist Accounts from Being Inserted into user_profiles

## Problem

When creating psychologist accounts, they were being incorrectly inserted into the `user_profiles` table, which should only contain patient records.

## Root Cause

1. `psychologistService.js` uses `shouldCreateUser: true` when sending magic links
2. This creates a record in `auth.users` table
3. The database trigger `on_auth_user_created` fires for ALL auth users
4. The trigger's `sync_user_email()` function attempts to update `user_profiles` for every auth user
5. This caused psychologists to be inserted into `user_profiles` (patient-only table)

## Solution

Modified the `sync_user_email()` trigger function to check the user's role before syncing to `user_profiles`.

### Changes Made:

```sql
-- OLD: Updated user_profiles for ALL auth users
UPDATE public.user_profiles
SET email = NEW.email
WHERE id = NEW.id;

-- NEW: Only updates user_profiles for patients
IF (NEW.raw_user_meta_data->>'role' IS NULL
    OR NEW.raw_user_meta_data->>'role' = 'patient') THEN
  UPDATE public.user_profiles
  SET email = NEW.email
  WHERE id = NEW.id;
END IF;
```

## What the Fix Does:

1. ✅ Drops the old trigger
2. ✅ Creates an improved `sync_user_email()` function that checks user role
3. ✅ Recreates the trigger with the updated logic
4. ✅ Cleans up existing psychologist records from `user_profiles`
5. ✅ Verifies the fix with counts

## How to Apply:

1. Run the SQL script in your Supabase SQL Editor:

   ```
   fix_user_profiles_trigger_for_psychologists.sql
   ```

2. Verify the output shows:
   - ✓ Overlap count = 0
   - ✓ Success message

## Testing:

After applying the fix, create a new psychologist account and verify:

- ✅ Psychologist record is created in `psychologists` table
- ✅ Auth user is created in `auth.users`
- ✅ NO record is created in `user_profiles`

## Tables Structure (After Fix):

- **`user_profiles`** → Patients only
- **`psychologists`** → Psychologists only
- **`admin_profiles`** → Admins only
- **`auth.users`** → All users (with role in metadata)

## Future Prevention:

The trigger now checks `raw_user_meta_data->>'role'` to determine if a user should be synced to `user_profiles`. Only users with:

- `role = 'patient'`
- `role = NULL` (defaults to patient)

will have their records synced to `user_profiles`.
