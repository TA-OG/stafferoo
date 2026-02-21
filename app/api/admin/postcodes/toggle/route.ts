import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase-server';
import { requireAdmin } from '@/app/lib/admin';
import { postcodeToggleSchema } from '@/app/lib/validations/postcode';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const validated = postcodeToggleSchema.parse(body);

    const supabase = createAdminClient();

    // Upsert: creates a new row if the postcode is unknown, or updates the
    // existing row if it was already in enabled_postcodes.
    const { error: upsertError } = await supabase
      .from('enabled_postcodes')
      .upsert(
        {
          postcode:   validated.postcode,
          enabled:    validated.enabled,
          enabled_by: admin.id,
          enabled_at: new Date().toISOString(),
          notes:      validated.notes ?? null,
        },
        { onConflict: 'postcode' }
      );

    if (upsertError) {
      console.error('[POST /api/admin/postcodes/toggle] upsert failed', {
        requestId,
        error: upsertError.message,
      });
      return NextResponse.json(
        { ok: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update postcode', requestId } },
        { status: 500 }
      );
    }

    // Audit log — enabled_postcodes uses a text PK, so we use a surrogate UUID
    // for entity_id and store the actual postcode in metadata.
    const { error: auditError } = await supabase.from('audit_logs').insert({
      actor_user_id: admin.id,
      action:        validated.enabled ? 'postcode_enabled' : 'postcode_disabled',
      entity_type:   'enabled_postcodes',
      entity_id:     crypto.randomUUID(),
      metadata: {
        postcode:    validated.postcode,
        enabled:     validated.enabled,
        notes:       validated.notes ?? null,
        admin_email: admin.email,
        request_id:  requestId,
      },
    });

    if (auditError) {
      // Non-fatal: log the failure but do not fail the request.
      console.error('[POST /api/admin/postcodes/toggle] audit log failed', {
        requestId,
        error: auditError.message,
      });
    }

    console.log('[POST /api/admin/postcodes/toggle]', {
      event:    'admin.postcode.toggled',
      postcode: validated.postcode,
      enabled:  validated.enabled,
      adminId:  admin.id,
      requestId,
    });

    return NextResponse.json({ ok: true, postcode: validated.postcode, enabled: validated.enabled });

  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', requestId, issues: err.flatten() } },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('Forbidden') || message === 'Unauthorized') {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Admin access required', requestId } },
        { status: 403 }
      );
    }
    console.error('[POST /api/admin/postcodes/toggle]', { requestId, error: message });
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId } },
      { status: 500 }
    );
  }
}
