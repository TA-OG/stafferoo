import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';
import { requireAdmin } from '@/app/lib/admin';
import { staffVerificationSchema } from '@/app/lib/validations/staff';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const validated = staffVerificationSchema.parse(body);

    const supabase = await createClient();

    const { data: staff, error: fetchError } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('id', validated.staff_id)
      .single();

    if (fetchError || !staff) {
      return NextResponse.json(
        { error: 'Staff not found' },
        { status: 404 }
      );
    }

    if (staff.verification_status !== 'pending') {
      return NextResponse.json(
        { error: 'Staff has already been processed' },
        { status: 400 }
      );
    }

    const newStatus = validated.action === 'approve' ? 'approved' : 'rejected';
    
    const { error: updateError } = await supabase
      .from('staff_profiles')
      .update({
        verification_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.staff_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update staff' },
        { status: 500 }
      );
    }

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        actor_user_id: admin.id,
        action: validated.action === 'approve' ? 'staff_approved' : 'staff_rejected',
        entity_type: 'staff_profile',
        entity_id: validated.staff_id,
        metadata: {
          staff_name: staff.full_name,
          staff_email: staff.email,
          notes: validated.notes,
          admin_email: admin.email,
        },
      });

    if (auditError) {
      console.error('Audit log error:', auditError);
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
    });
  } catch (error: unknown) {
    console.error('Verification error:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Verification failed' },
        { status: 500 }
      );
    }

    if (typeof error === 'object' && error !== null && 'errors' in error) {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
