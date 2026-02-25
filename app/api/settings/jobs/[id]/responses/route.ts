/**
 * GET /api/settings/jobs/:id/responses
 * Get all staff responses (applicants) for a specific job
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

    // Verify the job belongs to this setting
    const { data: job, error: jobError } = await supabase
      .from('job_requests')
      .select('id, title, setting_id, status, role_required')
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
        { ok: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to view this job', requestId } },
        { status: 403 }
      );
    }

    // Fetch all responses with staff details
    const { data: responses, error: responsesError } = await supabase
      .from('booking_responses')
      .select(`
        id,
        status,
        message,
        responded_at,
        created_at,
        staff_profiles:staff_id (
          id,
          full_name,
          email,
          phone,
          years_experience,
          qualification_level,
          qualification_name,
          postcode,
          travel_radius_miles,
          transport_mode,
          dbs_update_service,
          verified_at,
          staff_documents(id, doc_type, status, expiry_date)
        )
      `)
      .eq('job_request_id', jobId)
      .order('created_at', { ascending: false });

    if (responsesError) {
      console.error('[GET /api/settings/jobs/:id/responses] Fetch failed', { requestId, error: responsesError });
      return NextResponse.json(
        { ok: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch responses', requestId } },
        { status: 500 }
      );
    }

    // Get current booking if exists
    const { data: booking } = await supabase
      .from('bookings')
      .select('primary_staff_id, secondary_staff_id, status')
      .eq('job_request_id', jobId)
      .maybeSingle();

    // Transform responses to include staff info
    const applicants = responses?.map((response) => {
      // Supabase returns joined data as arrays
      const staff = Array.isArray(response.staff_profiles) 
        ? response.staff_profiles[0] 
        : response.staff_profiles;
      const documents = staff?.staff_documents || [];
      
      // Check required documents
      const requiredDocs = ['dbs_certificate', 'safeguarding_certificate', 'paediatric_first_aid', 'right_to_work'];
      const docStatus: Record<string, string> = {};
      requiredDocs.forEach(docType => {
        const doc = documents.find((d: {doc_type: string; status: string}) => d.doc_type === docType);
        docStatus[docType] = doc ? doc.status : 'missing';
      });
      
      const allDocsValid = requiredDocs.every(docType => {
        const doc = documents.find((d: {doc_type: string; status: string}) => d.doc_type === docType);
        return doc && doc.status === 'valid';
      });

      return {
        responseId: response.id,
        status: response.status,
        message: response.message,
        respondedAt: response.responded_at,
        createdAt: response.created_at,
        isPrimary: booking?.primary_staff_id === staff?.id,
        isSecondary: booking?.secondary_staff_id === staff?.id,
        staff: {
          id: staff?.id,
          fullName: staff?.full_name,
          email: staff?.email,
          phone: staff?.phone,
          yearsExperience: staff?.years_experience,
          qualificationLevel: staff?.qualification_level,
          qualificationName: staff?.qualification_name,
          postcode: staff?.postcode,
          travelRadius: staff?.travel_radius_miles,
          transportMode: staff?.transport_mode,
          dbsUpdateService: staff?.dbs_update_service,
          verifiedAt: staff?.verified_at,
          documents: docStatus,
          allDocsValid,
        },
      };
    }) || [];

    return NextResponse.json({
      ok: true,
      data: {
        job: {
          id: job.id,
          title: job.title,
          status: job.status,
          roleLabel: jobRoleLabels[job.role_required as keyof typeof jobRoleLabels] || job.role_required,
        },
        applicants,
        booking: booking || null,
      },
    });

  } catch (error) {
    console.error('[GET /api/settings/jobs/:id/responses] Unexpected error', { requestId, error });
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
