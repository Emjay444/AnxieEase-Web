-- Fix psychologist is_active default value
-- This migration changes the default value from TRUE to FALSE
-- so new psychologists are inactive until they complete setup

-- First, let's see the current table structure
\d psychologists;

-- Change the default value for is_active column to FALSE
ALTER TABLE psychologists 
ALTER COLUMN is_active SET DEFAULT FALSE;

-- Update any existing psychologists that should be inactive 
-- (those without a user_id, meaning they haven't completed setup)
UPDATE psychologists 
SET is_active = FALSE 
WHERE user_id IS NULL;

-- Verify the changes
SELECT id, name, email, user_id, is_active, created_at 
FROM psychologists 
ORDER BY created_at DESC;

-- Show the updated table structure
\d psychologists;