'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[Admin Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <Link href="/admin" className="text-[#bf5d9f] hover:underline text-sm">
            ← Back to Admin
          </Link>
        </div>
      </header>

      {/* Error Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Admin Error
          </h2>
          <p className="text-gray-600 mb-4">
            An error occurred while loading this admin page.
          </p>

          {error.digest && (
            <code className="block bg-gray-100 rounded px-3 py-2 text-xs text-gray-600 mb-6">
              Error ID: {error.digest}
            </code>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="py-2 px-4 rounded-lg font-semibold text-white bg-[#bf5d9f] hover:bg-[#a84d87] transition-colors"
            >
              Try again
            </button>

            <Link
              href="/admin"
              className="py-2 px-4 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
