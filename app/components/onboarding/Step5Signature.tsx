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

export default function Step5Signature({ initialData, onSubmit, onBack, isSubmitting }: Step5SignatureProps) {
  const [signature, setSignature] = useState(initialData?.digital_signature_svg || '');
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!signature) {
      alert('Please provide your signature');
      return;
    }

    if (!agreed) {
      alert('You must agree to the declaration to continue');
      return;
    }

    onSubmit({ digital_signature_svg: signature });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Signature and Submit</h2>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Declaration</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>I declare that:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>All information provided in this application is true and accurate to the best of my knowledge</li>
              <li>I understand that providing false information may result in immediate termination</li>
              <li>I have subscribed to the DBS Update Service and authorize REC APP to check my DBS status</li>
              <li>I am not disqualified from working with children under any legislation</li>
              <li>I will notify REC APP immediately of any changes to my DBS status, health, or circumstances that may affect my suitability to work with children</li>
              <li>I have read and understood the safeguarding policies and procedures</li>
              <li>I consent to REC APP processing my personal data in accordance with GDPR regulations</li>
            </ul>
          </div>
        </div>

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

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 mr-3"
              required
            />
            <span className="text-sm text-gray-700">
              I agree to the declaration above and confirm that all information provided is accurate *
            </span>
          </label>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
          <p className="text-sm text-gray-700">
            Once you submit your application, our admin team will review your profile and documents. 
            You will receive an email notification once your application has been reviewed. This typically 
            takes 2-3 business days.
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !signature || !agreed}
          className="bg-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </form>
  );
}
