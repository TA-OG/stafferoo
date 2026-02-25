/**
 * GET /api/staff/jobs
 * List available jobs for staff to browse
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

    // Get staff profile for filtering
    const { data: staffProfile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('travel_radius_miles, postcode, verification_status')
      .eq('id', user.id)
      .single();

    if (profileError || !staffProfile) {
      return NextResponse.json(
        { ok: false, error: { code: 'PROFILE_NOT_FOUND', message: 'Staff profile not found', requestId } },
        { status: 404 }
      );
    }

    // Only verified staff can browse jobs
    if (staffProfile.verification_status !== 'approved') {
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: 'NOT_VERIFIED', 
            message: 'You must be verified to browse jobs',
            requestId 
          } 
        },
        { status: 403 }
      );
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const postcodeFilter = searchParams.get('postcode');

    // Build query - only open jobs
    let query = supabase
      .from('job_requests')
      .select(`
        *,
        setting_profiles:setting_id (
          setting_name,
          ofsted_rating,
          address_line_1,
          city,
          postcode
        )
      `)
      .eq('status', 'open')
      .gte('job_date', new Date().toISOString().split('T')[0]) // Only future jobs
      .order('job_date', { ascending: true });

    // Apply role filter if provided
    if (roleFilter && roleFilter !== 'all') {
      query = query.eq('role_required', roleFilter);
    }

    // Apply date range filters
    if (dateFrom) {
      query = query.gte('job_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('job_date', dateTo);
    }

    // Apply postcode filter if provided
    if (postcodeFilter) {
      query = query.ilike('postcode', `%${postcodeFilter}%`);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('[GET /api/staff/jobs] Fetch failed', { requestId, error });
      return NextResponse.json(
        { ok: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch jobs', requestId } },
        { status: 500 }
      );
    }

    // Add role labels and calculate distance (simplified)
    const jobsWithLabels = jobs?.map(job => ({
      ...job,
      role_label: jobRoleLabels[job.role_required as keyof typeof jobRoleLabels] || job.role_required,
      setting_name: job.setting_profiles?.setting_name || 'Unknown Setting',
      setting_ofsted_rating: job.setting_profiles?.ofsted_rating,
      setting_address: job.setting_profiles ? 
        `${job.setting_profiles.address_line_1 || ''}, ${job.setting_profiles.city || ''}`.replace(/^,\s*|,\s*$/g, '') : 
        '',
    })) || [];

    return NextResponse.json({
      ok: true,
      data: { 
        jobs: jobsWithLabels,
        staff_postcode: staffProfile.postcode,
        travel_radius: staffProfile.travel_radius_miles,
      },
    });

  } catch (error) {
    console.error('[GET /api/staff/jobs] Unexpected error', { requestId, error });
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
