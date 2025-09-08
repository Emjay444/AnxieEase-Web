-- Diagnostic and fix script for psychologists table permissions
-- This addresses the 406 error when querying psychologists table

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity, hasrlspolicy 
FROM pg_tables pt
JOIN pg_class pc ON pt.tablename = pc.relname
JOIN pg_namespace pn ON pc.relnamespace = pn.oid AND pt.schemaname = pn.nspname
WHERE pt.tablename IN ('psychologists', 'patients', 'user_profiles', 'activity_logs');

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('psychologists', 'patients', 'user_profiles', 'activity_logs')
ORDER BY tablename, policyname;

-- Check if the user_id column exists and its type
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'psychologists' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any psychologists records
SELECT COUNT(*) as psychologist_count FROM public.psychologists;

-- Check the specific user causing the error
SELECT id, user_id, name, email, is_active, created_at
FROM public.psychologists 
WHERE user_id = '2fad5267-2824-4585-bc9a-b84a6e955e1e';

-- Temporarily disable RLS for development (if needed)
-- Uncomment these lines if you want to disable RLS for development
-- ALTER TABLE public.psychologists DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;

-- Alternative: Create permissive policies for authenticated users
-- This is safer than disabling RLS completely

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS admin_insert_psychologists ON public.psychologists;
DROP POLICY IF EXISTS anon_insert_psychologists ON public.psychologists;

-- Create permissive policies for development
CREATE POLICY psychologists_select_policy ON public.psychologists
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY psychologists_insert_policy ON public.psychologists
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY psychologists_update_policy ON public.psychologists
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY psychologists_delete_policy ON public.psychologists
  FOR DELETE
  TO authenticated
  USING (true);

-- Similar policies for other tables if needed
CREATE POLICY patients_all_policy ON public.patients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY user_profiles_all_policy ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY activity_logs_all_policy ON public.activity_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('psychologists', 'patients', 'user_profiles', 'activity_logs')
ORDER BY tablename, policyname;
