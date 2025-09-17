-- Fix the current Romeo Buagas entry that was incorrectly activated
-- This will reset him to inactive status since he hasn't completed setup yet

-- First, let's see the current state
SELECT id, name, email, user_id, is_active, created_at 
FROM psychologists 
WHERE email = 'mjmolina444@gmail.com';

-- Reset Romeo Buagas to inactive since he hasn't completed setup
UPDATE psychologists 
SET is_active = FALSE 
WHERE email = 'mjmolina444@gmail.com' AND user_id IS NOT NULL;

-- Verify the change
SELECT id, name, email, user_id, is_active, created_at 
FROM psychologists 
WHERE email = 'mjmolina444@gmail.com';

-- Show all psychologists for verification
SELECT id, name, email, user_id, is_active, created_at 
FROM psychologists 
ORDER BY created_at DESC;