'use client';

import { useState } from 'react';
import IDVerification from '@/app/components/IDVerification';

export default function StaffOnboarding() {
  const [step, setStep] = useState(1);
  const [staffId, setStaffId] = useState('');

  // For demo purposes, generate a test UUID
  // In production, this would come from Supabase Auth after user signs up
  const handleStartDemo = () => {
    const demoId = crypto.randomUUID();
    setStaffId(demoId);
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {step} of 5
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round((step / 5) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to REC APP
              </h1>
              <p className="text-gray-600 mb-8">
                Complete your onboarding to start accepting childcare assignments.
                This process takes about 10 minutes.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">
                  What you will need:
                </h3>
                <ul className="text-left space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Photo ID (passport, driving licence, or national ID card)
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    DBS certificate number and issue date
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Qualification certificates (Level 2 or Level 3)
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Paediatric First Aid certificate
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Professional references from previous childcare settings
                  </li>
                </ul>
              </div>

              <button
                onClick={handleStartDemo}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Onboarding
              </button>

              <p className="text-sm text-gray-500 mt-4">
                Note: This is a demo. In production, you would sign up first.
              </p>
            </div>
          )}

          {/* Step 2: ID Verification */}
          {step === 2 && (
            <div>
              <IDVerification
                staffId={staffId}
                onVerificationComplete={(data) => {
                  console.log('Verification complete:', data);
                  if (data.status === 'Approved') {
                    setTimeout(() => setStep(3), 2000);
                  }
                }}
              />

              <div className="mt-8 pt-8 border-t border-gray-200">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ID Verification Complete
              </h2>
              <p className="text-gray-600 mb-8">
                Your identity has been verified successfully. Next steps would include
                uploading your DBS certificate, qualifications, and completing your profile.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <p className="text-sm text-gray-700">
                  <strong>Demo Complete:</strong> The ID verification integration is working correctly.
                  In the full app, you would continue with Steps 3-5 to complete onboarding.
                </p>
              </div>

              <button
                onClick={() => {
                  setStep(1);
                  setStaffId('');
                }}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Over
              </button>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            Development Note
          </h3>
          <p className="text-sm text-gray-700">
            This is a working demo of the ID verification integration. The full onboarding
            flow will include account creation, profile details, document uploads, references,
            and final verification by admin staff.
          </p>
          {staffId && (
            <p className="text-xs text-gray-500 mt-2 font-mono">
              Demo Staff ID: {staffId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
