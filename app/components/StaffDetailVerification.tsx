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
}

interface Props {
  staff: Staff;
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
    { type: 'dbs_certificate', label: 'DBS Certificate' },
    { type: 'safeguarding_certificate', label: 'Safeguarding' },
    { type: 'paediatric_first_aid', label: 'First Aid' },
    { type: 'right_to_work', label: 'Right to Work' },
    { type: 'qualification_certificate', label: 'Qualification' },
  ];

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
                onClick={() => {
                  setAction(null);
                  setReason('');
                }}
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
                onClick={() => {
                  setAction(null);
                  setReason('');
                }}
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
                onClick={() => {
                  setAction(null);
                  setReason('');
                }}
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
