/**
 * POST /api/admin/mfa/unenroll
 * Unenroll admin from MFA (requires verification)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthFromRequest } from '@/app/lib/auth';
import { createApiRoute, rateLimits } from '@/app/lib/api-wrapper';
import { isAdminByEmail } from '@/app/lib/admin';

const unenrollSchema = z.object({
  factorId: z.string().uuid(),
  code: z.string().length(6).regex(/^\d+$/), // Require current MFA code to unenroll
});

export const POST = createApiRoute(async (request, requestId) => {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: auth.message, requestId } },
        { status: auth.status }
      );
    }

    // Check if user is admin
    const isAdmin = auth.user.email ? await isAdminByEmail(auth.user.email) : false;
    if (!isAdmin) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Admin access required', requestId } },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const parseResult = unenrollSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid request format',
            requestId 
          } 
        },
        { status: 400 }
      );
    }

    const { factorId, code } = parseResult.data;

    // First create a challenge, then verify the code to confirm identity
    const { data: challenge, error: challengeError } = await auth.supabase.auth.mfa.challenge({
      factorId,
    });
    
    if (challengeError) {
      return NextResponse.json(
        { ok: false, error: { code: 'CHALLENGE_FAILED', message: challengeError.message, requestId } },
        { status: 500 }
      );
    }

    const { error: verifyError } = await auth.supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    if (verifyError) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_CODE', message: 'Invalid verification code', requestId } },
        { status: 400 }
      );
    }

    // Unenroll the factor
    const { error } = await auth.supabase.auth.mfa.unenroll({
      factorId,
    });

    if (error) {
      console.error('[POST /api/admin/mfa/unenroll] Unenroll failed', { requestId, error });
      return NextResponse.json(
        { ok: false, error: { code: 'UNENROLL_FAILED', message: error.message, requestId } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        message: 'MFA unenrolled successfully',
      },
    });

  } catch (error) {
    console.error('[POST /api/admin/mfa/unenroll] Unexpected error', { requestId, error });
    return NextResponse.json(
      { 
        ok: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An unexpected error occurred',
          requestId 
        } 
      },
      { status: 500 }
    );
  }
}, { rateLimit: rateLimits.apiMutation });
