import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/lib/supabase-server';

export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in', requestId } },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('setting_profiles')
      .select(
        'setting_name, ofsted_urn, ofsted_rating, email, phone, address_line_1, address_line_2, city, postcode, has_parking, number_of_children, team_size, operation_hours_start, operation_hours_end, verification_status, verified_at, verification_notes, created_at'
      )
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[GET /api/settings/dashboard] profile error', { requestId, error: profileError });
      return NextResponse.json(
        { ok: false, error: { code: 'FETCH_FAILED', message: 'Failed to load profile', requestId } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        profile,
      },
    });
  } catch (error: unknown) {
    console.error('[GET /api/settings/dashboard]', { requestId, error });
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId } },
      { status: 500 }
    );
  }
}
