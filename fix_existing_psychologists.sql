-- Fix existing psychologists that were incorrectly activated
-- Reset them to inactive since they haven't actually completed setup

-- Check current status
SELECT id, name, email, user_id, is_active, created_at 
FROM psychologists 
ORDER BY created_at DESC;

-- Reset only Romeo to inactive status
-- Mark is already properly active, so don't change him
UPDATE psychologists 
SET is_active = FALSE 
WHERE email = 'mjmolina444@gmail.com';

-- Verify the fix
SELECT id, name, email, user_id, is_active, created_at 
FROM psychologists 
ORDER BY created_at DESC;

-- Check the table structure to confirm default is now FALSE
SELECT column_name, column_default, is_nullable, data_type
FROM information_schema.columns 
WHERE table_name = 'psychologists' AND column_name = 'is_active';