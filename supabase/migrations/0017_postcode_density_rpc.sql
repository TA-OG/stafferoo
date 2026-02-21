-- Migration 0017: get_postcode_density RPC
--
-- Returns one row per postcode aggregating approved staff counts,
-- approved settings counts, and the enabled status from enabled_postcodes.
--
-- Covers all postcodes that appear in any of the three tables so the admin
-- can see both registered activity and already-listed postcodes with no users.
--
-- Reversible: DROP FUNCTION IF EXISTS get_postcode_density();

CREATE OR REPLACE FUNCTION get_postcode_density()
RETURNS TABLE (
  postcode       text,
  staff_count    bigint,
  settings_count bigint,
  enabled        boolean,
  notes          text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH
  staff_counts AS (
    SELECT
      upper(regexp_replace(trim(postcode), '\s+', '', 'g')) AS postcode,
      count(*)                                               AS staff_count
    FROM staff_profiles
    WHERE verification_status = 'approved'
      AND postcode IS NOT NULL
      AND trim(postcode) <> ''
    GROUP BY 1
  ),
  settings_counts AS (
    SELECT
      upper(regexp_replace(trim(postcode), '\s+', '', 'g')) AS postcode,
      count(*)                                               AS settings_count
    FROM setting_profiles
    WHERE verification_status = 'approved'
      AND trim(postcode) <> ''
    GROUP BY 1
  ),
  all_postcodes AS (
    SELECT postcode FROM staff_counts
    UNION
    SELECT postcode FROM settings_counts
    UNION
    SELECT upper(regexp_replace(trim(postcode), '\s+', '', 'g'))
    FROM enabled_postcodes
  )
  SELECT
    ap.postcode,
    coalesce(sc.staff_count,    0) AS staff_count,
    coalesce(ss.settings_count, 0) AS settings_count,
    ep.enabled,
    ep.notes
  FROM all_postcodes ap
  LEFT JOIN staff_counts      sc ON sc.postcode = ap.postcode
  LEFT JOIN settings_counts   ss ON ss.postcode = ap.postcode
  LEFT JOIN enabled_postcodes ep ON ep.postcode = ap.postcode
  ORDER BY ap.postcode ASC;
$$;

-- Only the service role (used by createAdminClient) may call this.
GRANT EXECUTE ON FUNCTION get_postcode_density() TO service_role;
