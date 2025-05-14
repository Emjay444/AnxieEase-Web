# Setting Up Your Database for AnxieEase

Follow these steps to set up your Supabase database correctly so that you can use the actual database instead of mock data.

## Step 1: Run the Database Setup Script

1. Go to your Supabase dashboard at https://app.supabase.com/
2. Select your project with ID: `gqsustjxzjzfntcsnvpk`
3. Navigate to **SQL Editor** in the left sidebar
4. Create a new query
5. Copy the contents of the `fix-permissions.sql` file:

```sql
-- Fix Permissions for AnxieEase Development
-- This script disables RLS for the necessary tables for development

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS psychologists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  contact TEXT,
  user_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  assigned_psychologist_id TEXT REFERENCES psychologists(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  note_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS session_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  session_duration INTEGER,
  session_notes TEXT
);

-- Disable Row Level Security (ONLY FOR DEVELOPMENT)
ALTER TABLE psychologists DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs DISABLE ROW LEVEL SECURITY;
```

6. Run the query by clicking the "Run" button
7. You should see a message indicating that the query was executed successfully

## Step 2: Restart Your Application

After setting up the database:

1. Make sure the application is using the updated code that avoids user_id references
2. Restart your development server with `npm run dev`
3. Try creating a psychologist account again

## Step 3: Troubleshooting Common Issues

If you still encounter permission errors:

1. **RLS not disabled**: Make sure the `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` commands completed successfully
2. **Table doesn't exist**: Check that all tables were created successfully
3. **Invalid references**: Make sure any foreign key references match the correct table and column names

## For Production

For a production environment, you should:

1. Re-enable Row Level Security
2. Create proper RLS policies that allow appropriate access
3. Set up proper authentication with secure role management
4. Use a service account with the appropriate permissions for admin operations
