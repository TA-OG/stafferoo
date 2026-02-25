'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface HealthDeclaration {
  conditions: string[];
  notes?: string;
}

interface StaffDocument {
  id: string;
  doc_type: string;
  status: string;
  storage_path?: string;
  original_filename?: string;
  notes?: string;
}

interface StaffVerification {
  status: string;
  last_reviewed_at?: string;
  last_reviewed_by?: string;
  rejection_reason?: string;
}

interface ReferenceAnswers {
  confirmed_name: string;
  confirmed_position: string;
  known_applicant_since: string;
  reliability: 'excellent' | 'good' | 'satisfactory' | 'poor';
  punctuality: 'excellent' | 'good' | 'satisfactory' | 'poor';
  safeguarding_concerns: boolean;
  eligible_for_rehire: boolean;
  comments?: string;
}

interface ReferenceResponse {
  id: string;
  answers_json: ReferenceAnswers;
  created_at: string;
}

interface ReferenceRequest {
  id: string;
  sent_at: string;
  viewed_at: string | null;
  submitted_at: string | null;
  expires_at: string;
  superseded_at: string | null;
  reference_responses: ReferenceResponse[];
}

interface StaffReference {
  id: string;
  type: 'professional' | 'personal';
  referee_name: string;
  referee_position: string | null;
  referee_email: string;
  setting_urn: string | null;
  setting_name: string | null;
  status: string;
  reference_requests: ReferenceRequest[];
}

interface Staff {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  national_insurance_number?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postcode?: string;
  travel_radius_miles?: number;
  transport_mode?: string;
  years_experience?: number;
  qualification_level?: string;
  dbs_update_service: boolean;
  dbs_certificate_number?: string;
  dbs_issue_date?: string;
  dbs_surname_on_certificate?: string;
  criminal_conviction_declared: boolean;
  criminal_conviction_details?: string;
  emergency_contact_1_name?: string;
  emergency_contact_1_phone?: string;
  emergency_contact_1_relationship?: string;
  gp_name?: string;
  gp_address?: string;
  health_declaration?: HealthDeclaration;
  smoking_declaration?: string;
  drugs_alcohol_declaration?: string;
  disqualified_person_declaration: boolean;
  verification_status: string;
  submitted_at?: string;
  staff_documents?: StaffDocument[];
  staff_verifications?: StaffVerification[];
  staff_references?: StaffReference[];
}

interface Props {
  staff: Staff;
}

const RATING_LABELS: Record<string, { label: string; colour: string }> = {
  excellent:    { label: 'Excellent',    colour: 'bg-green-100 text-green-800' },
  good:         { label: 'Good',         colour: 'bg-blue-100 text-blue-800' },
  satisfactory: { label: 'Satisfactory', colour: 'bg-yellow-100 text-yellow-800' },
  poor:         { label: 'Poor',         colour: 'bg-red-100 text-red-800' },
};

const REFERENCE_STATUS_LABELS: Record<string, { label: string; colour: string }> = {
  draft:     { label: 'Not sent',  colour: 'bg-gray-100 text-gray-600' },
  sent:      { label: 'Sent',      colour: 'bg-blue-100 text-blue-700' },
  viewed:    { label: 'Viewed',    colour: 'bg-yellow-100 text-yellow-700' },
  submitted: { label: 'Submitted', colour: 'bg-green-100 text-green-800' },
  expired:   { label: 'Expired',   colour: 'bg-red-100 text-red-600' },
  cancelled: { label: 'Cancelled', colour: 'bg-gray-100 text-gray-500' },
};

