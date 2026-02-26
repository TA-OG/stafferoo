/**
 * POST /api/admin/mfa/setup
 * Enroll admin in MFA (TOTP)
 */

import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { createApiRoute, rateLimits } from '@/app/lib/api-wrapper';
import { isAdminByEmail } from '@/app/lib/admin';

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

    // Check if MFA already enrolled
    const { data: factors } = await auth.supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp?.[0];

    if (totpFactor) {
      return NextResponse.json({
        ok: true,
        data: {
          alreadyEnrolled: true,
          factorId: totpFactor.id,
          friendlyName: totpFactor.friendly_name,
        },
      });
    }

    // Enroll new TOTP factor
    const { data, error } = await auth.supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Admin Dashboard',
    });

    if (error) {
      console.error('[POST /api/admin/mfa/setup] Enroll failed', { requestId, error });
      return NextResponse.json(
        { ok: false, error: { code: 'ENROLL_FAILED', message: error.message, requestId } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        factorId: data.id,
        qrCode: data.totp.qr_code, // Base64 QR code
        secret: data.totp.secret, // Manual entry secret
        uri: data.totp.uri, // otpauth:// URI
      },
    });

  } catch (error) {
    console.error('[POST /api/admin/mfa/setup] Unexpected error', { requestId, error });
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
