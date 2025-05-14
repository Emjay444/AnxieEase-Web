-- Quick Development Setup for AnxieEase
-- WARNING: This is for development only and disables security features!

-- Temporarily disable Row Level Security on tables for development
ALTER TABLE psychologists DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs DISABLE ROW LEVEL SECURITY;

-- Add anonymous insert policy for psychologists table
-- This allows the admin interface to create psychologist records without authentication
DROP POLICY IF EXISTS anon_insert_psychologists ON psychologists;
CREATE POLICY anon_insert_psychologists ON psychologists 
  FOR INSERT 
  TO anon 
  WITH CHECK (true); 