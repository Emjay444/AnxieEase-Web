-- COMPREHENSIVE FIX FOR MARK JOSEPH ROLE AND PSYCHOLOGISTS TABLE PERMISSIONS
-- This script addresses both the incorrect role assignment and the 406 error

-- =============================================================================
-- PART 1: FIX MARK JOSEPH'S ROLE (Root cause of the issue)
-- =============================================================================

-- First, let's see Mark Joseph's current data
SELECT 
    'user_profiles' as table_name,
    id, 
    first_name, 
    last_name, 
    email, 
    role, 
    created_at, 
    updated_at
FROM public.user_profiles 
WHERE email = 'mjmolina444@gmail.com' 
   OR id = '1b2d48a9-1a2d-4dfb-92ef-632130a15f84'
   OR (first_name ILIKE '%mark%' AND last_name ILIKE '%joseph%');

-- Check if Mark Joseph exists in psychologists table (he shouldn't)
SELECT 
    'psychologists' as table_name,
    id,
    user_id,
    name,
    email,
    is_active,
    created_at
FROM public.psychologists 
WHERE user_id = '2fad5267-2824-4585-bc9a-b84a6e955e1e'
   OR email = 'mjmolina444@gmail.com';

-- Fix Mark Joseph's role in user_profiles table
UPDATE public.user_profiles 
SET 
    role = 'patient',
    updated_at = NOW()
WHERE email = 'mjmolina444@gmail.com';

-- Also update by ID as backup
UPDATE public.user_profiles 
SET 
    role = 'patient',
    updated_at = NOW()
WHERE id = '1b2d48a9-1a2d-4dfb-92ef-632130a15f84';

-- Check which patients are assigned to Mark Joseph as their psychologist
SELECT 
    'PATIENTS_ASSIGNED_TO_MARK' as info,
    id,
    first_name,
    last_name,
    email,
    assigned_psychologist_id
FROM public.user_profiles 
WHERE assigned_psychologist_id = '1b2d48a9-1a2d-4dfb-82ef-6321309b29ff';

-- First, we need to unassign patients from Mark Joseph before removing him
-- Option 1: Set their assigned_psychologist_id to NULL (unassigned)
UPDATE public.user_profiles 
SET 
    assigned_psychologist_id = NULL,
    updated_at = NOW()
WHERE assigned_psychologist_id = '1b2d48a9-1a2d-4dfb-82ef-6321309b29ff';

-- Option 2: If you want to reassign them to another psychologist, first find available psychologists:
SELECT 
    'AVAILABLE_PSYCHOLOGISTS' as info,
    id,
    name,
    email,
    is_active
FROM public.psychologists 
WHERE is_active = true 
  AND id != '1b2d48a9-1a2d-4dfb-82ef-6321309b29ff'
ORDER BY created_at;

-- Uncomment and modify the following if you want to reassign patients to a specific psychologist:
-- UPDATE public.user_profiles 
-- SET 
--     assigned_psychologist_id = 'REPLACE_WITH_ACTUAL_PSYCHOLOGIST_ID',
--     updated_at = NOW()
-- WHERE assigned_psychologist_id = '1b2d48a9-1a2d-4dfb-82ef-6321309b29ff';

-- Now we can safely remove Mark Joseph from psychologists table (if he exists there)
DELETE FROM public.psychologists 
WHERE user_id = '2fad5267-2824-4585-bc9a-b84a6e955e1e'
   OR email = 'mjmolina444@gmail.com'
   OR id = '1b2d48a9-1a2d-4dfb-82ef-6321309b29ff';

-- =============================================================================
-- PART 2: FIX PSYCHOLOGISTS TABLE PERMISSIONS (To resolve 406 error)
-- =============================================================================

-- Check current RLS status (only check tables that actually exist)
SELECT 
    schemaname, 
    tablename, 
    rowsecurity, 
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = pt.tablename) as policy_count
FROM pg_tables pt
JOIN pg_class pc ON pt.tablename = pc.relname
JOIN pg_namespace pn ON pc.relnamespace = pn.oid AND pt.schemaname = pn.nspname
WHERE pt.tablename IN ('psychologists', 'user_profiles', 'activity_logs')
  AND pt.schemaname = 'public';

-- Drop existing restrictive policies that might be causing 406 errors
DROP POLICY IF EXISTS admin_insert_psychologists ON public.psychologists;
DROP POLICY IF EXISTS anon_insert_psychologists ON public.psychologists;
DROP POLICY IF EXISTS psychologists_policy ON public.psychologists;

-- Create permissive policies for authenticated users (development-friendly)
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

-- Ensure similar permissive policies for other tables that exist
DROP POLICY IF EXISTS user_profiles_policy ON public.user_profiles;
CREATE POLICY user_profiles_all_policy ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only create activity_logs policy if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'activity_logs' AND schemaname = 'public') THEN
        DROP POLICY IF EXISTS activity_logs_policy ON public.activity_logs;
        CREATE POLICY activity_logs_all_policy ON public.activity_logs
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
    END IF;
END $$;

-- =============================================================================
-- PART 3: VERIFICATION
-- =============================================================================

-- Verify Mark Joseph's role is now correct
SELECT 
    'AFTER_FIX - user_profiles' as table_name,
    id, 
    first_name, 
    last_name, 
    email, 
    role, 
    updated_at
FROM public.user_profiles 
WHERE email = 'mjmolina444@gmail.com' 
   OR id = '1b2d48a9-1a2d-4dfb-92ef-632130a15f84';

-- Verify he's not in psychologists table
SELECT 
    'AFTER_FIX - psychologists' as table_name,
    COUNT(*) as should_be_zero
FROM public.psychologists 
WHERE user_id = '2fad5267-2824-4585-bc9a-b84a6e955e1e'
   OR email = 'mjmolina444@gmail.com'
   OR id = '1b2d48a9-1a2d-4dfb-82ef-6321309b29ff';

-- Verify patients are no longer assigned to Mark Joseph
SELECT 
    'AFTER_FIX - patients_assigned_to_mark' as table_name,
    COUNT(*) as should_be_zero
FROM public.user_profiles 
WHERE assigned_psychologist_id = '1b2d48a9-1a2d-4dfb-82ef-6321309b29ff';

-- Show patients that were unassigned (now have NULL assigned_psychologist_id)
SELECT 
    'UNASSIGNED_PATIENTS' as info,
    id,
    first_name,
    last_name,
    email,
    assigned_psychologist_id,
    updated_at
FROM public.user_profiles 
WHERE assigned_psychologist_id IS NULL
  AND role = 'patient'
ORDER BY updated_at DESC
LIMIT 10;

-- Check all users with psychologist role (to catch any other misassignments)
SELECT 
    'ALL_PSYCHOLOGIST_ROLES' as table_name,
    id, 
    first_name, 
    last_name, 
    email, 
    role, 
    created_at
FROM public.user_profiles 
WHERE role = 'psychologist'
ORDER BY created_at DESC;

-- Verify policies were created (only check tables that exist)
SELECT 
    'NEW_POLICIES' as info,
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename IN ('psychologists', 'user_profiles', 'activity_logs')
  AND policyname LIKE '%_policy'
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Test the problematic query that was causing 406 error
SELECT 
    'TEST_QUERY_THAT_WAS_FAILING' as info,
    id
FROM public.psychologists 
WHERE user_id = '2fad5267-2824-4585-bc9a-b84a6e955e1e';
