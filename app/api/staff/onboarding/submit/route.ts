import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';

const REQUIRED_DOCUMENTS = [
  'dbs_certificate',
  'safeguarding_certificate',
  'paediatric_first_aid',
  'right_to_work',
  'qualification_certificate',
];

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = getAuthFromRequest(request);
  if (!auth.ok) {
    return jsonError(auth.status, auth.code, auth.message);
  }
  const { user, supabase } = auth;

  try {
    // -----------------------------------------------------------------------
    // 1. Load profile via SECURITY DEFINER RPC
    //
    // A plain .from('staff_profiles').select() through the user-scoped anon
    // client can fail to resolve auth.uid() in the RLS context, returning zero
    // rows even when the profile exists. get_my_profile() runs as the function
    // definer (bypasses RLS) and enforces ownership via auth.uid() internally.
    // -----------------------------------------------------------------------
    const { data: rows, error: profileError } = await supabase.rpc('get_my_profile');

    if (profileError) {
      console.error('[onboarding-submit] get_my_profile rpc failed', { requestId, userId: user.id, error: profileError });
      return jsonError(500, 'DB_ERROR', `Failed to load profile: ${profileError.message}`);
    }

    const profile = Array.isArray(rows) ? rows[0] : rows;

    if (!profile) {
      console.error('[onboarding-submit] profile not found', { requestId, userId: user.id });
      return jsonError(404, 'PROFILE_NOT_FOUND', 'Profile not found — please complete all onboarding steps first.');
    }

    // -----------------------------------------------------------------------
    // 2. Hard-stop disqualification checks (cannot submit if true)
    // -----------------------------------------------------------------------
    if (profile.disqualified_person_declaration === true) {
      return jsonError(400, 'DISQUALIFIED',
        'Your application cannot be submitted because you indicated you are disqualified from working with children under the Childcare Disqualification Regulations 2018. Please contact support@stafferoo.app if you believe this is an error.');
    }

    if (profile.drugs_alcohol_declaration === true) {
      return jsonError(400, 'DRUGS_ALCOHOL_ISSUES',
        'Your application cannot be submitted because you indicated you have current or past issues with drugs or alcohol. Please contact support@stafferoo.app if you believe this is an error.');
    }

    // -----------------------------------------------------------------------
    // 3. Required fields completeness check
    // -----------------------------------------------------------------------
    const missingFields: string[] = [];
    if (!profile.full_name)                  missingFields.push('Full name (Step 2)');
    if (!profile.date_of_birth)              missingFields.push('Date of birth (Step 2)');
    if (!profile.phone)                      missingFields.push('Phone number (Step 2)');
    if (!profile.address_line_1)             missingFields.push('Address (Step 2)');
    if (!profile.city)                       missingFields.push('City (Step 2)');
    if (!profile.postcode)                   missingFields.push('Postcode (Step 2)');
    if (!profile.dbs_update_service)         missingFields.push('DBS Update Service consent (Step 3)');
    if (!profile.dbs_certificate_number)     missingFields.push('DBS certificate number (Step 3)');
    if (!profile.dbs_issue_date)             missingFields.push('DBS issue date (Step 3)');
    if (!profile.dbs_surname_on_certificate) missingFields.push('DBS surname (Step 3)');
    if (!profile.emergency_contact_1_name)   missingFields.push('Emergency contact 1 name (Step 4)');
    if (!profile.emergency_contact_1_phone)  missingFields.push('Emergency contact 1 phone (Step 4)');
    if (!profile.gp_name)                    missingFields.push('GP name (Step 4)');
    if (!profile.gp_address)                 missingFields.push('GP address (Step 4)');
    if (!profile.health_declaration)         missingFields.push('Health declaration (Step 4)');
    if (!profile.smoking_declaration)        missingFields.push('Smoking declaration (Step 4)');
    // drugs_alcohol_declaration must be explicitly false (not null, not undefined)
    if (profile.drugs_alcohol_declaration !== false) missingFields.push('Drugs and alcohol declaration (Step 4)');
    if (!profile.digital_signature_svg)      missingFields.push('Digital signature (Step 5)');

    if (missingFields.length > 0) {
      return jsonError(400, 'INCOMPLETE_PROFILE',
        `Your application is incomplete. Please go back and complete: ${missingFields.join(', ')}.`,
        missingFields);
    }

    // -----------------------------------------------------------------------
    // 4. Required documents check
    // -----------------------------------------------------------------------
    const { data: documents, error: docsError } = await supabase
      .from('staff_documents')
      .select('doc_type')
      .eq('staff_id', user.id);

    if (docsError) {
      console.error('[onboarding-submit] docs query failed', { requestId, userId: user.id, error: docsError });
      return jsonError(500, 'DB_ERROR', 'Failed to verify uploaded documents.');
    }

    const uploadedTypes = new Set((documents ?? []).map((d) => d.doc_type));
    const missingDocs = REQUIRED_DOCUMENTS.filter((t) => !uploadedTypes.has(t));

    if (missingDocs.length > 0) {
      const labels: Record<string, string> = {
        dbs_certificate:           'DBS Certificate',
        safeguarding_certificate:  'Safeguarding Certificate',
        paediatric_first_aid:      'Paediatric First Aid Certificate',
        right_to_work:             'Right to Work Document',
        qualification_certificate: 'Qualification Certificate',
      };
      return jsonError(400, 'MISSING_DOCUMENTS',
        `Please upload the following documents before submitting: ${missingDocs.map((t) => labels[t] ?? t).join(', ')}.`,
        missingDocs);
    }

    // -----------------------------------------------------------------------
    // 5. Mark as submitted via SECURITY DEFINER RPC
    //
    // Same rationale as get_my_profile: a plain .from().update() may silently
    // match 0 rows if auth.uid() does not resolve in the anon client RLS context.
    // submit_my_onboarding() runs as definer and raises if the profile is missing.
    // -----------------------------------------------------------------------
    const { error: submitError } = await supabase.rpc('submit_my_onboarding');

    if (submitError) {
      console.error('[onboarding-submit] submit_my_onboarding rpc failed', { requestId, userId: user.id, error: submitError });
      return jsonError(500, 'DB_ERROR', `Failed to submit application: ${submitError.message}`);
    }

    console.log('[onboarding-submit] submitted', { requestId, userId: user.id });
    return NextResponse.json({ ok: true, data: { verification_status: 'pending', submitted_at: new Date().toISOString() } });

  } catch (error) {
    console.error('[onboarding-submit] unexpected error', { requestId, userId: user.id, error });
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } }, { status: 500 });
  }
}
