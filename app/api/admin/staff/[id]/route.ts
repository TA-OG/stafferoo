import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase-server';
import { requireAdmin } from '@/app/lib/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  
  try {
    await requireAdmin();

    const { id } = await params;

    const supabase = createAdminClient();

    const { data: staff, error: fetchError } = await supabase
      .from('staff_profiles')
      .select('*, staff_documents(*), staff_verifications(*)')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('[GET /api/admin/staff/[id]]', { requestId, staffId: id, error: fetchError });
      
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Staff not found',
              requestId,
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch staff details',
            requestId,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: staff,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
            requestId,
          },
        },
        { status: 403 }
      );
    }

    console.error('[GET /api/admin/staff/[id]]', { requestId, error });
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
