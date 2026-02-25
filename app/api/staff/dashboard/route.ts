import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const auth = getAuthFromRequest(req);
    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in', requestId } },
        { status: 401 }
      );
    }

    const { user, supabase } = auth;

    const [profileResult, verificationResult, prefsResult, unavailabilityResult] =
      await Promise.all([
        supabase
          .from('staff_profiles')
          .select(
            'full_name, dbs_issue_date, travel_radius_miles, transport_mode, years_experience, qualification_level, qualification_name, verification_status, submitted_at'
          )
          .eq('id', user.id)
          .maybeSingle(),

        supabase
          .from('staff_verifications')
          .select('status, rejection_reason, last_reviewed_at')
          .eq('staff_id', user.id)
          .maybeSingle(),

        supabase
          .from('staff_notification_preferences')
          .select('email_on, sms_on, browser_on')
          .eq('staff_id', user.id)
          .maybeSingle(),

        supabase
          .from('staff_unavailability')
          .select('id, starts_on, ends_on, note')
          .eq('staff_id', user.id)
          .order('starts_on', { ascending: true }),
      ]);

    if (profileResult.error) {
      console.error('[GET /api/staff/dashboard] profile error', { requestId, error: profileResult.error });
      return NextResponse.json(
        { ok: false, error: { code: 'FETCH_FAILED', message: 'Failed to load profile', requestId } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        profile: profileResult.data,
        verification: verificationResult.data ?? { status: 'incomplete' },
        notificationPrefs: prefsResult.data ?? { email_on: true, sms_on: false, browser_on: false },
        unavailability: unavailabilityResult.data ?? [],
        // Jobs count placeholder — real data wired when bookings slice ships
        jobsCount: 0,
      },
    });
  } catch (error: unknown) {
    console.error('[GET /api/staff/dashboard]', { requestId, error });
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId } },
      { status: 500 }
    );
  }
}
