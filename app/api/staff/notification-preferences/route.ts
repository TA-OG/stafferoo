import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { staffNotificationPrefsSchema } from '@/app/lib/validations/staff';

export async function PUT(req: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await getAuthFromRequest(req);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in', requestId } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON', requestId } },
      { status: 400 }
    );
  }

  const parsed = staffNotificationPrefsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.flatten(),
          requestId,
        },
      },
      { status: 400 }
    );
  }

  const { supabase, user } = auth;

  const { error } = await supabase
    .from('staff_notification_preferences')
    .upsert(
      { staff_id: user.id, ...parsed.data },
      { onConflict: 'staff_id' }
    );

  if (error) {
    console.error('[PUT /api/staff/notification-preferences]', { requestId, error });
    return NextResponse.json(
      { ok: false, error: { code: 'UPDATE_FAILED', message: 'Failed to save preferences', requestId } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