function RatingBadge({ value }: { value: string }) {
  const cfg = RATING_LABELS[value] ?? { label: value, colour: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cfg.colour}`}>
      {cfg.label}
    </span>
  );
}

function ReferencePanel({ reference }: { reference: StaffReference }) {
  // Find the active (non-superseded) request
  const activeRequest = reference.reference_requests
    .filter((r) => r.superseded_at === null)
    .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())[0];

  const response = activeRequest?.reference_responses?.[0] ?? null;
  const answers = response?.answers_json ?? null;

  const statusCfg =
    REFERENCE_STATUS_LABELS[reference.status] ??
    { label: reference.status, colour: 'bg-gray-100 text-gray-600' };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {reference.type === 'professional' ? 'Professional reference' : 'Personal reference'}
          </span>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">
            {reference.referee_name}
            {reference.referee_position && (
              <span className="font-normal text-gray-500"> — {reference.referee_position}</span>
            )}
          </p>
          <p className="text-xs text-gray-400">{reference.referee_email}</p>
          {reference.type === 'professional' && reference.setting_name && (
            <p className="text-xs text-gray-500 mt-0.5">
              {reference.setting_name}
              {reference.setting_urn && ` (URN: ${reference.setting_urn})`}
            </p>
          )}
        </div>
        <span className={`px-3 py-1 rounded text-xs font-semibold ${statusCfg.colour}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Timeline */}
      {activeRequest && (
        <div className="px-4 py-2 border-b border-gray-100 flex gap-6 text-xs text-gray-500">
          <span>Sent: {fmt(activeRequest.sent_at)}</span>
          {activeRequest.viewed_at && <span>Viewed: {fmt(activeRequest.viewed_at)}</span>}
          {activeRequest.submitted_at && <span>Submitted: {fmt(activeRequest.submitted_at)}</span>}
        </div>
      )}

      {/* Answers */}
      {answers ? (
        <div className="px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Confirmed name</p>
              <p className="font-medium text-gray-900">{answers.confirmed_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Confirmed position</p>
              <p className="font-medium text-gray-900">{answers.confirmed_position}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 mb-0.5">Known applicant since</p>
              <p className="font-medium text-gray-900">{answers.known_applicant_since}</p>
            </div>
          </div>

          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">Reliability</p>
              <RatingBadge value={answers.reliability} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Punctuality</p>
              <RatingBadge value={answers.punctuality} />
            </div>
          </div>

          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">Safeguarding concerns</p>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${answers.safeguarding_concerns ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {answers.safeguarding_concerns ? 'YES' : 'No'}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Eligible for rehire</p>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${answers.eligible_for_rehire ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {answers.eligible_for_rehire ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          {answers.safeguarding_concerns && (
            <div className="rounded-lg bg-red-50 border border-red-300 p-3">
              <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">
                Safeguarding concern flagged
              </p>
              <p className="text-sm text-red-700">
                {answers.comments
                  ? answers.comments
                  : 'The referee indicated a safeguarding concern but provided no additional comments.'}
              </p>
            </div>
          )}

          {answers.comments && !answers.safeguarding_concerns && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Additional comments</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{answers.comments}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 py-4">
          <p className="text-sm text-gray-400 italic">
            {reference.status === 'draft'
              ? 'Reference request has not been sent yet.'
              : reference.status === 'expired'
              ? 'Reference link expired before the referee responded.'
              : 'Awaiting referee response.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function StaffDetailVerification({ staff }: Props) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState<'verify' | 'reject' | 'request_changes' | null>(null);
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!action) return;

    if ((action === 'reject' || action === 'request_changes') && !reason.trim()) {
      alert('Please provide a reason');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/staff/${staff.id}/verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Action failed');
      }

      router.push('/admin/staff');
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Action failed';
      alert(message);
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateAge = (dob: string | undefined) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const requiredDocs = [
    { type: 'dbs_certificate',        label: 'DBS Certificate' },
    { type: 'safeguarding_certificate', label: 'Safeguarding' },
    { type: 'paediatric_first_aid',    label: 'First Aid' },
    { type: 'right_to_work',           label: 'Right to Work' },
    { type: 'qualification_certificate', label: 'Qualification' },
  ];

  const references = (staff.staff_references ?? []).sort((a, b) =>
    a.type === 'professional' ? -1 : b.type === 'professional' ? 1 : 0
  );

  const hasSafeguardingFlag = references.some((ref) =>
    ref.reference_requests.some((req) =>
      req.reference_responses.some((res) => res.answers_json?.safeguarding_concerns === true)
    )
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{staff.full_name}</h1>
        <p className="text-gray-600 mb-6">Staff Application Review</p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 font-medium">{staff.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <span className="ml-2 font-medium">{staff.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Postcode:</span>
                <span className="ml-2 font-medium">{staff.postcode || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Professional Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Age:</span>
                <span className="ml-2 font-medium">{calculateAge(staff.date_of_birth)} years</span>
              </div>
              <div>
                <span className="text-gray-500">Experience:</span>
                <span className="ml-2 font-medium">{staff.years_experience || 0} years</span>
              </div>
              <div>
                <span className="text-gray-500">Qualification:</span>
                <span className="ml-2 font-medium capitalize">
                  {staff.qualification_level?.replace(/_/g, ' ') || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Compliance Checks</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm">DBS Update Service</span>
              <span className={`px-3 py-1 rounded text-xs font-semibold ${staff.dbs_update_service ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {staff.dbs_update_service ? 'Subscribed' : 'Not Subscribed'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm">Disqualified Person</span>
              <span className={`px-3 py-1 rounded text-xs font-semibold ${!staff.disqualified_person_declaration ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {staff.disqualified_person_declaration ? 'YES (FAIL)' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm">Criminal Conviction</span>
              <span className={`px-3 py-1 rounded text-xs font-semibold ${staff.criminal_conviction_declared ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {staff.criminal_conviction_declared ? 'Declared' : 'None'}
              </span>
            </div>
          </div>

          {staff.criminal_conviction_declared && staff.criminal_conviction_details && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Conviction Details</h4>
              <p className="text-sm text-gray-700">{staff.criminal_conviction_details}</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Documents</h3>
          <div className="space-y-2">
            {requiredDocs.map(doc => {
              const uploaded = staff.staff_documents?.find(d => d.doc_type === doc.type);
              return (
                <div key={doc.type} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm">{doc.label}</span>
                  <span className={`px-3 py-1 rounded text-xs font-semibold ${
                    uploaded
                      ? uploaded.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : uploaded.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {uploaded ? uploaded.status : 'Not Uploaded'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">DBS Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Certificate Number:</span>
              <span className="ml-2 font-medium">{staff.dbs_certificate_number || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Issue Date:</span>
              <span className="ml-2 font-medium">{formatDate(staff.dbs_issue_date)}</span>
            </div>
            <div>
              <span className="text-gray-500">Surname on Certificate:</span>
              <span className="ml-2 font-medium">{staff.dbs_surname_on_certificate || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Emergency Contact</h3>
          <div className="text-sm">
            <span className="font-medium">{staff.emergency_contact_1_name || 'N/A'}</span>
            <span className="ml-2 text-gray-500">
              {staff.emergency_contact_1_phone || 'N/A'} ({staff.emergency_contact_1_relationship || 'N/A'})
            </span>
          </div>
        </div>

        {staff.health_declaration && (staff.health_declaration as HealthDeclaration).conditions.length > 0 && (
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Health Declaration</h3>
            <div className="text-sm">
              <div className="mb-2">
                <span className="font-medium">Conditions:</span>
                <span className="ml-2">{(staff.health_declaration as HealthDeclaration).conditions.join(', ')}</span>
              </div>
              {(staff.health_declaration as HealthDeclaration).notes && (
                <div className="bg-blue-50 p-3 rounded">
                  <span className="font-medium">Notes:</span>
                  <p className="mt-1">{(staff.health_declaration as HealthDeclaration).notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* References */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-sm font-semibold text-gray-700">References</h3>
            {hasSafeguardingFlag && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 uppercase tracking-wide">
                Safeguarding concern
              </span>
            )}
          </div>

          {references.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No references submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {references.map((ref) => (
                <ReferencePanel key={ref.id} reference={ref} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Verification Actions</h3>

        {action && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {action === 'reject' ? 'Rejection Reason (Required)' : 'Notes'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder={action === 'reject' ? 'Provide reason for rejection' : 'Add any notes or feedback'}
            />
          </div>
        )}

        <div className="flex gap-4">
          {action === 'verify' ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Confirm Verification'}
              </button>
              <button
                onClick={() => { setAction(null); setReason(''); }}
                disabled={isProcessing}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : action === 'reject' ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={isProcessing || !reason.trim()}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => { setAction(null); setReason(''); }}
                disabled={isProcessing}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : action === 'request_changes' ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={isProcessing || !reason.trim()}
                className="flex-1 bg-yellow-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-700 disabled:bg-gray-400 transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Request Changes'}
              </button>
              <button
                onClick={() => { setAction(null); setReason(''); }}
                disabled={isProcessing}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setAction('verify')}
                disabled={isProcessing}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Verify & Approve
              </button>
              <button
                onClick={() => setAction('request_changes')}
                disabled={isProcessing}
                className="flex-1 bg-yellow-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
              >
                Request Changes
              </button>
              <button
                onClick={() => setAction('reject')}
                disabled={isProcessing}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
