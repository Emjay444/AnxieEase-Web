-- Auto-populate missing name fields from backup data
-- This will fix any psychologists who have empty name fields

-- First, show what needs to be fixed
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  b.name as backup_original_name,
  -- Extract first name (everything before first space, or whole name if no space)
  CASE 
    WHEN b.name IS NOT NULL THEN 
      split_part(trim(b.name), ' ', 1)
    ELSE NULL
  END as suggested_first_name,
  -- Extract middle name (second part if 3+ parts)
  CASE 
    WHEN b.name IS NOT NULL AND array_length(string_to_array(trim(b.name), ' '), 1) = 3 THEN
      split_part(trim(b.name), ' ', 2)
    ELSE NULL
  END as suggested_middle_name,
  -- Extract last name (last part if 2+ parts)
  CASE 
    WHEN b.name IS NOT NULL AND array_length(string_to_array(trim(b.name), ' '), 1) >= 2 THEN
      split_part(trim(b.name), ' ', array_length(string_to_array(trim(b.name), ' '), 1))
    ELSE NULL
  END as suggested_last_name
FROM psychologists p
LEFT JOIN backup_psychologists_20250918 b ON p.id = b.id
WHERE p.is_active = true 
  AND (p.first_name IS NULL OR p.first_name = '' OR p.last_name IS NULL OR p.last_name = '')
  AND b.name IS NOT NULL;

-- Auto-fix script (uncomment to run)
/*
UPDATE psychologists 
SET 
  first_name = split_part(trim(backup.name), ' ', 1),
  last_name = CASE 
    WHEN array_length(string_to_array(trim(backup.name), ' '), 1) >= 2 THEN
      split_part(trim(backup.name), ' ', array_length(string_to_array(trim(backup.name), ' '), 1))
    ELSE NULL
  END,
  middle_name = CASE 
    WHEN array_length(string_to_array(trim(backup.name), ' '), 1) = 3 THEN
      split_part(trim(backup.name), ' ', 2)
    ELSE NULL
  END
FROM backup_psychologists_20250918 backup
WHERE psychologists.id = backup.id
  AND psychologists.is_active = true 
  AND (psychologists.first_name IS NULL OR psychologists.first_name = '' OR psychologists.last_name IS NULL OR psychologists.last_name = '')
  AND backup.name IS NOT NULL;
*/

-- Verify results after running the update
SELECT 
  id,
  email,
  first_name,
  middle_name,
  last_name,
  CASE 
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 
      CASE 
        WHEN middle_name IS NOT NULL AND middle_name != '' THEN 
          concat(first_name, ' ', middle_name, ' ', last_name)
        ELSE 
          concat(first_name, ' ', last_name)
      END
    ELSE 'Missing Name Data'
  END as full_name_constructed
FROM psychologists 
WHERE is_active = true
ORDER BY created_at DESC;