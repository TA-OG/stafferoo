import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { settingRegistrationSchema } from '@/app/lib/validations/setting';
import { createApiRoute, rateLimits } from '@/app/lib/api-wrapper';

function normalisePostcode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

export const POST = createApiRoute(async (request, requestId) => {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: auth.message, requestId } },
        { status: auth.status },
      );
    }
    const { user, supabase } = auth;

    const body = await request.json();
    const validated = settingRegistrationSchema.parse(body);

    const { data: existing } = await supabase
      .from('setting_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ ok: false, error: { code: 'ALREADY_EXISTS', message: 'Setting profile already exists', requestId } }, { status: 400 });
    }

    const { data: existingUrn } = await supabase
      .from('setting_profiles')
      .select('id')
      .eq('ofsted_urn', validated.ofsted_urn)
      .single();

    if (existingUrn) {
      return NextResponse.json({ ok: false, error: { code: 'URN_TAKEN', message: 'This Ofsted URN is already registered', requestId } }, { status: 400 });
    }

    const gatingEnabled = process.env.POSTCODE_GATING !== 'false';
    const postcodeKey = normalisePostcode(validated.postcode);

    let verificationStatus: 'pending' | 'approved' = gatingEnabled ? 'pending' : 'approved';

    if (gatingEnabled) {
      const { data: enabledPostcode, error: postcodeErr } = await supabase
        .from('enabled_postcodes')
        .select('postcode, enabled')
        .eq('postcode', postcodeKey)
        .eq('enabled', true)
        .maybeSingle();

      if (postcodeErr) {
        console.error('[POST /api/settings/register] Postcode check error:', { requestId, error: postcodeErr });
        return NextResponse.json({ ok: false, error: { code: 'POSTCODE_CHECK_FAILED', message: 'Failed to validate postcode availability', requestId } }, { status: 500 });
      }

      if (enabledPostcode?.postcode) {
        verificationStatus = 'approved';
      }
    }

    const { data: setting, error: insertError } = await supabase
      .from('setting_profiles')
      .insert({
        id: user.id,
        ...validated,
        postcode: postcodeKey,
        verification_status: verificationStatus,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/settings/register] Insert error:', { requestId, error: insertError });
      return NextResponse.json({ ok: false, error: { code: 'INSERT_FAILED', message: 'Failed to create setting profile', requestId } }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: { setting } });
  } catch (error: unknown) {
    console.error('[POST /api/settings/register]', { requestId, error });

    if (typeof error === 'object' && error !== null && 'errors' in error) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: (error as { errors: unknown }).errors, requestId } },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Registration failed', requestId } }, { status: 500 });
    }

    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Registration failed', requestId } }, { status: 500 });
  }
}, { rateLimit: rateLimits.apiMutation });
