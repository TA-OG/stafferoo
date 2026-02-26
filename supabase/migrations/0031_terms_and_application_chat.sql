-- Migration 0031: terms_accepted_at on profiles + extend chat to application stage
-- Reversible — see DOWN section at the bottom

-- ============================================================
-- 1. Terms acceptance timestamps
-- ============================================================
ALTER TABLE setting_profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE staff_profiles   ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- ============================================================
-- 2. Extend chat_messages to anchor on booking_response
--    so chat is available from the application stage, not
--    only once a booking is confirmed.
-- ============================================================
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS booking_response_id UUID
    REFERENCES booking_responses(id) ON DELETE CASCADE;

-- Make booking_id nullable (was NOT NULL) so application-stage
-- messages don't need a confirmed booking.
ALTER TABLE chat_messages
  ALTER COLUMN booking_id DROP NOT NULL;

-- Ensure at least one anchor is always set.
ALTER TABLE chat_messages
  ADD CONSTRAINT chk_chat_anchor
    CHECK (booking_id IS NOT NULL OR booking_response_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_chat_messages_response
  ON chat_messages(booking_response_id, created_at)
  WHERE booking_response_id IS NOT NULL;

-- ============================================================
-- 3. RLS policy: application-stage chat participants
--    Sender must be the applicant staff OR the setting that
--    posted the job. Existing booking-scoped policy is kept.
-- ============================================================
CREATE POLICY "application chat participants"
  ON chat_messages
  FOR ALL
  USING (
    booking_response_id IS NOT NULL
    AND (
      -- Applicant staff
      EXISTS (
        SELECT 1 FROM booking_responses br
        WHERE br.id = chat_messages.booking_response_id
          AND br.staff_id = auth.uid()
      )
      OR
      -- Setting that posted the job
      EXISTS (
        SELECT 1
          FROM booking_responses br
          JOIN job_requests       jr ON jr.id = br.job_request_id
          JOIN setting_profiles   sp ON sp.id = jr.setting_id
         WHERE br.id = chat_messages.booking_response_id
           AND sp.id = auth.uid()
      )
    )
  );

-- ============================================================
-- DOWN (for reference — run manually to revert)
-- ============================================================
-- DROP POLICY IF EXISTS "application chat participants" ON chat_messages;
-- DROP INDEX  IF EXISTS idx_chat_messages_response;
-- ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chk_chat_anchor;
-- ALTER TABLE chat_messages DROP COLUMN  IF EXISTS booking_response_id;
-- ALTER TABLE chat_messages ALTER COLUMN booking_id SET NOT NULL;
-- ALTER TABLE setting_profiles DROP COLUMN IF EXISTS terms_accepted_at;
-- ALTER TABLE staff_profiles   DROP COLUMN IF EXISTS terms_accepted_at;
