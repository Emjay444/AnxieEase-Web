-- Migration script to populate separate name fields from the redundant 'name' column
-- This script will parse existing names and populate first_name, last_name, middle_name
-- Run this before removing the 'name' column

BEGIN;

-- Create a safe backup before migration
CREATE TABLE IF NOT EXISTS psychologists_name_backup AS 
SELECT id, name, first_name, middle_name, last_name 
FROM psychologists 
WHERE name IS NOT NULL;

-- Function to safely split names (handles common patterns)
CREATE OR REPLACE FUNCTION migrate_name_fields()
RETURNS void AS $$
DECLARE
    psych_record RECORD;
    name_parts TEXT[];
    part_count INTEGER;
BEGIN
    -- Loop through all psychologists with a name but missing separate fields
    FOR psych_record IN 
        SELECT id, name 
        FROM psychologists 
        WHERE name IS NOT NULL 
        AND name != ''
        AND (first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '')
    LOOP
        -- Split the name by spaces
        name_parts := string_to_array(trim(psych_record.name), ' ');
        part_count := array_length(name_parts, 1);
        
        RAISE NOTICE 'Processing: % with % parts: %', psych_record.name, part_count, name_parts;
        
        -- Handle different name patterns
        IF part_count = 1 THEN
            -- Single name - assume it's first name
            UPDATE psychologists 
            SET first_name = name_parts[1],
                middle_name = NULL,
                last_name = NULL
            WHERE id = psych_record.id;
            
        ELSIF part_count = 2 THEN
            -- Two parts - first and last name
            UPDATE psychologists 
            SET first_name = name_parts[1],
                middle_name = NULL,
                last_name = name_parts[2]
            WHERE id = psych_record.id;
            
        ELSIF part_count = 3 THEN
            -- Three parts - first, middle, last
            UPDATE psychologists 
            SET first_name = name_parts[1],
                middle_name = name_parts[2],
                last_name = name_parts[3]
            WHERE id = psych_record.id;
            
        ELSIF part_count >= 4 THEN
            -- Four or more parts - first, middle (combined), last
            UPDATE psychologists 
            SET first_name = name_parts[1],
                middle_name = array_to_string(name_parts[2:part_count-1], ' '),
                last_name = name_parts[part_count]
            WHERE id = psych_record.id;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE 'Name migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT migrate_name_fields();

-- Show results for verification
SELECT 
    id,
    name as original_name,
    first_name,
    middle_name,
    last_name,
    CASE 
        WHEN middle_name IS NOT NULL AND middle_name != '' THEN 
            concat(first_name, ' ', middle_name, ' ', last_name)
        ELSE 
            concat(first_name, ' ', last_name)
    END as reconstructed_name
FROM psychologists 
WHERE name IS NOT NULL
ORDER BY id;

-- Clean up the function
DROP FUNCTION migrate_name_fields();

COMMIT;

-- Instructions:
-- 1. Run this script in your Supabase SQL editor
-- 2. Verify the results look correct
-- 3. Test your application to make sure names display properly
-- 4. Once confirmed, you can run remove_redundant_name_column.sql to drop the 'name' column