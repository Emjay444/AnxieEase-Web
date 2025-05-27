-- SQL script to add completion-related columns to the appointments table

-- Add completed flag column
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- Add completion_notes column
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Add completion_date column
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ;

-- This script should be run in the Supabase SQL Editor 