/**
 * GET /api/staff/jobs/:id
 * Get details of a specific job
 */

import { NextRequest, NextResponse } from 'next/server';
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

    // Get job ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const jobId = pathParts[pathParts.length - 1];

    if (!jobId) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_ID', message: 'Job ID is required', requestId } },
        { status: 400 }
      );
    }

    // Get staff profile to check verification status
    const { data: staffProfile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('verification_status')
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
            message: 'You must be verified to view job details',
            requestId 
          } 
        },
        { status: 403 }
      );
    }

    // Fetch job with setting details
    const { data: job, error } = await supabase
      .from('job_requests')
      .select(`
        *,
        setting_profiles:setting_id (
          setting_name,
          ofsted_rating,
          address_line_1,
          address_line_2,
          city,
          postcode,
          phone
        )
      `)
      .eq('id', jobId)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { ok: false, error: { code: 'JOB_NOT_FOUND', message: 'Job not found', requestId } },
        { status: 404 }
      );
    }

    // Check if already applied
    const { data: existingApplication } = await supabase
      .from('booking_responses')
      .select('id, status')
      .eq('job_id', jobId)
      .eq('staff_id', user.id)
      .maybeSingle();

    const jobWithLabels = {
      ...job,
      role_label: jobRoleLabels[job.role_required as keyof typeof jobRoleLabels] || job.role_required,
      setting_name: job.setting_profiles?.setting_name || 'Unknown Setting',
      setting_ofsted_rating: job.setting_profiles?.ofsted_rating,
      setting_phone: job.setting_profiles?.phone,
      setting_address: job.setting_profiles ? 
        `${job.setting_profiles.address_line_1 || ''}${job.setting_profiles.address_line_2 ? ', ' + job.setting_profiles.address_line_2 : ''}`.replace(/^,\s*|,\s*$/g, '') : 
        '',
    };

    return NextResponse.json({
      ok: true,
      data: { 
        job: jobWithLabels,
        applicationStatus: {
          hasApplied: !!existingApplication,
          applicationId: existingApplication?.id,
          status: existingApplication?.status,
        },
      },
    });

  } catch (error) {
    console.error('[GET /api/staff/jobs/:id] Unexpected error', { requestId, error });
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
