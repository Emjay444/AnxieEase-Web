-- AnxieEase Database Migration Script

-- Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security on tables
ALTER TABLE psychologists ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage all tables
CREATE POLICY admin_all_access_psychologists ON psychologists 
  FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY admin_all_access_patients ON patients 
  FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY admin_all_access_activity_logs ON activity_logs 
  FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY admin_all_access_patient_notes ON patient_notes 
  FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY admin_all_access_session_logs ON session_logs 
  FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- Create policies for psychologists to view and modify their own data
CREATE POLICY psychologist_own_data ON psychologists 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Psychologists can view and update patients assigned to them
CREATE POLICY psychologist_assigned_patients ON patients 
  FOR SELECT 
  TO authenticated 
  USING (
    assigned_psychologist_id IN (
      SELECT id FROM psychologists WHERE user_id = auth.uid()
    )
  );

-- Create policies for psychologists to add/view notes for their assigned patients
CREATE POLICY psychologist_patient_notes ON patient_notes 
  FOR ALL 
  TO authenticated 
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE assigned_psychologist_id IN (
        SELECT id FROM psychologists WHERE user_id = auth.uid()
      )
    )
  );

-- Create policies for psychologists to add/view session logs for their assigned patients
CREATE POLICY psychologist_session_logs ON session_logs 
  FOR ALL 
  TO authenticated 
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE assigned_psychologist_id IN (
        SELECT id FROM psychologists WHERE user_id = auth.uid()
      )
    )
  );

-- Temporary for development: Allow anonymous insert into psychologists table
CREATE POLICY anon_insert_psychologists ON psychologists 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Note: This policy should be removed in production
-- This is just for development to allow admins to create psychologist profiles

-- Create appropriate indexes for performance
CREATE INDEX idx_psychologists_user_id ON psychologists(user_id);
CREATE INDEX idx_patients_assigned_psychologist_id ON patients(assigned_psychologist_id);
CREATE INDEX idx_patient_notes_patient_id ON patient_notes(patient_id);
CREATE INDEX idx_session_logs_patient_id ON session_logs(patient_id); 