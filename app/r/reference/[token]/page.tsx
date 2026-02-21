/**
 * Referee landing page — /r/reference/[token]
 *
 * Server component: validates token on load, records viewed_at, then renders
 * the questionnaire form (client component).
 *
 * Security:
 * - Uses service-role admin client to call resolve_reference_token RPC
 *   (no user session exists — referee is external).
 * - Token is hashed before the DB lookup; raw token never reaches the DB.
 * - Errors (expired, used, not found) each render a distinct informational page.
 */

import { createAdminClient } from '@/app/lib/supabase-server';
import { hashReferenceToken } from '@/app/lib/validations/references';
import { features } from '@/app/lib/features';
import RefereeForm from './RefereeForm';

interface PageProps {
  params: Promise<{ token: string }>;
}

// ---------------------------------------------------------------------------
// Error states
// ---------------------------------------------------------------------------

function ErrorPage({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen bg-[#f8f0f5] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-3">{title}</h1>
        <p className="text-gray-600 text-sm">{body}</p>
        <p className="mt-4 text-xs text-gray-400">
          Questions?{' '}
          <a href="mailto:support@stafferoo.app" className="underline text-[#c653a0]">
            support@stafferoo.app
          </a>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function RefereePage({ params }: PageProps) {
  if (!features.references) {
    return (
      <ErrorPage
        title="Page not found"
        body="This page is not available."
      />
    );
  }

  const { token } = await params;

  // Basic sanity check on token format (hex string, 64 chars)
  if (!/^[0-9a-f]{64}$/.test(token)) {
    return (
      <ErrorPage
        title="Invalid link"
        body="This reference link is not valid. Please check you copied the full URL."
      />
    );
  }

  const tokenHash = await hashReferenceToken(token);
  const adminDb = createAdminClient();

  interface ReferenceTokenData {
    request_id:       string;
    reference_id:     string;
    reference_type:   'professional' | 'personal';
    referee_name:     string;
    referee_position: string | null;
    applicant_name:   string;
    expires_at:       string;
  }

  let referenceData: ReferenceTokenData | null = null;
  let errorKind: 'not_found' | 'used' | 'expired' | null = null;

  try {
    const { data, error } = await adminDb.rpc('resolve_reference_token', {
      p_token_hash: tokenHash,
    });

    if (error) {
      const msg: string = error.message ?? '';
      if (msg.includes('TOKEN_NOT_FOUND')) errorKind = 'not_found';
      else if (msg.includes('TOKEN_ALREADY_USED')) errorKind = 'used';
      else if (msg.includes('TOKEN_EXPIRED')) errorKind = 'expired';
      else {
        console.error('[referee-page] resolve_reference_token error', { tokenHash: tokenHash.slice(0, 8), error });
        errorKind = 'not_found';
      }
    } else {
      referenceData = data as unknown as ReferenceTokenData;
    }
  } catch (err) {
    console.error('[referee-page] unexpected error', { error: err });
    errorKind = 'not_found';
  }

  if (errorKind === 'used') {
    return (
      <ErrorPage
        title="Reference already submitted"
        body="This reference link has already been used. Thank you — your response has been recorded."
      />
    );
  }

  if (errorKind === 'expired') {
    return (
      <ErrorPage
        title="Reference link expired"
        body="This reference link has expired. Please contact the applicant to request a new link."
      />
    );
  }

  if (errorKind === 'not_found' || !referenceData) {
    return (
      <ErrorPage
        title="Link not found"
        body="This reference link is not valid or has already been used. Please check you copied the full URL."
      />
    );
  }

  console.log('[referee-page] viewed', {
    event:       'references.referee_viewed',
    requestId:   referenceData.request_id,
    referenceId: referenceData.reference_id,
  });

  return (
    <div className="min-h-screen bg-[#f8f0f5] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#c653a0]">Stafferoo</h1>
          <p className="text-gray-500 text-sm mt-1">Early Years Staffing Platform</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Staff Reference Request</h2>
          <p className="text-gray-600 mb-6">
            <strong>{referenceData.applicant_name}</strong> has listed you as a reference as part
            of their application to join Stafferoo. Please complete the short form below.
          </p>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 text-sm text-gray-700">
            <p>
              <strong>Your details on file:</strong> {referenceData.referee_name}
              {referenceData.referee_position ? ` · ${referenceData.referee_position}` : ''}
            </p>
          </div>

          {/* Client component handles the form interaction and submission */}
          <RefereeForm
            token={token}
            requestId={referenceData.request_id}
            applicantName={referenceData.applicant_name}
            refereeName={referenceData.referee_name}
            refereePosition={referenceData.referee_position ?? ''}
          />
        </div>
      </div>
    </div>
  );
}
