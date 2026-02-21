/**
 * Handler for the `reference_request_email` job type.
 *
 * Validates the JSONB payload from the jobs table, then sends a referee
 * invitation email via Resend using the shared email template.
 *
 * Throws on failure so the outer dispatcher can mark the job as failed
 * and handle retries.
 */

import { type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { sendEmail, refereeInvitationHtml } from '@/app/lib/email';

// ---------------------------------------------------------------------------
// Payload validation — must match ReferenceRequestEmailPayload in app/lib/jobs.ts
// ---------------------------------------------------------------------------

const payloadSchema = z.object({
  referenceRequestId: z.string().uuid(),
  applicantName:      z.string().min(1),
  refereeFirstName:   z.string().min(1),
  refereeName:        z.string().min(1),
  refereeEmail:       z.string().email(),
  referenceLink:      z.string().url(),
  expiresAt:          z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * @param _db  Supabase admin client (available if handler needs DB reads/writes)
 * @param rawPayload  The raw JSONB payload from the jobs table
 */
export async function handleReferenceRequestEmail(
  _db: SupabaseClient,
  rawPayload: Record<string, unknown>
): Promise<void> {
  const parsed = payloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    throw new Error(
      `[worker] reference_request_email: invalid payload — ${JSON.stringify(parsed.error.flatten())}`
    );
  }

  const p = parsed.data;

  const html = refereeInvitationHtml({
    applicantName:    p.applicantName,
    refereeFirstName: p.refereeFirstName,
    referenceLink:    p.referenceLink,
    expiresAt:        new Date(p.expiresAt),
  });

  const result = await sendEmail({
    to:      p.refereeEmail,
    subject: `Reference request for ${p.applicantName} — Stafferoo`,
    html,
  });

  if (!result.ok) {
    throw new Error(
      `[worker] reference_request_email: sendEmail failed — ${result.error}`
    );
  }

  console.log('[worker] reference_request_email sent', {
    event:              'worker.job.reference_email_sent',
    referenceRequestId: p.referenceRequestId,
    to:                 p.refereeEmail,
    emailId:            result.id,
  });
}
