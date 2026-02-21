'use client';

interface Step1AccountStatusProps {
  userEmail: string;
  onNext: () => void;
}

export default function Step1AccountStatus({ userEmail, onNext }: Step1AccountStatusProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Status</h2>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <svg
            className="w-6 h-6 text-green-600 mt-0.5 mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Account Verified</h3>
            <p className="text-sm text-gray-700">
              You are signed in as: <span className="font-medium">{userEmail}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">What you will need:</h3>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-[#c653a0] mr-2 mt-0.5">•</span>
            <span>National Insurance Number and date of birth</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#c653a0] mr-2 mt-0.5">•</span>
            <span>Full address and contact details</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#c653a0] mr-2 mt-0.5">•</span>
            <span>DBS Update Service subscription (required)</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#c653a0] mr-2 mt-0.5">•</span>
            <span>DBS certificate number and issue date</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#c653a0] mr-2 mt-0.5">•</span>
            <span>Document uploads: DBS certificate, safeguarding certificate, paediatric first aid, right to work, qualification certificate</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#c653a0] mr-2 mt-0.5">•</span>
            <span>Emergency contact details and GP information</span>
          </li>
        </ul>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-[#c653a0] text-white py-3 px-6 rounded-lg font-bold hover:opacity-90 transition-opacity"
      >
        Continue to Profile Details
      </button>
    </div>
  );
}
