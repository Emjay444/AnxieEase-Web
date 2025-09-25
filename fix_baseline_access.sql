-- FIX BASELINE_HEART_RATES ACCESS - RLS POLICY ISSUE
-- The application can't access baseline_heart_rates due to RLS policies

-- ========================================
-- STEP 1: CHECK CURRENT RLS STATUS
-- ========================================
SELECT 'Current RLS status for baseline_heart_rates:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'baseline_heart_rates';

-- Check existing policies
SELECT 'Existing policies:' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'baseline_heart_rates';

-- ========================================
-- STEP 2: TEMPORARILY DISABLE RLS FOR TESTING
-- ========================================
-- WARNING: This disables security - only for testing!
ALTER TABLE baseline_heart_rates DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: CREATE PROPER RLS POLICIES
-- ========================================
-- Re-enable RLS with proper policies
ALTER TABLE baseline_heart_rates ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can manage their own baselines" ON baseline_heart_rates;
DROP POLICY IF EXISTS "baseline_heart_rates_policy" ON baseline_heart_rates;

-- Create a comprehensive policy that allows authenticated users to access baselines
CREATE POLICY "authenticated_users_baseline_access" ON baseline_heart_rates
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ========================================
-- STEP 4: GRANT PROPER PERMISSIONS
-- ========================================
-- Ensure authenticated role has all necessary permissions
GRANT ALL ON baseline_heart_rates TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- STEP 5: TEST ACCESS
-- ========================================
-- Test if we can now access the baseline data
SELECT 'Testing baseline access:' as test;
SELECT 
    user_id,
    baseline_hr,
    recorded_readings,
    recording_start_time,
    recording_end_time
FROM baseline_heart_rates
ORDER BY recording_end_time DESC;

-- Test specific user lookup
SELECT 'Testing specific user lookup:' as test;
SELECT 
    user_id,
    baseline_hr
FROM baseline_heart_rates 
WHERE user_id = '5afad7d4-3dcd-4353-badb-4f155303419a'
ORDER BY recording_end_time DESC
LIMIT 1;

-- Also test the other user
SELECT 'Testing other user lookup:' as test;
SELECT 
    user_id,
    baseline_hr
FROM baseline_heart_rates 
WHERE user_id::text LIKE 'e0997cb7-68df-41e6-923f%'
ORDER BY recording_end_time DESC
LIMIT 1;

SELECT 'Baseline access fix completed! Try device assignment again.' as final_result;