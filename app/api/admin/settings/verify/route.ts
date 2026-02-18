import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';
import { requireAdmin } from '@/app/lib/admin';
import { settingVerificationSchema } from '@/app/lib/validations/setting';

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const admin = await requireAdmin();

    // Parse and validate request body
    const body = await request.json();
    const validated = settingVerificationSchema.parse(body);

    // Create Supabase client
    const supabase = await createClient();

    // Get the setting
    const { data: setting, error: fetchError } = await supabase
      .from('setting_profiles')
      .select('*')
      .eq('id', validated.setting_id)
      .single();

    if (fetchError || !setting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    if (setting.verification_status !== 'pending') {
      return NextResponse.json(
        { error: 'Setting has already been processed' },
        { status: 400 }
      );
    }

    // Update verification status
    const newStatus = validated.action === 'approve' ? 'approved' : 'rejected';
    
    const { error: updateError } = await supabase
      .from('setting_profiles')
      .update({
        verification_status: newStatus,
        verified_by: admin.id,
        verified_at: new Date().toISOString(),
        verification_notes: validated.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.setting_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update setting' },
        { status: 500 }
      );
    }

    // Create audit log entry
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        actor_user_id: admin.id,
        action: validated.action === 'approve' ? 'setting_approved' : 'setting_rejected',
        entity_type: 'setting_profile',
        entity_id: validated.setting_id,
        metadata: {
          setting_name: setting.setting_name,
          ofsted_urn: setting.ofsted_urn,
          notes: validated.notes,
          admin_email: admin.email,
        },
      });

    if (auditError) {
      console.error('Audit log error:', auditError);
      // Don't fail the request if audit log fails
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
      // Zod validation error
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
