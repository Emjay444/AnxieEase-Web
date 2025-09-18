-- Migration to add birth_date and other missing fields to psychologists table
-- Run this in your Supabase SQL editor

-- Add birth_date field to psychologists table
ALTER TABLE public.psychologists 
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add other missing fields that should be in psychologists table
ALTER TABLE public.psychologists 
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS sex TEXT;

-- Update psychologists table structure comment
COMMENT ON TABLE public.psychologists IS 'Psychologists with complete profile information including birth_date, license_number, and sex';
COMMENT ON COLUMN public.psychologists.birth_date IS 'Birth date of the psychologist';
COMMENT ON COLUMN public.psychologists.license_number IS 'Professional license number';
COMMENT ON COLUMN public.psychologists.sex IS 'Gender/sex of the psychologist';

-- Optional: If you want to migrate existing birth_date data from user_profiles
-- (Uncomment the following lines if needed)
-- UPDATE public.psychologists 
-- SET birth_date = up.birth_date
-- FROM public.user_profiles up
-- WHERE psychologists.user_id = up.id 
-- AND psychologists.birth_date IS NULL 
-- AND up.birth_date IS NOT NULL;