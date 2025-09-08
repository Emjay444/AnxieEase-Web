-- Minimal appointments table - just for scheduling
-- Links to existing patient relationships via assigned_psychologist_id

CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id text REFERENCES patients(id) ON DELETE CASCADE,
  psychologist_id text REFERENCES psychologists(id) ON DELETE CASCADE,
  requested_date timestamptz NOT NULL,
  status text DEFAULT 'pending', -- pending, approved, declined, scheduled
  message text,
  psychologist_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_requests_psychologist ON appointment_requests(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_status ON appointment_requests(status);
