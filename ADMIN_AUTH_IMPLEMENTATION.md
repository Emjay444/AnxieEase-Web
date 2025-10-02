# Admin Authentication Implementation

## Overview

This document explains the updated admin authentication system that now properly verifies admin privileges against the `admins` database table rather than relying solely on Supabase Auth metadata.

## What Changed

### 1. Enhanced Role Verification (`authService.js`)

**Before:**

- Admin role was determined only by checking `user_metadata.role === "admin"`
- No verification against the database `admins` table

**After:**

- Admin role still checks metadata first (for performance)
- **But now verifies the user exists in the `admins` table**
- If user has admin metadata but is not in `admins` table, access is denied
- This ensures database-driven security consistent with your RLS policies

### 2. New Admin Management Functions (`adminService.js`)

Added comprehensive admin profile management:

- `isUserAdmin(userId)` - Check if user exists in admins table
- `addUserToAdminsTable(userId, email)` - Add user to admins table
- `removeUserFromAdminsTable(userId)` - Remove user from admins table
- `promoteToAdmin(email)` - Promote current user to admin (both table and metadata)
- `getAllAdmins()` - Get list of all admin users
- `setupAdmin(userId, email)` - Comprehensive admin setup

## How It Works Now

### Admin Authentication Flow

1. **User logs in** with Supabase Auth
2. **Role determination** (`authService.getUserRole()`):
   - Check user metadata for `role: "admin"`
   - If admin metadata found, **verify user exists in `admins` table**
   - If not in `admins` table, deny admin access (return null)
   - If in `admins` table, grant admin access
3. **Route protection** works as before but now with database verification

### Security Benefits

- **Database-driven**: Admin privileges controlled by your database
- **Consistent with RLS**: Your policies already check the `admins` table
- **Centralized management**: Easy to add/remove admin privileges
- **Audit trail**: Clear record in `admins` table of who has access

## Usage Instructions

### For Existing Admins

If you currently have admin users that only exist in Supabase Auth metadata:

1. **Check current status**:

   ```javascript
   // In browser console or test script
   import { adminService } from "./src/services/adminService.js";
   await adminService.getAllAdmins(); // See who's in admins table
   ```

2. **Add existing admin to table**:

   ```sql
   -- In Supabase SQL Editor
   INSERT INTO admins (id, email)
   VALUES ('user-id-from-auth', 'admin@example.com');
   ```

   Or use the service:

   ```javascript
   await adminService.addUserToAdminsTable(userId, email);
   ```

### For New Admins

To create a new admin user:

1. **Create user in Supabase Auth** (via dashboard or API)
2. **Add to admins table**:

   ```javascript
   await adminService.setupAdmin(userId, email);
   ```

   Or promote current logged-in user:

   ```javascript
   await adminService.promoteToAdmin();
   ```

### Password Reset

Password reset works exactly as before:

- Uses Supabase's built-in password reset flow
- Admin privileges are maintained through the `admins` table
- No special handling needed

## Testing Your Setup

### 1. Use the Test Component

Add the test component to your admin dashboard temporarily:

```jsx
// In your admin dashboard component
import AdminAuthTest from "../components/AdminAuthTest";

// Add this to your render:
<AdminAuthTest />;
```

This will:

- Check if current user is in `admins` table
- Test role determination
- List all admin users
- Provide setup guidance
- Allow promoting users to admin

### 2. Use SQL Helper Script

Run queries in Supabase SQL Editor using `admin-setup-helper.sql`:

- View current admin users
- Check for metadata/table mismatches
- Test admin access to protected tables

### 3. Manual Verification

1. **Log in as admin user**
2. **Check browser console** for authentication logs
3. **Navigate to admin routes** (`/admin`, `/admin-iot`)
4. **Verify access to admin functions**

## Troubleshooting

### Problem: Admin user can't access admin routes

**Solution:**

1. Check if user exists in `admins` table:

   ```sql
   SELECT * FROM admins WHERE email = 'your-admin@example.com';
   ```

2. If not found, add them:
   ```sql
   INSERT INTO admins (id, email)
   SELECT id, email FROM auth.users WHERE email = 'your-admin@example.com';
   ```

### Problem: User has admin metadata but access denied

**This is expected behavior!** The new system requires users to be in both:

- Supabase Auth with `role: "admin"` metadata
- Database `admins` table

### Problem: RLS policies not working

Verify your RLS policies check the `admins` table:

```sql
-- Should see policies like this:
-- USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
```

## Database Schema

Your `admin_profiles` table structure:

```sql
CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Security Notes

- **Double verification**: Both metadata AND database table required
- **Consistent with RLS**: Database policies already expect this structure
- **Fail-safe**: If database check fails, access is denied
- **Audit trail**: All admin users tracked in database

## Cleanup

After testing, you can remove these temporary files:

- `src/components/AdminAuthTest.jsx`
- `admin-setup-helper.sql`
- `ADMIN_AUTH_IMPLEMENTATION.md` (this file)

## Backup Files

Original files were backed up as:

- `src/services/authService.js.backup`
- `src/services/adminService.js.backup`

These can be removed once you're satisfied with the new implementation.
