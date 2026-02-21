-- Migration 0016: Worker claim_next_job function
--
-- Adds an atomic job-claiming function for the background worker.
-- Uses FOR UPDATE SKIP LOCKED to safely support concurrent worker instances.
--
-- Reversible: DROP FUNCTION IF EXISTS claim_next_job();

CREATE OR REPLACE FUNCTION claim_next_job()
RETURNS jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job jobs;
BEGIN
  UPDATE jobs
  SET
    status     = 'running',
    started_at = now(),
    attempts   = attempts + 1,
    updated_at = now()
  WHERE id = (
    SELECT id FROM jobs
    WHERE (
      status = 'pending'
      OR (status = 'failed' AND attempts < max_attempts)
    )
    AND run_at <= now()
    ORDER BY run_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;

-- Only the service role (used by the worker) can call this function.
GRANT EXECUTE ON FUNCTION claim_next_job() TO service_role;
