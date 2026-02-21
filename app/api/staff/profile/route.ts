import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';
import { staffProfileBasicsSchema } from '@/app/lib/validations/staff';
import { z } from 'zod';

export async function GET() {
  const requestId = crypto.randomUUID();
  
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be signed in',
            requestId,
          },
        },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[GET /api/staff/profile]', { requestId, error: profileError });
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch profile',
            requestId,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: profile || null,
    });
  } catch (error: unknown) {
    console.error('[GET /api/staff/profile]', { requestId, error });
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

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be signed in',
            requestId,
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = staffProfileBasicsSchema.parse(body);

    const { data: existingProfile } = await supabase
      .from('staff_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('staff_profiles')
        .update({
          ...validated,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('[POST /api/staff/profile]', { requestId, error: updateError });
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'UPDATE_FAILED',
              message: 'Failed to update profile',
              requestId,
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        data: updatedProfile,
      });
    } else {
      const { data: newProfile, error: insertError } = await supabase
        .from('staff_profiles')
        .insert({
          id: user.id,
          email: user.email!,
          ...validated,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[POST /api/staff/profile]', { requestId, error: insertError });
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'INSERT_FAILED',
              message: 'Failed to create profile',
              requestId,
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        data: newProfile,
      });
    }
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

    console.error('[POST /api/staff/profile]', { requestId, error });
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
