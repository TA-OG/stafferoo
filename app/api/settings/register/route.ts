import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';
import { requireAuth } from '@/app/lib/admin';
import { settingRegistrationSchema } from '@/app/lib/validations/setting';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const validated = settingRegistrationSchema.parse(body);

    // Create Supabase client
    const supabase = await createClient();

    // Check if setting profile already exists
    const { data: existing } = await supabase
      .from('setting_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Setting profile already exists' },
        { status: 400 }
      );
    }

    // Check if Ofsted URN is already registered
    const { data: existingUrn } = await supabase
      .from('setting_profiles')
      .select('id')
      .eq('ofsted_urn', validated.ofsted_urn)
      .single();

    if (existingUrn) {
      return NextResponse.json(
        { error: 'This Ofsted URN is already registered' },
        { status: 400 }
      );
    }

    // Insert setting profile
    const { data: setting, error: insertError } = await supabase
      .from('setting_profiles')
      .insert({
        id: user.id,
        ...validated,
        verification_status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create setting profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      setting,
    });
  } catch (error: unknown) {
    console.error('Registration error:', error);

    if (typeof error === 'object' && error !== null && 'errors' in error) {
      // Zod validation error
      return NextResponse.json(
        { error: 'Validation failed', details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Registration failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
