import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/lib/supabase-server';
import { settingProfileUpdateSchema } from '@/app/lib/validations/setting';
import { z } from 'zod';

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const validated = settingProfileUpdateSchema.parse(body);

    const { data: updated, error: updateError } = await supabase
      .from('setting_profiles')
      .update({
        phone: validated.phone,
        operation_hours_start: validated.operation_hours_start ?? null,
        operation_hours_end: validated.operation_hours_end ?? null,
        number_of_children: validated.number_of_children ?? null,
        team_size: validated.team_size ?? null,
        has_parking: validated.has_parking,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('phone, operation_hours_start, operation_hours_end, number_of_children, team_size, has_parking')
      .single();

    if (updateError) {
      console.error('[PUT /api/settings/profile] update error', { requestId, error: updateError });
      return NextResponse.json(
        { ok: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update profile', requestId } },
        { status: 500 }
      );
    }

    console.info('[PUT /api/settings/profile] profile updated', { requestId, userId: user.id });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: { fieldErrors: error.flatten().fieldErrors }, requestId } },
        { status: 400 }
      );
    }
    console.error('[PUT /api/settings/profile]', { requestId, error });
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId } },
      { status: 500 }
    );
  }
}
