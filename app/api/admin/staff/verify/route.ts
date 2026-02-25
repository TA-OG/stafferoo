import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/app/lib/admin';
import { createAdminClient } from '@/app/lib/supabase-server';

const verifySchema = z.object({
  staff_id: z.string().uuid('Invalid staff ID'),
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
});

function jsonError(status: number, code: string, message: string, requestId: string) {
  return NextResponse.json(
    { ok: false, error: { code, message, requestId } },
    { status }
  );
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const adminUser = await requireAdmin();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, 'BAD_REQUEST', 'Invalid JSON', requestId);
    }

    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'VALIDATION_ERROR', 'Invalid request body', requestId);
    }

    const { staff_id, action, notes } = parsed.data;
    const supabase = createAdminClient();

    const { data: staff, error: fetchError } = await supabase
      .from('staff_profiles')
      .select('full_name, email, verification_status')
      .eq('id', staff_id)
      .single();

    if (fetchError || !staff) {
      return jsonError(404, 'NOT_FOUND', 'Staff not found', requestId);
    }

    if (staff.verification_status !== 'pending') {
      return jsonError(400, 'INVALID_STATE', `Cannot ${action}: current status is ${staff.verification_status}`, requestId);
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { error: updateError } = await supabase
      .from('staff_profiles')
      .update({
        verification_status: newStatus,
        verified_by: adminUser.id,
        verified_at: new Date().toISOString(),
        verification_notes: notes ?? null,
      })
      .eq('id', staff_id);

    if (updateError) {
      console.error('[POST /api/admin/staff/verify]', {
        event: 'admin.staff.verify.update_failed',
        requestId,
        staffId: staff_id,
        action,
        error: updateError,
      });
      return jsonError(500, 'UPDATE_FAILED', 'Failed to update staff', requestId);
    }

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        actor_user_id: adminUser.id,
        action: action === 'approve' ? 'staff_approved' : 'staff_rejected',
        entity_type: 'staff_profile',
        entity_id: staff_id,
        metadata: {
          staff_name: staff.full_name,
          staff_email: staff.email,
          notes,
          admin_email: adminUser.email,
        },
      });

    if (auditError) {
      console.error('[POST /api/admin/staff/verify]', {
        event: 'admin.staff.verify.audit_failed',
        requestId,
        staffId: staff_id,
        error: auditError,
      });
    }

    console.log('[POST /api/admin/staff/verify]', {
      event: `admin.staff.${action}d`,
      requestId,
      staffId: staff_id,
      adminId: adminUser.id,
      newStatus,
    });

    return NextResponse.json({ ok: true, data: { staffId: staff_id, status: newStatus } });

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return jsonError(403, 'FORBIDDEN', 'Admin access required', requestId);
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return jsonError(401, 'UNAUTHORIZED', 'You must be signed in', requestId);
    }
    console.error('[POST /api/admin/staff/verify]', { requestId, error });
    return jsonError(500, 'INTERNAL_ERROR', 'An unexpected error occurred', requestId);
  }
}
