export default function SettingsPending() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Registration Submitted
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for registering your childcare setting. Your application is currently under review by our admin team.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              What happens next?
            </h3>
            <ul className="text-left space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">1.</span>
                Our team will verify your Ofsted registration
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">2.</span>
                We will review your setting details
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">3.</span>
                You will receive an email notification once approved
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">4.</span>
                After approval, you can start posting jobs
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-500">
            This typically takes 1-2 business days. If you have any questions, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
