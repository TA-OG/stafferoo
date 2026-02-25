/**
 * API Route: POST /api/verify-id
 *
 * Handles ID verification requests from the frontend.
 * Accepts document images and returns verification results.
 * Requires a valid Bearer JWT — staff_id is taken from the token, not the request body.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { verifyIDDocument, extractVerificationData } from '@/app/lib/didit';
import { createAdminClient } from '@/app/lib/supabase-server';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = getAuthFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in', requestId } },
      { status: 401 }
    );
  }

  const staffId = auth.user.id;

  try {
    const formData = await request.formData();

    const frontImage = formData.get('front_image') as File;
    const backImage = formData.get('back_image') as File | null;
    const minimumAge = formData.get('minimum_age') as string | null;

    if (!frontImage) {
      return NextResponse.json(
        { ok: false, error: { code: 'BAD_REQUEST', message: 'Front image is required', requestId } },
        { status: 400 }
      );
    }

    const verificationResponse = await verifyIDDocument({
      frontImage,
      backImage: backImage || undefined,
      performDocumentLiveness: true,
      minimumAge: minimumAge ? parseInt(minimumAge) : 18,
      vendorData: staffId,
      expirationDateNotDetectedAction: 'DECLINE',
      invalidMrzAction: 'DECLINE',
      inconsistentDataAction: 'DECLINE',
      preferredCharacters: 'latin',
      saveApiRequest: true,
    });

    const verificationData = extractVerificationData(verificationResponse);
    const supabase = createAdminClient();

    const { error: verificationError } = await supabase
      .from('id_verifications')
      .insert({
        staff_id: staffId,
        provider: 'didit',
        provider_reference: verificationResponse.request_id,
        status: verificationData.status.toLowerCase(),
        payload: verificationResponse,
      });

    if (verificationError) {
      console.error('[POST /api/verify-id] insert failed', { requestId, staffId, error: verificationError });
      return NextResponse.json(
        { ok: false, error: { code: 'DB_ERROR', message: 'Failed to save verification result', requestId } },
        { status: 500 }
      );
    }

    if (verificationData.status === 'Approved') {
      const { error: profileError } = await supabase
        .from('staff_profiles')
        .update({ full_name: verificationData.fullName })
        .eq('id', staffId);

      if (profileError) {
        console.error('[POST /api/verify-id] profile update failed', { requestId, staffId, error: profileError });
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        verification: verificationData,
        request_id: verificationResponse.request_id,
      },
    });

  } catch (error: unknown) {
    console.error('[POST /api/verify-id]', { requestId, staffId, error });
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'ID verification failed', requestId } },
      { status: 500 }
    );
  }
}
