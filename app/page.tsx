import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              REC APP
            </h1>
            <p className="text-xl text-gray-600">
              Emergency Childcare Staffing Platform
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                For Staff
              </h2>
              <p className="text-gray-600 mb-6">
                Join our platform to find flexible childcare work opportunities in your area.
              </p>
              <Link
                href="/staff/onboarding"
                className="block w-full bg-blue-600 text-white text-center py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Onboarding
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                For Settings
              </h2>
              <p className="text-gray-600 mb-6">
                Find qualified emergency cover staff for your childcare setting within 2 hours.
              </p>
              <Link
                href="/settings/register"
                className="block w-full bg-indigo-600 text-white text-center py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Register Setting
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Platform Status
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">✓</div>
                <div className="text-sm text-gray-600">Database Connected</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">✓</div>
                <div className="text-sm text-gray-600">ID Verification Ready</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600 mb-2">○</div>
                <div className="text-sm text-gray-600">MVP Development</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
