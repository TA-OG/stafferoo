'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { StaffComplianceInput } from '@/app/lib/validations/staff';
import SaveProgressButton, { SaveStatus } from './SaveProgressButton';

interface Step3ComplianceProps {
  initialData?: Partial<StaffComplianceInput>;
  onNext: (data: StaffComplianceInput) => void;
  onSave: (data: Partial<StaffComplianceInput>) => void;
  saveStatus: SaveStatus;
  onBack: () => void;
}

interface DocumentUpload {
  doc_type: string;
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  error: string | null;
}

// Accepted document hints shown under each upload slot
const DOCUMENT_HINTS: Record<string, string[]> = {
  dbs_certificate: [
    'Your original DBS (Disclosure and Barring Service) certificate',
    'Must show Enhanced DBS check result',
    'Accepted: PDF, JPG, PNG (max 10 MB)',
  ],
  safeguarding_certificate: [
    'Certificate from an accredited safeguarding training course',
    'Must be dated within the last 3 years',
    'Accepted: PDF, JPG, PNG (max 10 MB)',
  ],
  paediatric_first_aid: [
    'Valid Paediatric First Aid (PFA) certificate',
    'Must be in date — typically valid for 3 years',
    'Accepted: PDF, JPG, PNG (max 10 MB)',
  ],
  right_to_work: [
    'UK/Irish passport or biometric residence permit',
    'Share Code printout (via gov.uk/prove-right-to-work)',
    'Settled/Pre-settled Status letter from the Home Office',
    'British or Irish birth certificate + NI number evidence',
    'Accepted: PDF, JPG, PNG (max 10 MB)',
  ],
  qualification_certificate: [
    'Level 2 or Level 3 Early Years qualification certificate',
    'Examples: CACHE Level 3, NVQ Level 3, BTEC Early Years',
    'Unqualified staff: upload a relevant training certificate',
    'Accepted: PDF, JPG, PNG (max 10 MB)',
  ],
};

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function Step3Compliance({
  initialData,
  onNext,
  onSave,
  saveStatus,
  onBack,
}: Step3ComplianceProps) {
  const [formData, setFormData] = useState<Partial<StaffComplianceInput>>({
    dbs_update_service:         initialData?.dbs_update_service ?? false,
    dbs_certificate_number:     initialData?.dbs_certificate_number ?? '',
    dbs_issue_date:             initialData?.dbs_issue_date ?? '',
    dbs_surname_on_certificate: initialData?.dbs_surname_on_certificate ?? '',
  });

  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>({
    dbs_certificate:           { doc_type: 'dbs_certificate',           file: null, uploading: false, uploaded: false, error: null },
    safeguarding_certificate:  { doc_type: 'safeguarding_certificate',  file: null, uploading: false, uploaded: false, error: null },
    paediatric_first_aid:      { doc_type: 'paediatric_first_aid',      file: null, uploading: false, uploaded: false, error: null },
    right_to_work:             { doc_type: 'right_to_work',             file: null, uploading: false, uploaded: false, error: null },
    qualification_certificate: { doc_type: 'qualification_certificate', file: null, uploading: false, uploaded: false, error: null },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFileSelect = async (docType: string, file: File) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: { ...prev[docType], file, uploading: true, error: null },
    }));

    try {
      const token = await getToken();
      if (!token) throw new Error('Session expired — please sign in again');

      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // Step 1: get a signed upload URL
      const createRes = await fetch('/api/staff/documents/create-upload', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ doc_type: docType, filename: file.name, mime_type: file.type, size_bytes: file.size }),
      });
      const createResult = await createRes.json();
      if (!createResult.ok) throw new Error(createResult.error?.message ?? 'Failed to get upload URL');

      const { upload_url, storage_path } = createResult.data;

      // Step 2: PUT file directly to storage
      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error('Failed to upload file to storage');

      // Step 3: confirm DB record
      const confirmRes = await fetch('/api/staff/documents/confirm-upload', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          doc_type: docType,
          storage_path,
          original_filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        }),
      });
      const confirmResult = await confirmRes.json();
      if (!confirmResult.ok) throw new Error(confirmResult.error?.message ?? 'Failed to save document record');

      setDocuments(prev => ({ ...prev, [docType]: { ...prev[docType], uploading: false, uploaded: true } }));
    } catch (error) {
      setDocuments(prev => ({
        ...prev,
        [docType]: {
          ...prev[docType],
          uploading: false,
          uploaded:  false,
          error: error instanceof Error ? error.message : 'Upload failed',
        },
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.dbs_update_service) {
      setSubmitError('You must confirm you have subscribed to the DBS Update Service to continue.');
      return;
    }
    if (!formData.dbs_certificate_number?.trim()) {
      setSubmitError('Please enter your DBS certificate number.');
      return;
    }
    if (!formData.dbs_issue_date) {
      setSubmitError('Please enter your DBS issue date.');
      return;
    }
    if (!formData.dbs_surname_on_certificate?.trim()) {
      setSubmitError('Please enter the surname as it appears on your DBS certificate.');
      return;
    }

    // Documents are validated at final submission — staff can continue without
    // all uploads complete so they can fill out later steps and come back.
    const pendingDocs = Object.entries(documents)
      .filter(([, doc]) => !doc.uploaded)
      .map(([key]) => key);

    if (pendingDocs.length > 0) {
      setSubmitError(
        'Please upload all required documents before continuing. ' +
        'You can upload them now or use "Save Progress" and return later.'
      );
      return;
    }

    onNext(formData as StaffComplianceInput);
  };

  const documentLabels: Record<string, string> = {
    dbs_certificate:           'DBS Certificate',
    safeguarding_certificate:  'Safeguarding Certificate',
    paediatric_first_aid:      'Paediatric First Aid Certificate',
    right_to_work:             'Right to Work Document',
    qualification_certificate: 'Qualification Certificate',
  };

  const inputClass =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c653a0] focus:border-transparent';

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Compliance and Documents</h2>

      {submitError && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Cannot continue:</p>
          <p className="text-sm text-red-700 mt-1">{submitError}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* DBS Update Service */}
        <div className="border border-[#c653a0] rounded-lg overflow-hidden">
          <div className="bg-[#c653a0] px-6 py-3">
            <h3 className="font-bold text-white">DBS Update Service (Required)</h3>
          </div>
          <div className="bg-red-50 p-6">
          <p className="text-sm text-gray-700 mb-4">
            You must subscribe to the DBS Update Service before continuing. This allows us to
            verify your DBS status online at any time.
          </p>
          <a
            href="https://www.gov.uk/dbs-update-service"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#c653a0] text-white py-2 px-6 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity mb-4"
          >
            Sign up for DBS Update Service →
          </a>
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={formData.dbs_update_service}
              onChange={(e) => setFormData({ ...formData, dbs_update_service: e.target.checked })}
              className="mt-1 mr-3 flex-shrink-0"
            />
            <span className="text-sm text-gray-700">
              I confirm I have subscribed to the DBS Update Service and I <strong>consent</strong> for
              my DBS status to be verified by Stafferoo at any time. *
            </span>
          </label>
          </div>{/* end bg-red-50 */}
        </div>{/* end outer wrapper */}

        {/* DBS fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            DBS Certificate Number *
          </label>
          <input
            type="text"
            value={formData.dbs_certificate_number}
            onChange={(e) => setFormData({ ...formData, dbs_certificate_number: e.target.value })}
            className={inputClass}
            placeholder="e.g. 001234567890"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">DBS Issue Date *</label>
            <input
              type="date"
              value={formData.dbs_issue_date}
              onChange={(e) => setFormData({ ...formData, dbs_issue_date: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Surname on Certificate *
            </label>
            <input
              type="text"
              value={formData.dbs_surname_on_certificate}
              onChange={(e) =>
                setFormData({ ...formData, dbs_surname_on_certificate: e.target.value })
              }
              className={inputClass}
            />
          </div>
        </div>

        {/* Document uploads */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-2">Document Uploads</h3>
          <p className="text-sm text-gray-600 mb-6">
            Upload each document below. Accepted formats: PDF, JPG, PNG, WEBP — max 10 MB per file.
          </p>

          <div className="space-y-4">
            {Object.entries(documents).map(([key, doc]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                {/* Label */}
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  {documentLabels[key]} *
                </p>

                {/* Accepted document hints */}
                <ul className="mb-3 space-y-0.5">
                  {DOCUMENT_HINTS[key]?.map((hint, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                      <span className="mt-0.5 shrink-0 text-[#c653a0]">›</span>
                      {hint}
                    </li>
                  ))}
                </ul>

                {/* Upload control */}
                {!doc.uploaded && (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id={`file-${key}`}
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(key, file);
                      }}
                      disabled={doc.uploading}
                      className="hidden"
                    />
                    <label
                      htmlFor={`file-${key}`}
                      className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-opacity ${
                        doc.uploading
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#c653a0] text-white hover:opacity-90 cursor-pointer'
                      }`}
                    >
                      {doc.uploading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Uploading…
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Choose File
                        </>
                      )}
                    </label>
                    {doc.file && !doc.uploading && (
                      <span className="text-xs text-gray-500 truncate max-w-xs">{doc.file.name}</span>
                    )}
                  </div>
                )}

                {doc.uploaded && (
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Uploaded successfully</span>
                  </div>
                )}

                {doc.error && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <span>✕</span> {doc.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium self-start sm:self-auto"
        >
          ← Back
        </button>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <SaveProgressButton status={saveStatus} onClick={() => onSave(formData)} className="justify-center" />
          <button
            type="submit"
            className="w-full sm:w-auto bg-[#c653a0] text-white py-2 px-8 rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            Continue →
          </button>
        </div>
      </div>
    </form>
  );
}
