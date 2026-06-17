-- Migration: Create journals table and separate it from wellness_logs
-- This migration creates a dedicated journals table and removes journal/shared columns from wellness_logs

-- Step 1: Create the journals table
CREATE TABLE IF NOT EXISTS public.journals (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT,
  content TEXT NOT NULL,
  shared_with_psychologist BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON public.journals USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_journals_date ON public.journals USING btree (date);
CREATE INDEX IF NOT EXISTS idx_journals_shared ON public.journals USING btree (user_id, shared_with_psychologist) 
  WHERE (shared_with_psychologist = TRUE);

-- Step 3: Migrate existing journal entries from wellness_logs to journals table
INSERT INTO public.journals (user_id, date, content, shared_with_psychologist, created_at)
SELECT 
  user_id,
  date,
  journal as content,
  shared_with_psychologist,
  created_at
FROM public.wellness_logs
WHERE journal IS NOT NULL AND journal != '';

-- Step 4: Verify the migration
SELECT COUNT(*) as migrated_journals FROM public.journals;

-- Step 5: Drop existing RLS policies that depend on the columns we're removing
DROP POLICY IF EXISTS "Psychologists can view shared patient journals" ON public.wellness_logs;
DROP POLICY IF EXISTS "psychologists_view_shared_journals" ON public.wellness_logs;
DROP POLICY IF EXISTS "wellness_logs_shared_select" ON public.wellness_logs;

-- Step 6: Drop the journal and shared_with_psychologist columns from wellness_logs
ALTER TABLE public.wellness_logs 
  DROP COLUMN IF EXISTS journal CASCADE,
  DROP COLUMN IF EXISTS shared_with_psychologist CASCADE;

-- Step 7: Drop the old index for shared_with_psychologist since it's removed
DROP INDEX IF EXISTS idx_wellness_logs_shared;

-- Step 8: Verify the wellness_logs structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'wellness_logs'
ORDER BY ordinal_position;

-- Step 9: Add comment to tables for documentation
COMMENT ON TABLE public.journals IS 'Patient journal entries that can be shared with their psychologist';
COMMENT ON COLUMN public.journals.content IS 'The journal entry text content';
COMMENT ON COLUMN public.journals.shared_with_psychologist IS 'Whether this journal entry is shared with the assigned psychologist';

COMMENT ON TABLE public.wellness_logs IS 'Patient wellness tracking data including mood, stress level, and symptoms';

-- Step 10: Set up RLS (Row Level Security) policies for journals table
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

-- Patients can view their own journals
CREATE POLICY journals_select_own ON public.journals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Psychologists can view journals shared with them
CREATE POLICY journals_select_shared_with_psychologist ON public.journals
  FOR SELECT
  TO authenticated
  USING (
    shared_with_psychologist = TRUE
    AND user_id IN (
      SELECT up.id 
      FROM user_profiles up
      WHERE up.assigned_psychologist_id IN (
        SELECT p.id 
        FROM psychologists p 
        WHERE p.user_id = auth.uid()
      )
    )
  );

-- Patients can insert their own journals
CREATE POLICY journals_insert_own ON public.journals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Patients can update their own journals
CREATE POLICY journals_update_own ON public.journals
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Patients can delete their own journals
CREATE POLICY journals_delete_own ON public.journals
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Step 10: Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_journals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journals_updated_at_trigger
  BEFORE UPDATE ON public.journals
  FOR EACH ROW
  EXECUTE FUNCTION update_journals_updated_at();

-- Final verification
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as total_journals FROM public.journals;
SELECT COUNT(*) as total_wellness_logs FROM public.wellness_logs;
