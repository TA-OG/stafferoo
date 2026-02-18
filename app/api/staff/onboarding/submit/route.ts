import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';

const REQUIRED_DOCUMENTS = [
  'dbs_certificate',
  'safeguarding_certificate',
  'paediatric_first_aid',
  'right_to_work',
  'qualification_certificate',
];

export async function POST() {
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
            message: 'You must be signed in to submit onboarding',
          },
        },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'Profile not found. Please complete all steps first.',
          },
        },
        { status: 404 }
      );
    }

    const missingFields: string[] = [];

    if (!profile.full_name) missingFields.push('Full name');
    if (!profile.date_of_birth) missingFields.push('Date of birth');
    if (!profile.phone) missingFields.push('Phone number');
    if (!profile.address_line_1) missingFields.push('Address');
    if (!profile.city) missingFields.push('City');
    if (!profile.postcode) missingFields.push('Postcode');
    if (!profile.dbs_update_service) missingFields.push('DBS Update Service subscription');
    if (!profile.dbs_certificate_number) missingFields.push('DBS certificate number');
    if (!profile.dbs_issue_date) missingFields.push('DBS issue date');
    if (!profile.dbs_surname_on_certificate) missingFields.push('DBS surname');
    if (!profile.emergency_contact_1_name) missingFields.push('Emergency contact 1 name');
    if (!profile.emergency_contact_1_phone) missingFields.push('Emergency contact 1 phone');
    if (!profile.gp_name) missingFields.push('GP name');
    if (!profile.gp_address) missingFields.push('GP address');
    if (!profile.health_declaration) missingFields.push('Health declaration');
    if (!profile.smoking_declaration) missingFields.push('Smoking declaration');
    if (!profile.drugs_alcohol_declaration) missingFields.push('Drugs and alcohol declaration');
    if (profile.disqualified_person_declaration !== false) {
      missingFields.push('Disqualified person declaration must be false');
    }
    if (!profile.digital_signature_svg) missingFields.push('Digital signature');

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'INCOMPLETE_PROFILE',
            message: 'Profile is incomplete',
            details: missingFields,
          },
        },
        { status: 400 }
      );
    }

    const { data: documents } = await supabase
      .from('staff_documents')
      .select('doc_type')
      .eq('staff_id', user.id);

    const uploadedDocTypes = documents?.map((doc) => doc.doc_type) || [];
    const missingDocs = REQUIRED_DOCUMENTS.filter((docType) => !uploadedDocTypes.includes(docType));

    if (missingDocs.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'MISSING_DOCUMENTS',
            message: 'Required documents are missing',
            details: missingDocs,
          },
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('staff_profiles')
      .update({
        verification_status: 'pending',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'SUBMIT_FAILED',
            message: 'Failed to submit onboarding',
            details: updateError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        verification_status: 'pending',
        submitted_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
