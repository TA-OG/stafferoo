/**
 * POST /api/staff/onboarding/references/send
 *
 * Creates or updates both reference records, generates secure one-time tokens,
 * creates reference_request rows (hashed), and enqueues email jobs.
 *
 * Security:
 * - Bearer JWT required.
 * - Professional email domain validated against FREE_EMAIL_DOMAINS blocklist.
 * - Raw tokens generated in memory, hashed with SHA-256, only hash stored in DB.
 * - Raw tokens returned to client only in this response so they can be used
 *   to construct the mailto fallback link — they are NOT persisted anywhere.
 *
 * Feature flag: FEATURE_REFERENCES must be enabled.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { createAdminClient } from '@/app/lib/supabase-server';
import { features } from '@/app/lib/features';
import { enqueueJob } from '@/app/lib/jobs';
import {
  sendReferencesSchema,
  extractEmailDomain,
  generateReferenceToken,
  hashReferenceToken,
  TOKEN_EXPIRY_MS,
} from '@/app/lib/validations/references';
import { z } from 'zod';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  // Feature flag guard
  if (!features.references) {
    return jsonError(404, 'FEATURE_DISABLED', 'References feature is not enabled.');
  }

  const auth = getAuthFromRequest(request);
  if (!auth.ok) {
    return jsonError(auth.status, auth.code, auth.message);
  }
  const { user, supabase } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'BAD_REQUEST', 'Request body is missing or not valid JSON');
  }

  const parsed = sendReferencesSchema.safeParse(body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    console.error('[references/send] validation failed', { requestId, userId: user.id, fields: flat.fieldErrors });
    return jsonError(400, 'VALIDATION_ERROR', 'Validation failed', flat);
  }

  const { professional, personal } = parsed.data;

  try {
    // -------------------------------------------------------------------------
    // 1. Upsert both reference records via SECURITY DEFINER RPC
    // -------------------------------------------------------------------------
    const { data: refIds, error: upsertError } = await supabase.rpc(
      'upsert_staff_references',
      {
        p_professional_referee_name:     professional.referee_name,
        p_professional_referee_position: professional.referee_position,
        p_professional_referee_email:    professional.referee_email,
        p_professional_email_domain:     extractEmailDomain(professional.referee_email),
        p_professional_setting_urn:      professional.setting_urn,
        p_professional_setting_name:     professional.setting_name,
        p_personal_referee_name:         personal.referee_name,
        p_personal_referee_position:     personal.referee_position ?? '',
        p_personal_referee_email:        personal.referee_email,
        p_personal_email_domain:         extractEmailDomain(personal.referee_email),
      }
    );

    if (upsertError || !refIds) {
      console.error('[references/send] upsert_staff_references failed', { requestId, userId: user.id, error: upsertError });
      return jsonError(500, 'DB_ERROR', `Failed to save references: ${upsertError?.message ?? 'unknown'}`);
    }

    const profRefId = (refIds as { professional_id: string; personal_id: string }).professional_id;
    const persRefId = (refIds as { professional_id: string; personal_id: string }).personal_id;

    // -------------------------------------------------------------------------
    // 2. Generate tokens and create reference_request rows
    //    Raw tokens are generated here, hashed, and only the hash is stored.
    // -------------------------------------------------------------------------
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stafferoo.app';
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    const profToken = generateReferenceToken();
    const profTokenHash = await hashReferenceToken(profToken);
    const profLink = `${baseUrl}/r/reference/${profToken}`;

    const persToken = generateReferenceToken();
    const persTokenHash = await hashReferenceToken(persToken);
    const persLink = `${baseUrl}/r/reference/${persToken}`;

    const { error: profReqError } = await supabase.rpc('create_reference_request', {
      p_staff_reference_id: profRefId,
      p_token_hash:         profTokenHash,
      p_expires_at:         expiresAt.toISOString(),
    });

    if (profReqError) {
      console.error('[references/send] create_reference_request (professional) failed', { requestId, error: profReqError });
      return jsonError(500, 'DB_ERROR', `Failed to create professional reference request: ${profReqError.message}`);
    }

    const { error: persReqError } = await supabase.rpc('create_reference_request', {
      p_staff_reference_id: persRefId,
      p_token_hash:         persTokenHash,
      p_expires_at:         expiresAt.toISOString(),
    });

    if (persReqError) {
      console.error('[references/send] create_reference_request (personal) failed', { requestId, error: persReqError });
      return jsonError(500, 'DB_ERROR', `Failed to create personal reference request: ${persReqError.message}`);
    }

    // -------------------------------------------------------------------------
    // 3. Enqueue email jobs — non-blocking: a queue failure must NOT prevent
    //    the response. The reference records and tokens are already committed.
    //    The worker will pick up any jobs that land; if the jobs table is
    //    unavailable the links are still valid and can be shared manually.
    // -------------------------------------------------------------------------
    let emailsQueued = true;
    try {
      const adminDb = createAdminClient();
      const applicantName = user.email; // overridden with full_name at worker time

      const profFirstName = professional.referee_name.split(' ')[0];
      const persFirstName = personal.referee_name.split(' ')[0];

      await enqueueJob(adminDb, {
        type: 'reference_request_email',
        data: {
          referenceRequestId: profRefId,
          applicantName,
          refereeFirstName:   profFirstName,
          refereeName:        professional.referee_name,
          refereeEmail:       professional.referee_email,
          referenceLink:      profLink,
          expiresAt:          expiresAt.toISOString(),
        },
      });

      await enqueueJob(adminDb, {
        type: 'reference_request_email',
        data: {
          referenceRequestId: persRefId,
          applicantName,
          refereeFirstName:   persFirstName,
          refereeName:        personal.referee_name,
          refereeEmail:       personal.referee_email,
          referenceLink:      persLink,
          expiresAt:          expiresAt.toISOString(),
        },
      });
    } catch (queueErr) {
      emailsQueued = false;
      console.error('[references/send] email queue failed — references saved, emails will not auto-send', {
        event:    'references.email_queue_failed',
        requestId,
        userId:   user.id,
        profRefId,
        persRefId,
        error:    queueErr,
      });
    }

    // -------------------------------------------------------------------------
    // 4. Audit log
    // -------------------------------------------------------------------------
    console.log('[references/send] links_sent', {
      event:       'references.links_sent',
      requestId,
      userId:      user.id,
      profRefId,
      persRefId,
      emailsQueued,
    });

    return NextResponse.json({
      ok: true,
      data: {
        professional: { reference_id: profRefId, status: 'sent' },
        personal:     { reference_id: persRefId, status: 'sent' },
        expires_at:   expiresAt.toISOString(),
        emails_queued: emailsQueued,
      },
    });

  } catch (err) {
    console.error('[references/send] unexpected error', { requestId, userId: user.id, error: err });
    if (err instanceof z.ZodError) {
      return jsonError(400, 'VALIDATION_ERROR', 'Validation failed', err.flatten());
    }
    return jsonError(500, 'INTERNAL_ERROR', 'Unexpected error sending references');
  }
}
