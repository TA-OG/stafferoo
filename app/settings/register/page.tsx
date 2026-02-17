export default function SettingsRegister() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Register Your Setting
          </h1>
          <p className="text-gray-600 mb-8">
            Settings registration coming soon. This will allow childcare settings
            to register and start booking emergency staff.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              What you will need:
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                Ofsted registration number
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                Setting address and contact details
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                Payment method for subscription
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                Insurance documentation
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
