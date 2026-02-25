'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error tracking service (Sentry, etc.)
    console.error('[Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f8f0f5]">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-4">
            We apologize for the inconvenience. Our team has been notified.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors"
            style={{ backgroundColor: '#bf5d9f' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#a84d87';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#bf5d9f';
            }}
          >
            Try again
          </button>

          <Link
            href="/"
            className="block w-full py-3 px-6 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 transition-colors hover:border-[#bf5d9f] hover:text-[#bf5d9f]"
          >
            Go home
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            Need help?{' '}
            <a
              href="mailto:support@stafferoo.app"
              className="text-[#bf5d9f] hover:underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
