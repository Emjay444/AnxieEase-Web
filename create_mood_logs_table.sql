-- Create mood_logs table for the AnxieEase application
-- Run this script in your Supabase SQL Editor to create the mood_logs table

-- Table for patient mood logs
CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT NOT NULL,
  stress_level TEXT NOT NULL,
  symptoms TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add a trigger to update the updated_at timestamp
CREATE TRIGGER update_mood_logs_updated_at
BEFORE UPDATE ON mood_logs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Grant access to authenticated users
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

-- Allow patients to see only their own mood logs
CREATE POLICY patient_select_own_mood_logs
  ON mood_logs FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- Allow psychologists to see mood logs for their assigned patients
CREATE POLICY psychologist_select_patient_mood_logs
  ON mood_logs FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM patients p
      JOIN psychologists ps ON p.assigned_psychologist_id = ps.id
      WHERE ps.user_id = auth.uid()
    )
  );

-- Allow admins to see all mood logs
CREATE POLICY admin_select_all_mood_logs
  ON mood_logs FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Allow patients to insert their own mood logs
CREATE POLICY patient_insert_own_mood_logs
  ON mood_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- Allow patients to update their own mood logs
CREATE POLICY patient_update_own_mood_logs
  ON mood_logs FOR UPDATE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- Allow patients to delete their own mood logs
CREATE POLICY patient_delete_own_mood_logs
  ON mood_logs FOR DELETE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- Example data (optional)
-- Uncomment and modify as needed
/*
INSERT INTO mood_logs (patient_id, log_date, mood, stress_level, symptoms, notes)
VALUES 
  ('PATIENT_ID_1', '2024-05-01', 'Happy', 'Low', '{"None"}', 'Had a good day'),
  ('PATIENT_ID_1', '2024-05-02', 'Anxious', 'High', '{"Racing thoughts", "Shortness of breath"}', 'Experienced anxiety in the morning'),
  ('PATIENT_ID_1', '2024-05-03', 'Neutral', 'Medium', '{"Mild headache"}', 'Average day'),
  ('PATIENT_ID_2', '2024-05-01', 'Calm', 'Low', '{"None"}', 'Peaceful day'),
  ('PATIENT_ID_2', '2024-05-02', 'Sad', 'Medium', '{"Low energy", "Loss of appetite"}', 'Feeling down today');
*/ 