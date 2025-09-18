-- Verification script to check current state of name fields in psychologists table
-- Run this to see what data needs to be migrated

SELECT 
    id,
    email,
    name as current_name_field,
    first_name,
    middle_name, 
    last_name,
    is_active,
    CASE 
        WHEN name IS NOT NULL AND name != '' THEN 'HAS_NAME'
        ELSE 'NO_NAME'
    END as name_status,
    CASE 
        WHEN first_name IS NOT NULL AND first_name != '' THEN 'HAS_FIRST'
        ELSE 'NO_FIRST'
    END as first_name_status,
    CASE 
        WHEN last_name IS NOT NULL AND last_name != '' THEN 'HAS_LAST'
        ELSE 'NO_LAST'
    END as last_name_status
FROM psychologists 
ORDER BY is_active DESC, id;

-- Summary of what needs migration
SELECT 
    COUNT(*) as total_psychologists,
    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as has_name_field,
    COUNT(CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 1 END) as has_first_name,
    COUNT(CASE WHEN last_name IS NOT NULL AND last_name != '' THEN 1 END) as has_last_name,
    COUNT(CASE WHEN (name IS NOT NULL AND name != '') AND (first_name IS NULL OR first_name = '') THEN 1 END) as needs_migration
FROM psychologists;