-- Final migration: Remove redundant `name` column from psychologists
-- Run only after the application no longer relies on the `name` column.
-- Pre-req: sync_name_fields_transition.sql has been applied and backfill completed.

BEGIN;

-- Safety check: ensure no rows have parts all NULL while name is non-NULL
DO $$
DECLARE cnt int;
BEGIN
	SELECT COUNT(*) INTO cnt
	FROM psychologists
	WHERE name IS NOT NULL
		AND COALESCE(NULLIF(btrim(first_name), ''), NULLIF(btrim(last_name), ''), NULLIF(btrim(middle_name), '')) IS NULL;
	IF cnt > 0 THEN
		RAISE EXCEPTION 'Cannot drop column name: % rows would lose display name. Run backfill first.', cnt;
	END IF;
END$$;

-- Drop trigger that keeps name in sync (no longer needed)
DROP TRIGGER IF EXISTS psychologists_sync_name_fields_insupd ON psychologists;
DROP FUNCTION IF EXISTS trg_psychologists_sync_name_fields();
DROP FUNCTION IF EXISTS build_full_name(text, text, text);
DROP FUNCTION IF EXISTS split_full_name(text);
DROP FUNCTION IF EXISTS util_null_if_empty(text);

-- Finally drop column
ALTER TABLE psychologists DROP COLUMN IF EXISTS name;

COMMIT;

-- Verification
-- SELECT column_name FROM information_schema.columns WHERE table_name='psychologists' AND column_name='name'; -- should return 0 rows
