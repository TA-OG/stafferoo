import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';
import { createUploadSchema } from '@/app/lib/validations/documents';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be signed in to upload documents',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { doc_type, filename } = createUploadSchema.parse(body);

    const fileExtension = filename.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const storagePath = `${user.id}/${doc_type}_${timestamp}_${randomSuffix}.${fileExtension}`;

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('staff-documents')
      .createSignedUploadUrl(storagePath);

    if (signedUrlError || !signedUrlData) {
      console.error('Signed URL error:', signedUrlError);
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'UPLOAD_URL_FAILED',
            message: 'Failed to create upload URL',
            details: signedUrlError?.message,
          },
        },
        { status: 500 }
      );
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
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid upload request',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
