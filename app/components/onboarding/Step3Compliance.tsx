'use client';

import { useState } from 'react';
import { StaffComplianceInput } from '@/app/lib/validations/staff';

interface Step3ComplianceProps {
  initialData?: Partial<StaffComplianceInput>;
  onNext: (data: StaffComplianceInput) => void;
  onBack: () => void;
}

interface DocumentUpload {
  doc_type: string;
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  error: string | null;
}

export default function Step3Compliance({ initialData, onNext, onBack }: Step3ComplianceProps) {
  const [formData, setFormData] = useState<Partial<StaffComplianceInput>>({
    dbs_update_service: initialData?.dbs_update_service || false,
    dbs_certificate_number: initialData?.dbs_certificate_number || '',
    dbs_issue_date: initialData?.dbs_issue_date || '',
    dbs_surname_on_certificate: initialData?.dbs_surname_on_certificate || '',
  });

  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>({
    dbs_certificate: { doc_type: 'dbs_certificate', file: null, uploading: false, uploaded: false, error: null },
    safeguarding_certificate: { doc_type: 'safeguarding_certificate', file: null, uploading: false, uploaded: false, error: null },
    paediatric_first_aid: { doc_type: 'paediatric_first_aid', file: null, uploading: false, uploaded: false, error: null },
    right_to_work: { doc_type: 'right_to_work', file: null, uploading: false, uploaded: false, error: null },
    qualification_certificate: { doc_type: 'qualification_certificate', file: null, uploading: false, uploaded: false, error: null },
  });

  const handleFileSelect = async (docType: string, file: File) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: { ...prev[docType], file, uploading: true, error: null },
    }));

    try {
      const createUploadResponse = await fetch('/api/staff/documents/create-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_type: docType,
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        }),
      });

      const createUploadResult = await createUploadResponse.json();

      if (!createUploadResult.ok) {
        throw new Error(createUploadResult.error.message);
      }

      const { upload_url, storage_path } = createUploadResult.data;

      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      const confirmResponse = await fetch('/api/staff/documents/confirm-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_type: docType,
          storage_path,
          original_filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        }),
      });

      const confirmResult = await confirmResponse.json();

      if (!confirmResult.ok) {
        throw new Error(confirmResult.error.message);
      }

      setDocuments(prev => ({
        ...prev,
        [docType]: { ...prev[docType], uploading: false, uploaded: true },
      }));
    } catch (error) {
      setDocuments(prev => ({
        ...prev,
        [docType]: {
          ...prev[docType],
          uploading: false,
          uploaded: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        },
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.dbs_update_service) {
      alert('You must subscribe to the DBS Update Service to continue');
      return;
    }

    const allDocsUploaded = Object.values(documents).every(doc => doc.uploaded);
    if (!allDocsUploaded) {
      alert('Please upload all required documents before continuing');
      return;
    }

    onNext(formData as StaffComplianceInput);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Compliance and Documents</h2>

      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">DBS Update Service (Required)</h3>
          <p className="text-sm text-gray-700 mb-4">
            You must subscribe to the DBS Update Service before continuing. This allows us to check your DBS status online.
          </p>
          
          <a
            href="https://www.gov.uk/dbs-update-service"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mb-4"
          >
            Sign up for DBS Update Service →
          </a>

          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={formData.dbs_update_service}
              onChange={(e) => setFormData({ ...formData, dbs_update_service: e.target.checked })}
              className="mt-1 mr-3"
              required
            />
            <span className="text-sm text-gray-700">
              I confirm that I have subscribed to the DBS Update Service *
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            DBS Certificate Number *
          </label>
          <input
            type="text"
            value={formData.dbs_certificate_number}
            onChange={(e) => setFormData({ ...formData, dbs_certificate_number: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DBS Issue Date *
            </label>
            <input
              type="date"
              value={formData.dbs_issue_date}
              onChange={(e) => setFormData({ ...formData, dbs_issue_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Surname on Certificate *
            </label>
            <input
              type="text"
              value={formData.dbs_surname_on_certificate}
              onChange={(e) => setFormData({ ...formData, dbs_surname_on_certificate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Document Uploads</h3>
          <p className="text-sm text-gray-600 mb-6">
            Please upload the following documents (PDF, JPG, PNG, or WEBP, max 10MB each)
          </p>

          <div className="space-y-4">
            {Object.entries(documents).map(([key, doc]) => (
              <div key={key} className="border border-gray-300 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} *
                </label>
                
                {!doc.uploaded && (
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(key, file);
                    }}
                    disabled={doc.uploading}
                    className="w-full text-sm"
                  />
                )}

                {doc.uploading && (
                  <p className="text-sm text-blue-600">Uploading...</p>
                )}

                {doc.uploaded && (
                  <p className="text-sm text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Uploaded successfully
                  </p>
                )}

                {doc.error && (
                  <p className="text-sm text-red-600">{doc.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </form>
  );
}
