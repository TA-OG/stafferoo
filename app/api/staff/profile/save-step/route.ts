import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';
import {
  staffProfileBasicsSchema,
  staffComplianceSchema,
  staffHealthSafetySchema,
  staffSignatureSchema,
} from '@/app/lib/validations/staff';
import { z } from 'zod';

const saveStepSchema = z.object({
  step: z.number().int().min(2).max(5),
  data: z.record(z.any()),
});

export async function POST(request: NextRequest) {
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
            message: 'You must be signed in to save profile data',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { step, data } = saveStepSchema.parse(body);

    let validatedData: Record<string, unknown>;

    switch (step) {
      case 2:
        validatedData = staffProfileBasicsSchema.parse(data);
        break;
      case 3:
        validatedData = staffComplianceSchema.parse(data);
        break;
      case 4:
        validatedData = staffHealthSafetySchema.parse(data);
        break;
      case 5:
        validatedData = staffSignatureSchema.parse(data);
        validatedData.digital_signature_signed_at = new Date().toISOString();
        break;
      default:
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'INVALID_STEP',
              message: 'Invalid step number',
            },
          },
          { status: 400 }
        );
    }

    const { data: existingProfile } = await supabase
      .from('staff_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      const { error: updateError } = await supabase
        .from('staff_profiles')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'UPDATE_FAILED',
              message: 'Failed to update profile',
              details: updateError.message,
            },
          },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabase
        .from('staff_profiles')
        .insert({
          id: user.id,
          email: user.email!,
          ...validatedData,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'INSERT_FAILED',
              message: 'Failed to create profile',
              details: insertError.message,
            },
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      data: { step, saved: true },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
