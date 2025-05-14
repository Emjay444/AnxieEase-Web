-- Schema for AnxieEase database tables
-- Run this in your Supabase SQL editor

-- This is a schema for the admin dashboard. It builds on the existing 'users' table
-- by creating new tables for psychologists, patients, and admin activity logs.

-- Table for psychologists
CREATE TABLE IF NOT EXISTS psychologists (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  contact TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for patients
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  assigned_psychologist_id TEXT REFERENCES psychologists(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Table for patient notes
CREATE TABLE IF NOT EXISTS patient_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  psychologist_id TEXT REFERENCES psychologists(id) ON DELETE SET NULL,
  note_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for session logs
CREATE TABLE IF NOT EXISTS session_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  session_date TIMESTAMPTZ DEFAULT NOW(),
  session_duration INTEGER, -- in minutes
  anxiety_level INTEGER, -- e.g., 1-10 scale
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- DISABLING RLS FOR DEVELOPMENT PURPOSES
-- When you're ready to implement security, uncomment these sections
-- =========================================================

-- -- Create RLS policies for security
-- 
-- -- Psychologists table policies
-- ALTER TABLE psychologists ENABLE ROW LEVEL SECURITY;
-- 
-- -- Only admins can create psychologists
-- CREATE POLICY create_psychologists_admin
--   ON psychologists FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
--   );
-- 
-- -- Admins can view all psychologists
-- CREATE POLICY view_psychologists_admin
--   ON psychologists FOR SELECT
--   TO authenticated
--   USING (
--     (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
--   );
-- 
-- -- Psychologists can view their own records
-- CREATE POLICY view_own_psychologist_record
--   ON psychologists FOR SELECT
--   TO authenticated
--   USING (
--     user_id = auth.uid()
--   );
-- 
-- -- Only admins can update psychologists
-- CREATE POLICY update_psychologists_admin
--   ON psychologists FOR UPDATE
--   TO authenticated
--   USING (
--     (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
--   );
-- 
-- -- Only admins can delete psychologists
-- CREATE POLICY delete_psychologists_admin
--   ON psychologists FOR DELETE
--   TO authenticated
--   USING (
--     (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
--   );
-- 
-- -- Patients table policies
-- ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
-- 
-- -- Admins can view all patients
-- CREATE POLICY view_patients_admin
--   ON patients FOR SELECT
--   TO authenticated
--   USING (
--     (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
--   );
-- 
-- -- Psychologists can view their assigned patients
-- CREATE POLICY view_assigned_patients_psychologist
--   ON patients FOR SELECT
--   TO authenticated
--   USING (
--     assigned_psychologist_id IN (
--       SELECT id FROM psychologists WHERE user_id = auth.uid()
--     )
--   );
-- 
-- -- Patients can view their own records
-- CREATE POLICY view_own_patient_record
--   ON patients FOR SELECT
--   TO authenticated
--   USING (
--     user_id = auth.uid()
--   );
-- 
-- -- Only admins can assign patients to psychologists
-- CREATE POLICY update_patients_admin
--   ON patients FOR UPDATE
--   TO authenticated
--   USING (
--     (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
--   );
-- 
-- -- Activity logs table policies
-- ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
-- 
-- -- Only admins can view all activity logs
-- CREATE POLICY view_logs_admin
--   ON activity_logs FOR SELECT
--   TO authenticated
--   USING (
--     (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
--   );
-- 
-- -- Anyone can create activity logs (their actions will be logged)
-- CREATE POLICY create_activity_logs
--   ON activity_logs FOR INSERT
--   TO authenticated
--   WITH CHECK (true);

-- Add triggers to automatically update the "updated_at" timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_psychologists_updated_at
BEFORE UPDATE ON psychologists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_patient_notes_updated_at
BEFORE UPDATE ON patient_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Add function to log activities automatically
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  action_text TEXT;
  details_text TEXT;
BEGIN
  -- Get the role of the user making the change
  SELECT role INTO user_role FROM auth.users WHERE id = auth.uid();
  
  -- Only log for admin actions
  IF user_role = 'admin' THEN
    IF TG_OP = 'INSERT' THEN
      action_text := 'Created ' || TG_TABLE_NAME;
      
      IF TG_TABLE_NAME = 'psychologists' THEN
        details_text := 'Added Dr. ' || NEW.name || ' (ID: ' || NEW.id || ')';
      ELSIF TG_TABLE_NAME = 'patients' THEN
        details_text := 'Added patient ' || NEW.name || ' (ID: ' || NEW.id || ')';
      END IF;
      
    ELSIF TG_OP = 'UPDATE' THEN
      IF TG_TABLE_NAME = 'psychologists' THEN
        IF NEW.is_active <> OLD.is_active THEN
          IF NEW.is_active THEN
            action_text := 'Activated Doctor';
            details_text := 'Activated Dr. ' || NEW.name || ' (ID: ' || NEW.id || ')';
          ELSE
            action_text := 'Deactivated Doctor';
            details_text := 'Deactivated Dr. ' || NEW.name || ' (ID: ' || NEW.id || ')';
          END IF;
        ELSE
          action_text := 'Updated Information';
          details_text := 'Updated information for Dr. ' || NEW.name;
        END IF;
      ELSIF TG_TABLE_NAME = 'patients' THEN
        IF NEW.assigned_psychologist_id IS DISTINCT FROM OLD.assigned_psychologist_id THEN
          IF NEW.assigned_psychologist_id IS NULL THEN
            action_text := 'Unassigned Patient';
            details_text := 'Unassigned patient ' || NEW.name || ' from psychologist';
          ELSE
            action_text := 'Assigned Patient';
            details_text := 'Assigned patient ' || NEW.name || ' to psychologist ID: ' || NEW.assigned_psychologist_id;
          END IF;
        ELSE
          action_text := 'Updated Patient Info';
          details_text := 'Updated information for patient ' || NEW.name;
        END IF;
      END IF;
      
    ELSIF TG_OP = 'DELETE' THEN
      IF TG_TABLE_NAME = 'psychologists' THEN
        action_text := 'Removed Doctor';
        details_text := 'Removed Dr. ' || OLD.name || ' (ID: ' || OLD.id || ')';
      ELSIF TG_TABLE_NAME = 'patients' THEN
        action_text := 'Removed Patient';
        details_text := 'Removed patient ' || OLD.name || ' (ID: ' || OLD.id || ')';
      END IF;
    END IF;
    
    -- Insert the log entry
    INSERT INTO activity_logs (user_id, action, details)
    VALUES (auth.uid(), action_text, details_text);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for activity logging
CREATE TRIGGER log_psychologist_changes
AFTER INSERT OR UPDATE OR DELETE ON psychologists
FOR EACH ROW
EXECUTE FUNCTION log_admin_activity();

CREATE TRIGGER log_patient_changes
AFTER INSERT OR UPDATE OR DELETE ON patients
FOR EACH ROW
EXECUTE FUNCTION log_admin_activity(); 