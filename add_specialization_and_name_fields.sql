-- Migration to add specialization field and split name into components
-- Run this in your Supabase SQL editor

-- Add specialization field to psychologists table
ALTER TABLE public.psychologists 
ADD COLUMN IF NOT EXISTS specialization TEXT;

-- Add name components to psychologists table
ALTER TABLE public.psychologists 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS middle_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- You can optionally migrate existing name data with a query like this:
-- UPDATE public.psychologists 
-- SET first_name = split_part(name, ' ', 1),
--     last_name = split_part(name, ' ', -1)
-- WHERE name IS NOT NULL AND first_name IS NULL;

-- Note: You may want to manually update the name fields for existing records
-- to properly split first, middle, and last names
