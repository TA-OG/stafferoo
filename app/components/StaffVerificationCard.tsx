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
  submitted_at?: string;
  staff_documents?: StaffDocument[];
}

interface Props {
  staff: Staff;
}

export default function StaffVerificationCard({ staff }: Props) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState<'approve' | 'reject' | null>(null);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !notes.trim()) {
      alert('Please provide rejection notes');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/admin/staff/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staff.id,
          action,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        const msg = data.error?.message ?? data.error ?? 'Action failed';
        throw new Error(typeof msg === 'string' ? msg : 'Action failed');
      }

      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Action failed';
      alert(message);
    } finally {
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

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const getDocumentStatus = (docType: string) => {
    const doc = staff.staff_documents?.find(d => d.doc_type === docType);
    return doc ? doc.status : 'missing';
  };

  const requiredDocs = [
    { type: 'dbs_certificate', label: 'DBS Certificate' },
    { type: 'safeguarding_certificate', label: 'Safeguarding' },
    { type: 'paediatric_first_aid', label: 'First Aid' },
    { type: 'right_to_work', label: 'Right to Work' },
    { type: 'qualification_certificate', label: 'Qualification' },
  ];

  const allDocsUploaded = requiredDocs.every(doc => getDocumentStatus(doc.type) !== 'missing');

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {staff.full_name}
            </h3>
            <p className="text-sm text-gray-500">
              Submitted: {formatDateTime(staff.submitted_at)}
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-500">Email:</span>
            <span className="ml-2 font-medium">{staff.email}</span>
          </div>
          <div>
            <span className="text-gray-500">Phone:</span>
            <span className="ml-2 font-medium">{staff.phone || 'N/A'}</span>
          </div>
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
          <div>
            <span className="text-gray-500">Postcode:</span>
            <span className="ml-2 font-medium">{staff.postcode || 'N/A'}</span>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Documents</h4>
          <div className="grid grid-cols-5 gap-2">
            {requiredDocs.map(doc => {
              const status = getDocumentStatus(doc.type);
              return (
                <div
                  key={doc.type}
                  className={`text-xs px-2 py-1 rounded text-center ${
                    status === 'pending'
                      ? 'bg-green-100 text-green-800'
                      : status === 'missing'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {doc.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Compliance Checks</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded-full mr-2 ${staff.dbs_update_service ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>DBS Update Service: {staff.dbs_update_service ? 'Subscribed' : 'Not Subscribed'}</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded-full mr-2 ${!staff.disqualified_person_declaration ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Disqualified Person: {staff.disqualified_person_declaration ? 'YES (FAIL)' : 'No'}</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded-full mr-2 ${staff.criminal_conviction_declared ? 'bg-yellow-500' : 'bg-green-500'}`} />
              <span>Criminal Conviction: {staff.criminal_conviction_declared ? 'Declared' : 'None'}</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded-full mr-2 ${allDocsUploaded ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>All Documents: {allDocsUploaded ? 'Uploaded' : 'Missing'}</span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Personal Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Date of Birth:</span>
                  <span className="ml-2 font-medium">{formatDate(staff.date_of_birth)}</span>
                </div>
                <div>
                  <span className="text-gray-500">NI Number:</span>
                  <span className="ml-2 font-medium">{staff.national_insurance_number || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Address:</span>
                  <span className="ml-2 font-medium">
                    {staff.address_line_1}
                    {staff.address_line_2 && `, ${staff.address_line_2}`}
                    {staff.city && `, ${staff.city}`}
                    {staff.postcode && `, ${staff.postcode}`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Travel Radius:</span>
                  <span className="ml-2 font-medium">{staff.travel_radius_miles || 0} miles</span>
                </div>
                <div>
                  <span className="text-gray-500">Transport:</span>
                  <span className="ml-2 font-medium capitalize">
                    {staff.transport_mode?.replace(/_/g, ' ') || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">DBS Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
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

            {staff.criminal_conviction_declared && staff.criminal_conviction_details && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Criminal Conviction Details</h4>
                <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">
                  {staff.criminal_conviction_details}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Emergency Contacts</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Contact 1:</span>
                  <span className="ml-2">
                    {staff.emergency_contact_1_name || 'N/A'} - {staff.emergency_contact_1_phone || 'N/A'} ({staff.emergency_contact_1_relationship || 'N/A'})
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">GP Details</h4>
              <div className="text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 font-medium">{staff.gp_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Address:</span>
                  <span className="ml-2 font-medium">{staff.gp_address || 'N/A'}</span>
                </div>
              </div>
            </div>

            {staff.health_declaration && staff.health_declaration.conditions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Health Declaration</h4>
                <div className="text-sm">
                  <div className="mb-1">
                    <span className="font-medium">Conditions:</span>
                    <span className="ml-2">{staff.health_declaration.conditions.join(', ')}</span>
                  </div>
                  {staff.health_declaration.notes && (
                    <div className="bg-blue-50 p-3 rounded mt-2">
                      <span className="font-medium">Notes:</span>
                      <p className="mt-1">{staff.health_declaration.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Lifestyle Declarations</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Smoking:</span>
                  <span className="ml-2 font-medium capitalize">
                    {staff.smoking_declaration?.replace(/_/g, ' ') || 'N/A'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Drugs & Alcohol:</span>
                  <span className="ml-2 font-medium">{staff.drugs_alcohol_declaration || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {showNotesInput && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {showNotesInput === 'reject' ? 'Rejection Reason (Required)' : 'Notes (Optional)'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder={showNotesInput === 'reject' ? 'Please provide a reason for rejection' : 'Add any notes...'}
            />
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {showNotesInput === 'approve' ? (
            <>
              <button
                onClick={() => handleAction('approve')}
                disabled={isProcessing}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Confirm Approval'}
              </button>
              <button
                onClick={() => {
                  setShowNotesInput(null);
                  setNotes('');
                }}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : showNotesInput === 'reject' ? (
            <>
              <button
                onClick={() => handleAction('reject')}
                disabled={isProcessing || !notes.trim()}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowNotesInput(null);
                  setNotes('');
                }}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowNotesInput('approve')}
                disabled={isProcessing}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => setShowNotesInput('reject')}
                disabled={isProcessing}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
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
