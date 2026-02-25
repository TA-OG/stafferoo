'use client';

import { useState } from 'react';
import SignaturePad from '@/app/components/SignaturePad';
import { StaffSignatureInput } from '@/app/lib/validations/staff';

interface Step5SignatureProps {
  initialData?: Partial<StaffSignatureInput>;
  onSubmit: (data: StaffSignatureInput) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function Step5Signature({
  initialData,
  onSubmit,
  onBack,
  isSubmitting,
}: Step5SignatureProps) {
  const [signature, setSignature] = useState(initialData?.digital_signature_svg ?? '');
  const [agreed, setAgreed] = useState(false);
  const [medicalConsent, setMedicalConsent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!signature) {
      setFormError('Please provide your signature in the box below before submitting.');
      return;
    }

    if (!agreed) {
      setFormError('You must agree to the declaration above to submit your application.');
      return;
    }

    if (!medicalConsent) {
      setFormError('You must confirm the medical declaration to submit your application.');
      return;
    }

    onSubmit({ digital_signature_svg: signature });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Signature and Submit</h2>

      {formError && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Cannot submit:</p>
          <p className="text-sm text-red-700 mt-1">{formError}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Declaration */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Declaration</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>By signing below I confirm and declare that:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                All information provided in this application is true, complete, and accurate to the
                best of my knowledge. I understand that any false or misleading information may lead
                to the withdrawal of any offer or termination of engagement.
              </li>
              <li>
                I am not disqualified from working with children under the Childcare Act 2006 or
                any other relevant legislation, and I have no undisclosed orders, restrictions, or
                conditions that would prevent me from doing so.
              </li>
              <li>
                I have subscribed to the DBS Update Service and I authorise Stafferoo to carry out
                status checks on my certificate at any time during my engagement.
              </li>
              <li>
                I will notify Stafferoo immediately of any changes to my DBS status, criminal
                record, health, or any other circumstance that may affect my suitability to work
                with children or vulnerable persons.
              </li>
              <li>
                I have read, understood, and agree to comply with Stafferoo&apos;s safeguarding
                policies and procedures, and I understand my duty to report any safeguarding
                concerns without delay.
              </li>
              <li>
                I consent to Stafferoo processing my personal data — including sensitive categories
                of data such as health information and criminal record data — for the purposes of
                staff recruitment, vetting, and compliance, in accordance with UK GDPR and the Data
                Protection Act 2018.
              </li>
              <li>
                I understand that Stafferoo may share relevant information with Ofsted-registered
                Early Years Childcare Businesses and other regulatory bodies where required by law or safeguarding
                obligations.
              </li>
            </ul>
          </div>
        </div>

        {/* Medical declaration */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">Medical Declaration *</p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={medicalConsent}
              onChange={(e) => setMedicalConsent(e.target.checked)}
              className="mt-1 shrink-0"
              required
            />
            <span className="text-sm text-gray-700">
              I confirm that I am medically fit to work with children and young people. I declare
              that I have disclosed any health conditions, disabilities, or medication that may
              affect my ability to carry out the role safely. I understand that I must notify
              Stafferoo if my health changes in a way that could affect my fitness to work.
            </span>
          </label>
        </div>

        {/* Signature pad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Digital Signature *
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Please sign in the box below using your mouse or touchscreen
          </p>
          <SignaturePad
            onSignatureComplete={setSignature}
            initialSignature={signature}
          />
        </div>

        {/* Agreement checkbox */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 mr-3"
              required
            />
            <span className="text-sm font-bold text-gray-900">
              I agree to the declaration above and confirm that all information provided is accurate *
            </span>
          </label>
        </div>

        {/* What happens next */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
          <p className="text-sm text-gray-700">
            Once you submit your application, our admin team will review your profile and documents.
            You will receive an email notification once your application has been reviewed. This
            typically takes 2–3 business days.
          </p>
        </div>
      </div>

      {/* Action row */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50 self-start sm:self-auto"
        >
          ← Back
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !signature || !agreed || !medicalConsent}
          className="w-full sm:w-auto bg-[#c653a0] text-white py-3 px-8 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting…
            </span>
          ) : (
            'Submit Application'
          )}
        </button>
      </div>
    </form>
  );
}
