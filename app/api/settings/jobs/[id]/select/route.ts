/**
 * POST /api/settings/jobs/:id/select
 * Select primary or secondary staff for a job
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthFromRequest } from '@/app/lib/auth';
import { createApiRoute, rateLimits } from '@/app/lib/api-wrapper';

const selectStaffSchema = z.object({
  staffId: z.string().uuid(),
  role: z.enum(['primary', 'secondary']),
});

export const POST = createApiRoute(async (request, requestId) => {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: auth.message, requestId } },
        { status: auth.status }
      );
    }
    const { user, supabase } = auth;

    // Get job ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const jobId = pathParts[pathParts.indexOf('jobs') + 1];

    if (!jobId) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_ID', message: 'Job ID is required', requestId } },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const parseResult = selectStaffSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid request data',
            details: parseResult.error.flatten(),
            requestId 
          } 
        },
        { status: 400 }
      );
    }

    const { staffId, role } = parseResult.data;

    // Verify the job belongs to this setting and is open
    const { data: job, error: jobError } = await supabase
      .from('job_requests')
      .select('id, setting_id, status, title')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { ok: false, error: { code: 'JOB_NOT_FOUND', message: 'Job not found', requestId } },
        { status: 404 }
      );
    }

    if (job.setting_id !== user.id) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to manage this job', requestId } },
        { status: 403 }
      );
    }

    if (job.status !== 'open') {
      return NextResponse.json(
        { ok: false, error: { code: 'JOB_NOT_OPEN', message: 'This job is no longer accepting applications', requestId } },
        { status: 400 }
      );
    }

    // Verify the staff has a pending response to this job
    const { data: response, error: responseError } = await supabase
      .from('booking_responses')
      .select('id, status')
      .eq('job_request_id', jobId)
      .eq('staff_id', staffId)
      .single();

    if (responseError || !response) {
      return NextResponse.json(
        { ok: false, error: { code: 'RESPONSE_NOT_FOUND', message: 'Staff has not applied to this job', requestId } },
        { status: 404 }
      );
    }

    // Check if booking already exists
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id, primary_staff_id, secondary_staff_id')
      .eq('job_request_id', jobId)
      .maybeSingle();

    let booking;

    if (existingBooking) {
      // Update existing booking
      const updateData: {primary_staff_id?: string; secondary_staff_id?: string | null} = {};
      if (role === 'primary') {
        updateData.primary_staff_id = staffId;
        // If selecting new primary, clear secondary if it was the same person
        if (existingBooking.secondary_staff_id === staffId) {
          updateData.secondary_staff_id = null;
        }
      } else {
        // Can't select same person as both primary and secondary
        if (existingBooking.primary_staff_id === staffId) {
          return NextResponse.json(
            { ok: false, error: { code: 'INVALID_SELECTION', message: 'Cannot select same staff as both primary and secondary', requestId } },
            { status: 400 }
          );
        }
        updateData.secondary_staff_id = staffId;
      }

      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', existingBooking.id)
        .select()
        .single();

      if (updateError) {
        console.error('[POST /api/settings/jobs/:id/select] Update failed', { requestId, error: updateError });
        return NextResponse.json(
          { ok: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update booking', requestId } },
          { status: 500 }
        );
      }

      booking = updatedBooking;
    } else {
      // Create new booking
      const { data: newBooking, error: insertError } = await supabase
        .from('bookings')
        .insert({
          job_request_id: jobId,
          setting_id: user.id,
          primary_staff_id: role === 'primary' ? staffId : null,
          secondary_staff_id: role === 'secondary' ? staffId : null,
          status: 'confirmed',
        })
        .select()
        .single();

      if (insertError) {
        console.error('[POST /api/settings/jobs/:id/select] Insert failed', { requestId, error: insertError });
        return NextResponse.json(
          { ok: false, error: { code: 'INSERT_FAILED', message: 'Failed to create booking', requestId } },
          { status: 500 }
        );
      }

      booking = newBooking;

      // Update job status to filled if primary is set
      if (role === 'primary') {
        await supabase
          .from('job_requests')
          .update({ status: 'filled' })
          .eq('id', jobId);
      }
    }

    // Update the response status to accepted
    await supabase
      .from('booking_responses')
      .update({ status: 'accepted' })
      .eq('id', response.id);

    // Decline other responses if primary is now set
    if (role === 'primary') {
      await supabase
        .from('booking_responses')
        .update({ status: 'declined' })
        .eq('job_request_id', jobId)
        .neq('id', response.id)
        .neq('status', 'withdrawn');
    }

    // Log the selection
    console.log('[POST /api/settings/jobs/:id/select] Staff selected', {
      event: 'booking.staff_selected',
      requestId,
      jobId,
      staffId,
      role,
      settingId: user.id,
    });

    return NextResponse.json({
      ok: true,
      data: {
        booking,
        message: `${role === 'primary' ? 'Primary' : 'Secondary'} staff selected successfully`,
      },
    });

  } catch (error) {
    console.error('[POST /api/settings/jobs/:id/select] Unexpected error', { requestId, error });
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
}, { rateLimit: rateLimits.apiMutation });
