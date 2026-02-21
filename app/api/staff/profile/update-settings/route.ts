import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { staffSettingsSchema } from '@/app/lib/validations/staff';

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

  const parsed = staffSettingsSchema.safeParse(body);
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
  const { travel_radius_miles, transport_mode, years_experience, qualification_level, qualification_name } =
    parsed.data;

  const { error } = await supabase
    .from('staff_profiles')
    .update({
      travel_radius_miles,
      transport_mode,
      years_experience,
      qualification_level,
      qualification_name: qualification_name ?? null,
    })
    .eq('id', user.id);

  if (error) {
    console.error('[POST /api/staff/profile/update-settings]', { requestId, error });
    return NextResponse.json(
      { ok: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update settings', requestId } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
