import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { settingRegistrationSchema } from '@/app/lib/validations/setting';

function normalisePostcode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.message },
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
      return NextResponse.json({ error: 'Setting profile already exists' }, { status: 400 });
    }

    const { data: existingUrn } = await supabase
      .from('setting_profiles')
      .select('id')
      .eq('ofsted_urn', validated.ofsted_urn)
      .single();

    if (existingUrn) {
      return NextResponse.json({ error: 'This Ofsted URN is already registered' }, { status: 400 });
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
        console.error('Postcode check error:', postcodeErr);
        return NextResponse.json({ error: 'Failed to validate postcode availability' }, { status: 500 });
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
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create setting profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, setting });
  } catch (error: unknown) {
    console.error('Registration error:', error);

    if (typeof error === 'object' && error !== null && 'errors' in error) {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as { errors: unknown }).errors },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
    }

    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
