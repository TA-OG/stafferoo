import { createClient } from '@/app/lib/supabase-server';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const rejectSchema = z.object({
  staffId: z.string().uuid('Invalid staff ID'),
  notes: z.string().min(10, 'Rejection reason must be at least 10 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { staffId, notes } = rejectSchema.parse(body);

    // Get authenticated user and verify admin role
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const isAdmin = user.user_metadata?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can reject staff' },
        { status: 403 }
      );
    }

    // Get current staff profile to verify it exists and is pending
    const { data: staff, error: staffError } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('id', staffId)
      .single();

    if (staffError || !staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    if (staff.verification_status !== 'pending') {
      return NextResponse.json(
        { error: `Staff verification status is ${staff.verification_status}, cannot reject` },
        { status: 400 }
      );
    }

    // Update staff profile with rejection
    const { error: updateError } = await supabase
      .from('staff_profiles')
      .update({
        verification_status: 'rejected',
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        verification_notes: notes,
      })
      .eq('id', staffId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to reject staff', details: updateError.message },
        { status: 500 }
      );
    }

    // Log audit event
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        actor_user_id: user.id,
        action: 'reject',
        entity_type: 'staff_profile',
        entity_id: staffId,
        metadata: {
          notes,
          staff_name: staff.full_name,
          staff_email: staff.email,
        },
      });

    if (auditError) {
      console.error('Audit log failed:', auditError);
      // Don't fail the request if audit logging fails, but log it
    }

    // TODO: Send email notification to staff member notifying them of rejection with reason

    return NextResponse.json({
      success: true,
      message: 'Staff member rejected successfully',
      staffId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Unexpected error in reject staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
