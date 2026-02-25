/**
 * GET /api/staff/applications
 * List all job applications for the authenticated staff member
 */

import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { createApiRoute, rateLimits } from '@/app/lib/api-wrapper';
import { jobRoleLabels } from '@/app/lib/validations/jobs';

export const GET = createApiRoute(async (request, requestId) => {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: auth.message, requestId } },
        { status: auth.status }
      );
    }
    const { user, supabase } = auth;

    // Fetch all responses with job and setting details
    const { data: responses, error } = await supabase
      .from('booking_responses')
      .select(`
        id,
        status,
        message,
        responded_at,
        created_at,
        job_requests:job_request_id (
          id,
          title,
          description,
          job_date,
          start_time,
          end_time,
          role_required,
          hourly_rate,
          estimated_total,
          postcode,
          status,
          setting_profiles:setting_id (
            setting_name,
            ofsted_rating,
            address_line_1,
            city,
            postcode,
            phone
          )
        ),
        bookings!inner(job_request_id, primary_staff_id, secondary_staff_id, status)
      `)
      .eq('staff_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/staff/applications] Fetch failed', { requestId, error });
      return NextResponse.json(
        { ok: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch applications', requestId } },
        { status: 500 }
      );
    }

    // Transform to include derived status
    const applications = responses?.map((response) => {
      const job = Array.isArray(response.job_requests) 
        ? response.job_requests[0] 
        : response.job_requests;
      const setting = Array.isArray(job?.setting_profiles) 
        ? job?.setting_profiles[0] 
        : job?.setting_profiles;
      const booking = Array.isArray(response.bookings)
        ? response.bookings[0]
        : response.bookings;

      const isPrimary = booking?.primary_staff_id === user.id;
      const isSecondary = booking?.secondary_staff_id === user.id;

      let applicationStatus = response.status;
      if (isPrimary) applicationStatus = 'selected_primary';
      else if (isSecondary) applicationStatus = 'selected_secondary';

      return {
        id: response.id,
        status: applicationStatus,
        message: response.message,
        appliedAt: response.created_at,
        respondedAt: response.responded_at,
        job: {
          id: job?.id,
          title: job?.title,
          description: job?.description,
          jobDate: job?.job_date,
          startTime: job?.start_time,
          endTime: job?.end_time,
          roleLabel: jobRoleLabels[job?.role_required as keyof typeof jobRoleLabels] || job?.role_required,
          hourlyRate: job?.hourly_rate,
          estimatedTotal: job?.estimated_total,
          postcode: job?.postcode,
          jobStatus: job?.status,
        },
        setting: {
          name: setting?.setting_name || 'Unknown Setting',
          ofstedRating: setting?.ofsted_rating,
          address: setting ? `${setting.address_line_1 || ''}, ${setting.city || ''}`.replace(/^,\s*|,\s*$/g, '') : '',
          postcode: setting?.postcode,
          phone: setting?.phone,
        },
        booking: booking ? {
          status: booking.status,
          isPrimary,
          isSecondary,
        } : null,
      };
    }) || [];

    return NextResponse.json({
      ok: true,
      data: { applications },
    });

  } catch (error) {
    console.error('[GET /api/staff/applications] Unexpected error', { requestId, error });
    return NextResponse.json(
      { 
        ok: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An unexpected error occurred',
          requestId 
        } 
      },
      { status: 500 }
    );
  }
}, { rateLimit: rateLimits.apiRead });
