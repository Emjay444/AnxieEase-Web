-- Fix permission denied for table users
-- Run this in Supabase SQL editor

-- First ensure the psychologists table exists
CREATE TABLE IF NOT EXISTS psychologists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  contact TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Grant access to the auth.users table for the authenticated and anon roles 
GRANT SELECT ON auth.users TO authenticated, anon;

-- Grant permissions on the psychologists table
GRANT ALL ON psychologists TO authenticated, anon, service_role, postgres;

-- Disable Row Level Security (for development only)
ALTER TABLE psychologists DISABLE ROW LEVEL SECURITY;

-- This is the command needed to allow public access to the psychologists table
GRANT SELECT ON TABLE public.psychologists TO public;
GRANT INSERT ON TABLE public.psychologists TO public;
GRANT UPDATE ON TABLE public.psychologists TO public;

-- For Supabase issue with auth.users permissions after pause/restore, try:
-- If the permissions issue persists, check if you have pg_net extension and toggle it off/on:
-- In Dashboard: Database > Extensions > search for pg_net > toggle off and back on 