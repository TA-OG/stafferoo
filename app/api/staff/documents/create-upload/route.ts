import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { createUploadSchema } from '@/app/lib/validations/documents';
import { z } from 'zod';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = getAuthFromRequest(request);
  if (!auth.ok) {
    return jsonError(auth.status, auth.code, auth.message);
  }
  const { user, supabase } = auth;

  try {
    const body = await request.json();
    const { doc_type, filename } = createUploadSchema.parse(body);

    const fileExtension = filename.split('.').pop() || 'bin';
    const uniqueId = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    const storagePath = `${user.id}/${doc_type}_${uniqueId}.${fileExtension}`;

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('staff-documents')
      .createSignedUploadUrl(storagePath);

    if (signedUrlError || !signedUrlData) {
      console.error('[create-upload]', { requestId, userId: user.id, error: signedUrlError });
      return jsonError(500, "UPLOAD_URL_FAILED", "Failed to generate upload URL");
    }

    return NextResponse.json({
      ok: true,
      data: {
        upload_url: signedUrlData.signedUrl,
        storage_path: storagePath,
        token: signedUrlData.token,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[create-upload]', { requestId, errors: error.errors });
      return jsonError(400, "VALIDATION_ERROR", "Invalid input data", error.flatten());
    }
    console.error('[create-upload]', { requestId, error });
    return jsonError(500, "INTERNAL_ERROR", "Unexpected error");
  }
}
