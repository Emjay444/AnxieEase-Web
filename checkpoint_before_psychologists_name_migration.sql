-- Checkpoint: Backup current psychologists table before migrating away from the `name` column
-- Date: 2025-09-18
-- Purpose: Creates a full data snapshot you can restore if anything goes wrong during the migration.
-- Notes:
--   - This uses CREATE TABLE AS SELECT which does not copy constraints or indexes. For a rollback of data values this is sufficient.
--   - The psychologists table uses UUIDs, so there are no sequences to snapshot.
--   - You can safely re-run this script; it will drop the previous backup then recreate it.

BEGIN;

-- Use a stable, timestamped backup table name
DROP TABLE IF EXISTS backup_psychologists_20250918;
CREATE TABLE backup_psychologists_20250918 AS
SELECT * FROM psychologists;

-- Optional: also snapshot dependent tables that might be impacted by name display logic.
-- These blocks only run if the source table exists.

-- user_profiles (commonly used in this app)
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.tables
		WHERE table_name = 'user_profiles'
	) THEN
		EXECUTE 'DROP TABLE IF EXISTS backup_user_profiles_20250918';
		EXECUTE 'CREATE TABLE backup_user_profiles_20250918 AS SELECT * FROM user_profiles';
	END IF;
END $$;

-- patients (if present in your schema)
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.tables
		WHERE table_name = 'patients'
	) THEN
		EXECUTE 'DROP TABLE IF EXISTS backup_patients_20250918';
		EXECUTE 'CREATE TABLE backup_patients_20250918 AS SELECT * FROM patients';
	END IF;
END $$;

-- appointments (if present)
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.tables
		WHERE table_name = 'appointments'
	) THEN
		EXECUTE 'DROP TABLE IF EXISTS backup_appointments_20250918';
		EXECUTE 'CREATE TABLE backup_appointments_20250918 AS SELECT * FROM appointments';
	END IF;
END $$;

COMMIT;

-- How to verify backup
-- SELECT COUNT(*) FROM backup_psychologists_20250918;  -- should match psychologists row count
-- SELECT * FROM backup_psychologists_20250918 LIMIT 5;
