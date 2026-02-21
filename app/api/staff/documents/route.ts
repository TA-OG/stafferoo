import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';
import { z } from 'zod';

const staffDocumentCreateSchema = z.object({
  doc_type: z.enum([
    'dbs_certificate',
    'safeguarding_certificate',
    'paediatric_first_aid',
    'right_to_work',
    'qualification_certificate',
  ]),
  storage_path: z.string().min(1).max(500),
  original_filename: z.string().min(1).max(255),
});

export type StaffDocumentCreateInput = z.infer<typeof staffDocumentCreateSchema>;

export async function GET() {
  const requestId = crypto.randomUUID();
  
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
            message: 'You must be signed in',
            requestId,
          },
        },
        { status: 401 }
      );
    }

    const { data: documents, error: docsError } = await supabase
      .from('staff_documents')
      .select('*')
      .eq('staff_id', user.id)
      .order('created_at', { ascending: false });

    if (docsError) {
      console.error('[GET /api/staff/documents]', { requestId, error: docsError });
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch documents',
            requestId,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: documents || [],
    });
  } catch (error: unknown) {
    console.error('[GET /api/staff/documents]', { requestId, error });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          requestId,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
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
            message: 'You must be signed in',
            requestId,
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = staffDocumentCreateSchema.parse(body);

    const { data: newDocument, error: insertError } = await supabase
      .from('staff_documents')
      .insert({
        staff_id: user.id,
        doc_type: validated.doc_type,
        storage_path: validated.storage_path,
        original_filename: validated.original_filename,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/staff/documents]', { requestId, error: insertError });
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'INSERT_FAILED',
            message: 'Failed to create document record',
            requestId,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: newDocument,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
            requestId,
          },
        },
        { status: 400 }
      );
    }

    console.error('[POST /api/staff/documents]', { requestId, error });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          requestId,
        },
      },
      { status: 500 }
    );
  }
}
