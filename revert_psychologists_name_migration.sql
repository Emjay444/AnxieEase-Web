-- Revert script: Restore psychologists table data from the backup created in checkpoint_before_psychologists_name_migration.sql
-- Date: 2025-09-18
-- WARNING: This will overwrite current psychologists rows with the snapshot values.
-- Make sure you want to discard changes made after the checkpoint.

BEGIN;

-- Basic integrity safety check: ensure backup table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'backup_psychologists_20250918'
  ) THEN
    RAISE EXCEPTION 'Backup table backup_psychologists_20250918 not found. Aborting revert.';
  END IF;
END $$;

-- Strategy: Upsert from backup into psychologists to put back original values
-- This preserves rows created after the snapshot but will update overlapping ids to snapshot values.
-- If you want a full replace, uncomment the TRUNCATE + INSERT block below.

-- Upsert path (safer)
INSERT INTO psychologists AS p (
  id,user_id,name,email,contact,is_active,created_at,updated_at,
  license_number,sex,avatar_url,bio,specialization,
  first_name,middle_name,last_name
)
SELECT
  id,user_id,name,email,contact,is_active,created_at,updated_at,
  license_number,sex,avatar_url,bio,specialization,
  first_name,middle_name,last_name
FROM backup_psychologists_20250918 b
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  contact = EXCLUDED.contact,
  is_active = EXCLUDED.is_active,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  license_number = EXCLUDED.license_number,
  sex = EXCLUDED.sex,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  specialization = EXCLUDED.specialization,
  first_name = EXCLUDED.first_name,
  middle_name = EXCLUDED.middle_name,
  last_name = EXCLUDED.last_name;

-- Full replace option (commented)
-- TRUNCATE TABLE psychologists RESTART IDENTITY;
-- INSERT INTO psychologists SELECT * FROM backup_psychologists_20250918;

COMMIT;
