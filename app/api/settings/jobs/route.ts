/**
 * POST /api/settings/jobs
 * Create a new job request
 */

import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { createJobApiSchema, jobRoleLabels, type JobRole } from '@/app/lib/validations/jobs';
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

    // Parse and validate request body
    const body = await request.json();
    const parseResult = createJobApiSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.flatten();
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid job data',
            details: errors.fieldErrors,
            requestId,
          },
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Verify setting is approved
    const { data: setting, error: settingError } = await supabase
      .from('setting_profiles')
      .select('verification_status, setting_name, postcode')
      .eq('id', user.id)
      .single();

    if (settingError || !setting) {
      return NextResponse.json(
        { ok: false, error: { code: 'SETTING_NOT_FOUND', message: 'Setting profile not found', requestId } },
        { status: 404 }
      );
    }

    if (setting.verification_status !== 'approved') {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'SETTING_NOT_APPROVED',
            message: 'Your business must be approved before posting jobs',
            requestId,
          },
        },
        { status: 403 }
      );
    }

    // Insert job request
    const { data: job, error: insertError } = await supabase
      .from('job_requests')
      .insert({
        setting_id: user.id,
        title: data.title,
        description: data.description,
        job_date: data.job_date,
        start_time: data.start_time,
        end_time: data.end_time,
        role_required: data.role_required,
        hourly_rate: data.hourly_rate,
        estimated_total: data.estimated_total,
        postcode: data.postcode || setting.postcode,
        status: 'open',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/settings/jobs] Insert failed', { requestId, error: insertError });
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'INSERT_FAILED',
            message: 'Failed to create job posting',
            requestId,
          },
        },
        { status: 500 }
      );
    }

    // Log audit event
    console.log('[POST /api/settings/jobs] Job created', {
      event: 'job.created',
      requestId,
      jobId: job.id,
      settingId: user.id,
      title: job.title,
    });

    return NextResponse.json({
      ok: true,
      data: {
        job: {
          ...job,
          role_label: jobRoleLabels[(job.role_required as JobRole) || 'nursery_practitioner'] || job.role_required,
        },
      },
    });

  } catch (error) {
    console.error('[POST /api/settings/jobs] Unexpected error', { requestId, error });
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
}, { rateLimit: rateLimits.apiMutation });

/**
 * GET /api/settings/jobs
 * List jobs for the authenticated setting
 */
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

    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let query = supabase
      .from('job_requests')
      .select('*')
      .eq('setting_id', user.id)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('[GET /api/settings/jobs] Fetch failed', { requestId, error });
      return NextResponse.json(
        { ok: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch jobs', requestId } },
        { status: 500 }
      );
    }

    // Add role labels
    const jobsWithLabels = jobs?.map(job => ({
      ...job,
      role_label: jobRoleLabels[(job.role_required as JobRole) || 'nursery_practitioner'] || job.role_required,
    })) || [];

    return NextResponse.json({
      ok: true,
      data: { jobs: jobsWithLabels },
    });

  } catch (error) {
    console.error('[GET /api/settings/jobs] Unexpected error', { requestId, error });
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
}, { rateLimit: rateLimits.apiRead });
