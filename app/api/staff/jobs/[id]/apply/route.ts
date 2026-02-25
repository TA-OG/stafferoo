/**
 * POST /api/staff/jobs/:id/apply
 * Apply for a job
 */

import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { createApiRoute, rateLimits } from '@/app/lib/api-wrapper';

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
    const jobId = pathParts[pathParts.length - 2]; // /api/staff/jobs/[id]/apply

    if (!jobId) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_ID', message: 'Job ID is required', requestId } },
        { status: 400 }
      );
    }

    // Get staff profile
    const { data: staffProfile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('verification_status, full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !staffProfile) {
      return NextResponse.json(
        { ok: false, error: { code: 'PROFILE_NOT_FOUND', message: 'Staff profile not found', requestId } },
        { status: 404 }
      );
    }

    if (staffProfile.verification_status !== 'approved') {
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: 'NOT_VERIFIED', 
            message: 'You must be verified to apply for jobs',
            requestId 
          } 
        },
        { status: 403 }
      );
    }

    // Check job exists and is open
    const { data: job, error: jobError } = await supabase
      .from('job_requests')
      .select('id, status, setting_id, title')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { ok: false, error: { code: 'JOB_NOT_FOUND', message: 'Job not found', requestId } },
        { status: 404 }
      );
    }

    if (job.status !== 'open') {
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: 'JOB_NOT_OPEN', 
            message: 'This job is no longer accepting applications',
            requestId 
          } 
        },
        { status: 400 }
      );
    }

    // Check if already applied
    const { data: existingApplication } = await supabase
      .from('booking_responses')
      .select('id')
      .eq('job_id', jobId)
      .eq('staff_id', user.id)
      .maybeSingle();

    if (existingApplication) {
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: 'ALREADY_APPLIED', 
            message: 'You have already applied for this job',
            requestId 
          } 
        },
        { status: 400 }
      );
    }

    // Create application
    const { data: application, error: insertError } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        staff_id: user.id,
        status: 'pending',
        responded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/staff/jobs/:id/apply] Insert failed', { requestId, error: insertError });
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: 'INSERT_FAILED', 
            message: 'Failed to submit application',
            requestId 
          } 
        },
        { status: 500 }
      );
    }

    // Log the application
    console.log('[POST /api/staff/jobs/:id/apply] Application created', {
      event: 'job_application.created',
      requestId,
      applicationId: application.id,
      jobId,
      staffId: user.id,
      settingId: job.setting_id,
    });

    return NextResponse.json({
      ok: true,
      data: { 
        applicationId: application.id,
        message: 'Application submitted successfully',
      },
    });

  } catch (error) {
    console.error('[POST /api/staff/jobs/:id/apply] Unexpected error', { requestId, error });
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
