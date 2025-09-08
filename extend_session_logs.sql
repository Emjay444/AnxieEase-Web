-- Extend existing session_logs table to handle appointments
-- This avoids creating a new table

ALTER TABLE session_logs 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS requested_date timestamptz,
ADD COLUMN IF NOT EXISTS psychologist_response text,
ADD COLUMN IF NOT EXISTS appointment_type text DEFAULT 'consultation';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_session_logs_status ON session_logs(status);
CREATE INDEX IF NOT EXISTS idx_session_logs_patient_psychologist ON session_logs(patient_id);

-- Update existing records to have 'completed' status
UPDATE session_logs SET status = 'completed' WHERE status IS NULL;
