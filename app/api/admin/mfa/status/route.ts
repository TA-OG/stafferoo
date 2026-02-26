/**
 * GET /api/admin/mfa/status
 * Check admin MFA enrollment status
 */

import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { createApiRoute, rateLimits } from '@/app/lib/api-wrapper';
import { isAdminByEmail } from '@/app/lib/admin';

export const GET = createApiRoute(async (request, requestId) => {
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

    // Get MFA factors
    const { data: factors, error } = await auth.supabase.auth.mfa.listFactors();

    if (error) {
      console.error('[GET /api/admin/mfa/status] List failed', { requestId, error });
      return NextResponse.json(
        { ok: false, error: { code: 'FETCH_FAILED', message: error.message, requestId } },
        { status: 500 }
      );
    }

    const totpFactor = factors?.totp?.[0];
    const phoneFactor = factors?.phone?.[0];

    return NextResponse.json({
      ok: true,
      data: {
        enrolled: !!totpFactor || !!phoneFactor,
        totp: totpFactor ? {
          id: totpFactor.id,
          friendlyName: totpFactor.friendly_name,
          status: totpFactor.status,
          createdAt: totpFactor.created_at,
        } : null,
        phone: phoneFactor ? {
          id: phoneFactor.id,
          phone: (phoneFactor as unknown as {phone: string}).phone,
          status: phoneFactor.status,
        } : null,
      },
    });

  } catch (error) {
    console.error('[GET /api/admin/mfa/status] Unexpected error', { requestId, error });
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
}, { rateLimit: rateLimits.apiRead });
