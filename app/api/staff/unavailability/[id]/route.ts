import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();

  const auth = await getAuthFromRequest(req);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in', requestId } },
      { status: 401 }
    );
  }

  const { id } = await params;

  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid id', requestId } },
      { status: 400 }
    );
  }

  const { supabase, user } = auth;

  // RLS enforces ownership, but we also explicitly scope to staff_id to be safe
  const { error, count } = await supabase
    .from('staff_unavailability')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('staff_id', user.id);

  if (error) {
    console.error('[DELETE /api/staff/unavailability/[id]]', { requestId, error });
    return NextResponse.json(
      { ok: false, error: { code: 'DELETE_FAILED', message: 'Failed to delete unavailability block', requestId } },
      { status: 500 }
    );
  }

  if (count === 0) {
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_FOUND', message: 'Block not found', requestId } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
