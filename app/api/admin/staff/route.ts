import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase-server';
import { requireAdmin } from '@/app/lib/admin';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'pending';

    const supabase = createAdminClient();

    const query = supabase
      .from('staff_profiles')
      .select('*, staff_documents(id, doc_type, status), staff_verifications(status, last_reviewed_at)')
      .order('submitted_at', { ascending: false });

    if (statusFilter === 'pending') {
      query.eq('verification_status', 'pending');
    } else if (statusFilter === 'approved') {
      query.eq('verification_status', 'approved');
    } else if (statusFilter === 'rejected') {
      query.eq('verification_status', 'rejected');
    }

    const { data: staff, error: fetchError } = await query;

    if (fetchError) {
      console.error('[GET /api/admin/staff]', { requestId, error: fetchError });
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch staff',
            requestId,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: staff || [],
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

    console.error('[GET /api/admin/staff]', { requestId, error });
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
