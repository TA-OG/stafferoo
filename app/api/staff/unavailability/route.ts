import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { staffUnavailabilitySchema } from '@/app/lib/validations/staff';

export async function POST(req: NextRequest) {
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

  const parsed = staffUnavailabilitySchema.safeParse(body);
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

  const { data, error } = await supabase
    .from('staff_unavailability')
    .insert({
      staff_id: user.id,
      starts_on: parsed.data.starts_on,
      ends_on: parsed.data.ends_on,
      note: parsed.data.note ?? null,
    })
    .select('id, starts_on, ends_on, note')
    .single();

  if (error) {
    console.error('[POST /api/staff/unavailability]', { requestId, error });
    return NextResponse.json(
      { ok: false, error: { code: 'INSERT_FAILED', message: 'Failed to add unavailability block', requestId } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data }, { status: 201 });
}
