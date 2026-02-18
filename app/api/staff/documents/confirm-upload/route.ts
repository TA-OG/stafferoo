import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';
import { confirmUploadSchema } from '@/app/lib/validations/documents';
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
            message: 'You must be signed in to confirm uploads',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { doc_type, storage_path, original_filename, mime_type, size_bytes } =
      confirmUploadSchema.parse(body);

    const { data: existingDoc } = await supabase
      .from('staff_documents')
      .select('id')
      .eq('staff_id', user.id)
      .eq('doc_type', doc_type)
      .single();

    if (existingDoc) {
      const { error: updateError } = await supabase
        .from('staff_documents')
        .update({
          storage_path,
          original_filename,
          mime_type,
          size_bytes,
          status: 'pending',
          uploaded_at: new Date().toISOString(),
        })
        .eq('id', existingDoc.id);

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'UPDATE_FAILED',
              message: 'Failed to update document record',
              details: updateError.message,
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        data: { document_id: existingDoc.id, updated: true },
      });
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from('staff_documents')
        .insert({
          staff_id: user.id,
          doc_type,
          storage_path,
          original_filename,
          mime_type,
          size_bytes,
          status: 'pending',
        })
        .select('id')
        .single();

      if (insertError || !insertData) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'INSERT_FAILED',
              message: 'Failed to create document record',
              details: insertError?.message,
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        data: { document_id: insertData.id, created: true },
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid confirmation data',
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
