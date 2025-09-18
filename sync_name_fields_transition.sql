-- Transitional sync: keep `name` and split fields in sync during migration
-- Applies to table: psychologists
-- Safe to run multiple times (CREATE OR REPLACE)
-- Behavior:
--   - On INSERT/UPDATE: if split fields present but `name` NULL/empty, compute `name`.
--   - If `name` present but split fields empty, attempt to parse into first/middle/last.
--   - On updates where any of the name fields change, recompute both sides.

BEGIN;

-- Helper function to trim to NULL
CREATE OR REPLACE FUNCTION util_null_if_empty(t text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF t IS NULL OR btrim(t) = '' THEN
    RETURN NULL;
  END IF;
  RETURN btrim(t);
END;$$;

-- Function to build full name from parts
CREATE OR REPLACE FUNCTION build_full_name(first_name text, middle_name text, last_name text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  parts text[] := ARRAY[]::text[];
BEGIN
  IF util_null_if_empty(first_name) IS NOT NULL THEN parts := parts || btrim(first_name); END IF;
  IF util_null_if_empty(middle_name) IS NOT NULL THEN parts := parts || btrim(middle_name); END IF;
  IF util_null_if_empty(last_name) IS NOT NULL THEN parts := parts || btrim(last_name); END IF;
  IF array_length(parts,1) IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN array_to_string(parts, ' ');
END;$$;

-- Function to split a full name into parts (basic heuristic)
CREATE OR REPLACE FUNCTION split_full_name(full_name text)
RETURNS TABLE(first_name text, middle_name text, last_name text)
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  parts text[];
  n int;
BEGIN
  IF util_null_if_empty(full_name) IS NULL THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::text;
  END IF;
  parts := regexp_split_to_array(btrim(full_name), '\\s+');
  n := array_length(parts,1);
  IF n = 1 THEN
    RETURN QUERY SELECT parts[1], NULL::text, NULL::text;
  ELSIF n = 2 THEN
    RETURN QUERY SELECT parts[1], NULL::text, parts[2];
  ELSE
    RETURN QUERY SELECT parts[1], array_to_string(parts[2:n-1], ' '), parts[n];
  END IF;
END;$$;

-- Trigger function to sync fields
CREATE OR REPLACE FUNCTION trg_psychologists_sync_name_fields()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  f text; m text; l text; built text;
BEGIN
  -- Normalize inputs
  NEW.first_name := util_null_if_empty(NEW.first_name);
  NEW.middle_name := util_null_if_empty(NEW.middle_name);
  NEW.last_name := util_null_if_empty(NEW.last_name);
  NEW.name := util_null_if_empty(NEW.name);

  -- If parts given, ensure NEW.name matches
  built := build_full_name(NEW.first_name, NEW.middle_name, NEW.last_name);
  IF built IS NOT NULL THEN
    NEW.name := built;
  ELSIF NEW.name IS NOT NULL THEN
    -- If only full name is provided, attempt to split
    SELECT * INTO f, m, l FROM split_full_name(NEW.name);
    NEW.first_name := COALESCE(NEW.first_name, f);
    NEW.middle_name := COALESCE(NEW.middle_name, m);
    NEW.last_name := COALESCE(NEW.last_name, l);
  END IF;

  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS psychologists_sync_name_fields_insupd ON psychologists;
CREATE TRIGGER psychologists_sync_name_fields_insupd
BEFORE INSERT OR UPDATE ON psychologists
FOR EACH ROW
EXECUTE FUNCTION trg_psychologists_sync_name_fields();

COMMIT;

-- One-time backfill to synchronize existing rows
-- 1) If parts exist but name is null/empty, set name from parts
UPDATE psychologists
SET name = build_full_name(first_name, middle_name, last_name)
WHERE util_null_if_empty(name) IS NULL
  AND (util_null_if_empty(first_name) IS NOT NULL
    OR util_null_if_empty(middle_name) IS NOT NULL
    OR util_null_if_empty(last_name) IS NOT NULL);

-- 2) If name exists but parts are all null/empty, split into parts
UPDATE psychologists p
SET 
  first_name = COALESCE(p.first_name, s.first_name),
  middle_name = COALESCE(p.middle_name, s.middle_name),
  last_name = COALESCE(p.last_name, s.last_name)
FROM (
  SELECT id, (split_full_name(name)).* FROM psychologists
) AS s(id, first_name, middle_name, last_name)
WHERE p.id = s.id
  AND util_null_if_empty(p.name) IS NOT NULL
  AND util_null_if_empty(p.first_name) IS NULL
  AND util_null_if_empty(p.middle_name) IS NULL
  AND util_null_if_empty(p.last_name) IS NULL;
