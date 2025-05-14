# Supabase Setup Guide for AnxieEase Admin Dashboard

This guide provides step-by-step instructions to set up your Supabase database for the AnxieEase Admin Dashboard.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com) if you don't have one)
- Basic understanding of SQL and database concepts

## Step 1: Create a New Supabase Project

1. Log in to your Supabase account
2. Click on "New Project"
3. Fill in the project details:
   - Name: AnxieEase (or your preferred name)
   - Database Password: Create a secure password
   - Region: Choose the region closest to your users
4. Click "Create New Project"
5. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your API Credentials

Once your project is created, you'll need the API credentials to connect your application:

1. In your project dashboard, go to "Settings" → "API"
2. Copy the "URL" - this will be your `VITE_SUPABASE_URL`
3. Copy the "anon" "public" key - this will be your `VITE_SUPABASE_ANON_KEY`
4. Create a `.env` file in the root of your project and add these values:

```
VITE_SUPABASE_URL=your_copied_url
VITE_SUPABASE_ANON_KEY=your_copied_anon_key
```

## Step 3: Set Up Database Schema

1. In your Supabase dashboard, navigate to "SQL Editor"
2. Click "New Query"
3. Copy and paste the entire contents of the `supabase_schema.sql` file from this repository
4. Click "Run" to execute the SQL script

This script will:

- Create all necessary tables
- Set up relationships between tables
- Configure Row Level Security (RLS) policies
- Create triggers for automatic timestamps and activity logging

## Step 4: Create an Admin User

To access the admin dashboard, you need to create a user with admin privileges:

1. Go to "Authentication" → "Users" in your Supabase dashboard
2. Click "Add User"
3. Enter the email and password for your admin user
4. Click "Save"
5. Once the user is created, go to the SQL Editor and run:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@example.com';  -- Replace with your admin email
```

This query sets the `role` field in the user metadata to "admin".

## Step 5: Configure Authentication Settings

1. Go to "Authentication" → "Settings" in your dashboard
2. Under "Email Auth", ensure "Enable Email Signup" is enabled
3. Configure "Site URL" to point to your application's URL
4. Under "Email Templates", you can customize the emails sent for:
   - Confirmation
   - Invitation
   - Magic Link
   - Reset Password

## Step 6: Testing the Connection

1. Make sure your application has the correct environment variables
2. Start your application: `npm run dev`
3. Try logging in with your admin credentials
4. You should be able to access the admin dashboard and see your Supabase tables connected

## Database Structure Overview

Here's a reminder of the tables we've created:

1. **psychologists** - Stores information about psychologists
2. **patients** - Stores information about patients
3. **activity_logs** - Tracks admin actions
4. **patient_notes** - Stores notes for each patient
5. **session_logs** - Records therapy sessions

## Security Considerations

The schema includes Row Level Security (RLS) policies that ensure:

- Only admins can create/update psychologists
- Psychologists can only view their assigned patients
- Patients can only view their own records
- Only admins can view all activity logs

## Troubleshooting

If you encounter issues:

1. **Database connection errors**: Check your environment variables and ensure they match the values from Supabase
2. **Authentication issues**: Verify the user has the correct role in auth.users
3. **Permission errors**: Review the RLS policies to ensure they're correctly set up

For more help, refer to the [Supabase documentation](https://supabase.com/docs) or create an issue in this repository.
