/**
 * POST /api/r/reference/[token]/submit
 *
 * Public endpoint — no user session. Called by the referee form.
 * Validates answers, calls submit_reference_response RPC (SECURITY DEFINER),
 * which stores the answers and marks the token as used.
 *
 * Security:
 * - Token is hashed before DB lookup; raw token never stored.
 * - RPC enforces single-use and expiry atomically.
 * - Feature flag guard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase-server';
import { features } from '@/app/lib/features';
import {
  submitReferenceSchema,
  hashReferenceToken,
} from '@/app/lib/validations/references';
import { z } from 'zod';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const requestId = crypto.randomUUID();

  if (!features.references) {
    return jsonError(404, 'FEATURE_DISABLED', 'References feature is not enabled.');
  }

  const { token } = await params;

  // Basic token format validation before hashing
  if (!/^[0-9a-f]{64}$/.test(token)) {
    return jsonError(400, 'INVALID_TOKEN', 'Invalid reference token format.');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'BAD_REQUEST', 'Request body is missing or not valid JSON');
  }

  const parsed = submitReferenceSchema.safeParse(body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    console.error('[reference-submit] validation failed', { requestId, fields: flat.fieldErrors });
    return jsonError(400, 'VALIDATION_ERROR', 'Validation failed — please check all fields', flat);
  }

  const { answers } = parsed.data;

  try {
    const tokenHash = await hashReferenceToken(token);
    const adminDb = createAdminClient();

    const { error: submitError } = await adminDb.rpc('submit_reference_response', {
      p_token_hash: tokenHash,
      p_answers:    answers,
    });

    if (submitError) {
      const msg: string = submitError.message ?? '';

      if (msg.includes('TOKEN_NOT_FOUND')) {
        return jsonError(404, 'TOKEN_NOT_FOUND', 'This reference link is not valid.');
      }
      if (msg.includes('TOKEN_ALREADY_USED')) {
        return jsonError(409, 'TOKEN_ALREADY_USED', 'This reference has already been submitted. Thank you!');
      }
      if (msg.includes('TOKEN_EXPIRED')) {
        return jsonError(410, 'TOKEN_EXPIRED', 'This reference link has expired. Please contact the applicant to request a new link.');
      }

      console.error('[reference-submit] submit_reference_response failed', { requestId, error: submitError });
      return jsonError(500, 'DB_ERROR', `Failed to submit reference: ${submitError.message}`);
    }

    console.log('[reference-submit] submitted', {
      event:     'references.referee_submitted',
      requestId,
      tokenHash: tokenHash.slice(0, 8), // partial hash for log correlation, never full
    });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[reference-submit] unexpected error', { requestId, error: err });
    if (err instanceof z.ZodError) {
      return jsonError(400, 'VALIDATION_ERROR', 'Validation failed', err.flatten());
    }
    return jsonError(500, 'INTERNAL_ERROR', 'Unexpected error submitting reference');
  }
}
