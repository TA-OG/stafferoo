'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f8f0f5]">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <Image
            src="/stafferoo-logo.png"
            alt="Stafferoo"
            width={200}
            height={72}
            className="mx-auto mb-6"
          />
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Page not found
          </h2>
          <p className="text-gray-600">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors"
            style={{ backgroundColor: '#bf5d9f' }}
          >
            Go home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="block w-full py-3 px-6 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 transition-colors hover:border-gray-300"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
