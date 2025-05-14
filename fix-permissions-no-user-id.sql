-- Fix Permissions for AnxieEase Development
-- This script removes the problematic user_id reference and disables RLS

-- Create tables if they don't exist - REMOVING user_id reference
CREATE TABLE IF NOT EXISTS psychologists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  contact TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  assigned_psychologist_id TEXT REFERENCES psychologists(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  note_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS session_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  session_duration INTEGER,
  session_notes TEXT
);

-- Disable Row Level Security (ONLY FOR DEVELOPMENT)
ALTER TABLE psychologists DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs DISABLE ROW LEVEL SECURITY;

-- If the tables exist, also make this modification
ALTER TABLE psychologists 
  DROP COLUMN IF EXISTS user_id; 