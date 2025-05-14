# Supabase Setup Guide for AnxieEase

This guide will help you set up Supabase for the AnxieEase application, particularly for the admin dashboard functionality.

## Quick Start for Development

For quick development and testing, you can use the simplified setup:

1. Go to your Supabase dashboard at https://app.supabase.com/
2. Select your project (with ID: `gqsustjxzjzfntcsnvpk`)
3. Navigate to **SQL Editor** (in the left sidebar)
4. Create a new query
5. Copy the contents of the `quick-dev-setup.sql` file from this project
6. Execute the query

This simplified setup disables Row Level Security (RLS) temporarily and allows anonymous insertion into the psychologists table, which is sufficient for testing the admin dashboard functionality.

⚠️ **Warning**: This approach is only for development. Do not use in production.

## Complete Setup (For Production)

For a complete setup with proper security measures, follow these steps:

### Step 1: Run Database Migrations

1. Go to your Supabase dashboard at https://app.supabase.com/
2. Select your project (with ID: `gqsustjxzjzfntcsnvpk`)
3. Navigate to **SQL Editor** (in the left sidebar)
4. Create a new query
5. Copy the contents of the `database-migration.sql` file from this project
6. Execute the query

## Step 2: Temporarily Disable Row Level Security (For Development Only)

To make development easier, you can temporarily disable RLS for tables:

```sql
ALTER TABLE psychologists DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs DISABLE ROW LEVEL SECURITY;
```

**Note**: This should only be done during development. For production, ensure RLS is enabled and proper policies are in place.

## Step 3: Create an Admin Account

1. Navigate to **Authentication** → **Users** in your Supabase dashboard
2. Click **"Invite user"** (or "Add user")
3. Enter the email and password for your admin user
4. Wait for the user to be created
5. Navigate to **SQL Editor** again
6. Run the following query to make this user an admin:

```sql
-- First, create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Insert your admin user
INSERT INTO admins (id, email)
VALUES (
  '<user_id_from_auth_users>',
  '<admin_email>'
);
```

Replace `<user_id_from_auth_users>` with the UUID of the user you just created, and `<admin_email>` with the email address of that user.

## Step 4: Set Up RLS Policies for Production

For production deployment, ensure you have enabled RLS and set up appropriate policies:

```sql
-- Enable Row Level Security on tables
ALTER TABLE psychologists ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

-- Remove temporary anonymous insert policy
DROP POLICY IF EXISTS anon_insert_psychologists ON psychologists;

-- Add a more restricted policy for psychologist creation
CREATE POLICY admin_insert_psychologists ON psychologists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));
```

## Additional Notes

- For development purposes, we're allowing anonymous insert to the psychologists table to enable the admin dashboard functionality without requiring a full backend.
- In a production environment, actions like creating user accounts should be handled by a secure backend service with appropriate service role keys.
- All sensitive operations and user management should use the service role key which should never be exposed to the client.
