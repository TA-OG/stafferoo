import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { confirmUploadSchema } from '@/app/lib/validations/documents';
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
    const validated = confirmUploadSchema.parse(body);

    // PRIMARY PATH: direct insert — works once migration 0008 is applied which
    // fixes the RLS policy to use `auth.uid() = staff_id` directly (no subquery
    // that touches auth.users).
    const { data: insertedRow, error: insertError } = await supabase
      .from('staff_documents')
      .insert({
        staff_id:          user.id,
        doc_type:          validated.doc_type,
        storage_path:      validated.storage_path,
        original_filename: validated.original_filename,
        mime_type:         validated.mime_type,
        size_bytes:        validated.size_bytes,
        status:            'pending',
      })
      .select('id')
      .single();

    if (!insertError) {
      return NextResponse.json({ ok: true, data: { id: insertedRow.id, doc_type: validated.doc_type } });
    }

    // FALLBACK PATH: RPC via SECURITY DEFINER function.
    // Handles the case where the schema cache hasn't reloaded after migration
    // (PostgREST needs NOTIFY pgrst, 'reload schema' or a restart).
    // Log the insert error so we can track when this fallback is hit.
    console.warn('[confirm-upload] direct insert failed, trying RPC fallback', {
      requestId,
      userId: user.id,
      insertCode:    insertError.code,
      insertMessage: insertError.message,
    });

    const { data: newDocId, error: rpcError } = await supabase.rpc('insert_staff_document', {
      p_staff_id:          user.id,
      p_doc_type:          validated.doc_type,
      p_storage_path:      validated.storage_path,
      p_original_filename: validated.original_filename,
      p_mime_type:         validated.mime_type,
      p_size_bytes:        validated.size_bytes,
    });

    if (rpcError) {
      // Both paths failed — log everything to aid debugging.
      console.error('[confirm-upload] both insert paths failed', {
        requestId,
        userId:        user.id,
        insertCode:    insertError.code,
        insertMessage: insertError.message,
        insertHint:    insertError.hint,
        rpcCode:       rpcError.code,
        rpcMessage:    rpcError.message,
        rpcHint:       rpcError.hint,
        rpcDetails:    rpcError.details,
      });

      // Return the most actionable error message to the client.
      const isSchemaCache =
        rpcError.message?.includes('Could not find the function') ||
        rpcError.code === 'PGRST202';

      if (isSchemaCache) {
        return jsonError(
          503,
          'SCHEMA_CACHE_STALE',
          'Database function not yet available — this is a one-time deploy issue. ' +
          'Please run `NOTIFY pgrst, \'reload schema\';` in the Supabase SQL editor, then retry.'
        );
      }

      return jsonError(
        500,
        'DB_ERROR',
        `Failed to save document record: ${rpcError.message}`
      );
    }

    return NextResponse.json({ ok: true, data: { id: newDocId, doc_type: validated.doc_type } });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[confirm-upload] validation error', { requestId, errors: error.errors });
      return jsonError(400, 'VALIDATION_ERROR', 'Invalid input data', error.flatten());
    }
    console.error('[confirm-upload] unexpected error', { requestId, error });
    return jsonError(500, 'INTERNAL_ERROR', 'Unexpected error saving document record');
  }
}
