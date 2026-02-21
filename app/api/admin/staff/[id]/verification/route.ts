import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase-server';
import { requireAdmin } from '@/app/lib/admin';
import { z } from 'zod';

const staffVerificationUpdateSchema = z.object({
  action: z.enum(['verify', 'reject', 'request_changes']),
  reason: z.string().optional(),
});

export type StaffVerificationStatusUpdateInput = z.infer<typeof staffVerificationUpdateSchema>;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  
  try {
    const admin = await requireAdmin();
    const { id: staffId } = await params;

    const body = await request.json();
    const validated = staffVerificationUpdateSchema.parse(body);

    if (validated.action === 'reject' && !validated.reason) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Rejection reason is required',
            requestId,
          },
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: staff, error: fetchError } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('id', staffId)
      .single();

    if (fetchError || !staff) {
      console.error('[POST /api/admin/staff/[id]/verification]', { requestId, staffId, error: fetchError });
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

    let newVerificationStatus: string;
    let newProfileStatus: string;

    switch (validated.action) {
      case 'verify':
        newVerificationStatus = 'verified';
        newProfileStatus = 'approved';
        break;
      case 'reject':
        newVerificationStatus = 'rejected';
        newProfileStatus = 'rejected';
        break;
      case 'request_changes':
        newVerificationStatus = 'pending_review';
        newProfileStatus = 'draft';
        break;
    }

    const { error: profileUpdateError } = await supabase
      .from('staff_profiles')
      .update({
        verification_status: newProfileStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', staffId);

    if (profileUpdateError) {
      console.error('[POST /api/admin/staff/[id]/verification]', { requestId, staffId, error: profileUpdateError });
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update staff profile',
            requestId,
          },
        },
        { status: 500 }
      );
    }

    const { error: verificationError } = await supabase
      .from('staff_verifications')
      .upsert({
        staff_id: staffId,
        status: newVerificationStatus,
        last_reviewed_at: new Date().toISOString(),
        last_reviewed_by: admin.id,
        rejection_reason: validated.action === 'reject' ? validated.reason : null,
        updated_at: new Date().toISOString(),
      });

    if (verificationError) {
      console.error('[POST /api/admin/staff/[id]/verification]', { requestId, staffId, error: verificationError });
    }

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        actor_user_id: admin.id,
        action: `staff_${validated.action}`,
        entity_type: 'staff_profile',
        entity_id: staffId,
        metadata: {
          staff_name: staff.full_name,
          staff_email: staff.email,
          reason: validated.reason,
          admin_email: admin.email,
        },
      });

    if (auditError) {
      console.error('[POST /api/admin/staff/[id]/verification] Audit log failed', { requestId, error: auditError });
    }

    return NextResponse.json({
      ok: true,
      data: {
        status: newVerificationStatus,
        profile_status: newProfileStatus,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
            requestId,
          },
        },
        { status: 400 }
      );
    }

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

    console.error('[POST /api/admin/staff/[id]/verification]', { requestId, error });
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
