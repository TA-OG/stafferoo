import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/app/lib/admin';
import { createAdminClient } from '@/app/lib/supabase-server';

const approveSchema = z.object({
  staffId: z.string().uuid('Invalid staff ID'),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const adminUser = await requireAdmin();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON', requestId } },
        { status: 400 }
      );
    }

    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request', requestId } },
        { status: 400 }
      );
    }

    const { staffId, notes } = parsed.data;
    const supabase = createAdminClient();

    const { data: staff, error: staffError } = await supabase
      .from('staff_profiles')
      .select('full_name, email, verification_status')
      .eq('id', staffId)
      .single();

    if (staffError || !staff) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Staff member not found', requestId } },
        { status: 404 }
      );
    }

    if (staff.verification_status !== 'pending') {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'INVALID_STATE',
            message: `Cannot approve: current status is ${staff.verification_status}`,
            requestId,
          },
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('staff_profiles')
      .update({
        verification_status: 'approved',
        verified_by: adminUser.id,
        verified_at: new Date().toISOString(),
        verification_notes: notes ?? null,
      })
      .eq('id', staffId);

    if (updateError) {
      console.error('[POST /api/admin/staff/approve] update failed', { requestId, error: updateError });
      return NextResponse.json(
        { ok: false, error: { code: 'UPDATE_FAILED', message: 'Failed to approve staff', requestId } },
        { status: 500 }
      );
    }

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        actor_user_id: adminUser.id,
        action: 'approve',
        entity_type: 'staff_profile',
        entity_id: staffId,
        metadata: { notes, staff_name: staff.full_name, staff_email: staff.email },
      });

    if (auditError) {
      console.error('[POST /api/admin/staff/approve] audit log failed', { requestId, error: auditError });
    }

    return NextResponse.json({ ok: true, data: { staffId } });

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Admin access required', requestId } },
        { status: 403 }
      );
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in', requestId } },
        { status: 401 }
      );
    }

    console.error('[POST /api/admin/staff/approve]', { requestId, error });
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId } },
      { status: 500 }
    );
  }
}
