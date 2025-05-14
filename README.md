# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# AnxieEase Web Application

AnxieEase is a web application designed to help manage the relationship between psychologists and patients in a mental health context, with a focus on anxiety management.

## Features

- Admin dashboard for managing psychologists and patients
- Patient assignment system
- Activity logging for administrative actions
- Detailed views for psychologists and patients
- Authentication and role-based access control

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Supabase account (for database)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/AnxieEase-Web.git
   cd AnxieEase-Web
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following content:

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Supabase Setup for Admin Dashboard

### Step 1: Create a Supabase Project

1. Log in to Supabase (https://supabase.com)
2. Create a new project and note the URL and anon key

### Step 2: Run the Database Schema

1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy the SQL from `supabase_schema.sql` in this repository
3. Run the SQL to create all necessary tables and security policies

### Step 3: Set Up Authentication

1. Go to Authentication → Settings in your Supabase dashboard
2. Configure email templates for authentication
3. Set up any additional authentication providers if needed
4. Enable row-level security for the tables

### Step 4: Create an Admin User

1. Go to Authentication → Users in your Supabase dashboard
2. Create a new user with an email and password
3. Open the SQL Editor and run the following query to set the user's role to admin:
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_set(
     COALESCE(raw_user_meta_data, '{}'::jsonb),
     '{role}',
     '"admin"'
   )
   WHERE email = 'your_admin_email@example.com';
   ```

### Step 5: Connect the Application

1. In your `.env` file, update the Supabase URL and anon key
2. Restart your application and log in with the admin credentials

## Database Structure

### Tables

1. **users** (auth.users)

   - Default Supabase auth table with added 'role' in user_metadata

2. **psychologists**

   - id (TEXT): License number or identifier
   - user_id (UUID): Reference to auth.users
   - name (TEXT): Psychologist's full name
   - email (TEXT): Email address
   - contact (TEXT): Contact information
   - is_active (BOOLEAN): Active status
   - created_at (TIMESTAMPTZ): Creation timestamp
   - updated_at (TIMESTAMPTZ): Last update timestamp

3. **patients**

   - id (TEXT): Patient identifier
   - user_id (UUID): Reference to auth.users
   - name (TEXT): Patient's full name
   - email (TEXT): Email address
   - assigned_psychologist_id (TEXT): Foreign key to psychologists
   - is_active (BOOLEAN): Active status
   - created_at (TIMESTAMPTZ): Creation timestamp
   - updated_at (TIMESTAMPTZ): Last update timestamp

4. **activity_logs**

   - id (UUID): Log entry ID
   - user_id (UUID): User who performed the action
   - action (TEXT): Action description
   - details (TEXT): Detailed information
   - timestamp (TIMESTAMPTZ): When the action occurred

5. **patient_notes**

   - id (UUID): Note ID
   - patient_id (TEXT): Patient reference
   - psychologist_id (TEXT): Psychologist reference
   - note_content (TEXT): Note content
   - created_at (TIMESTAMPTZ): Creation timestamp
   - updated_at (TIMESTAMPTZ): Last update timestamp

6. **session_logs**
   - id (UUID): Session ID
   - patient_id (TEXT): Patient reference
   - session_date (TIMESTAMPTZ): Session date and time
   - session_duration (INTEGER): Duration in minutes
   - anxiety_level (INTEGER): Recorded anxiety level
   - notes (TEXT): Session notes
   - created_at (TIMESTAMPTZ): Creation timestamp

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### "Permission denied for table users" Error When Adding Psychologists

If you encounter a "permission denied for table users" error when adding a psychologist account, it means there's a permission issue with your Supabase database:

1. Go to the Supabase dashboard and navigate to the SQL Editor
2. Create a new query
3. Copy and paste the contents of the `fix-users-permissions.sql` file and run it
4. If the issue persists, try toggling the pg_net extension off and back on:
   - In your Supabase dashboard, go to Database > Extensions
   - Find pg_net in the list
   - Toggle it off and then back on

This solution addresses a common issue with Supabase permissions, particularly after project pause/resume cycles.
