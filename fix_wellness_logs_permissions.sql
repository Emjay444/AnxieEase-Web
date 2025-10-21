-- Fix wellness_logs RLS policies so patients and assigned psychologists can read data
-- Safe to run multiple times: drops policies by name if they already exist and recreates them

-- Ensure RLS is enabled
ALTER TABLE public.wellness_logs ENABLE ROW LEVEL SECURITY;

-- Drop our managed policies if they exist
DROP POLICY IF EXISTS wellness_logs_select_own ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_insert_own ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_update_own ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_delete_own ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_select_psychologist ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_select_admin ON public.wellness_logs;

-- Patients: full CRUD on their own logs
CREATE POLICY wellness_logs_select_own
  ON public.wellness_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY wellness_logs_insert_own
  ON public.wellness_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY wellness_logs_update_own
  ON public.wellness_logs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY wellness_logs_delete_own
  ON public.wellness_logs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Psychologists: can SELECT logs of patients currently assigned to them
-- Mapping: user_profiles.assigned_psychologist_id -> psychologists.id, and psychologists.user_id is the auth.uid()
CREATE POLICY wellness_logs_select_psychologist
  ON public.wellness_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      JOIN public.psychologists ps ON up.assigned_psychologist_id = ps.id
      WHERE up.id = wellness_logs.user_id
        AND ps.user_id = auth.uid()
    )
  );

-- Admins: allow read of all logs
CREATE POLICY wellness_logs_select_admin
  ON public.wellness_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap WHERE ap.id = auth.uid()
    )
  );
