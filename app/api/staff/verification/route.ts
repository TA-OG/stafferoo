import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';

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

    const { data: verification, error: verificationError } = await supabase
      .from('staff_verifications')
      .select('*')
      .eq('staff_id', user.id)
      .single();

    if (verificationError && verificationError.code !== 'PGRST116') {
      console.error('[GET /api/staff/verification]', { requestId, error: verificationError });
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch verification status',
            requestId,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: verification || { status: 'incomplete' },
    });
  } catch (error: unknown) {
    console.error('[GET /api/staff/verification]', { requestId, error });
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
