'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? 'your inbox';

  return (
    <div className="min-h-screen bg-[#f8f0f5] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-block mb-8">
          <Image
            src="/brand/stafferoo-logo.png"
            alt="Stafferoo"
            width={200}
            height={76}
            priority
            className="h-auto w-auto mx-auto"
          />
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-[rgba(180,156,220,0.2)] p-8">
          <div className="text-5xl mb-5" aria-hidden="true">📬</div>

          <h1
            className="text-2xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: 'var(--font-edensor), var(--font-geist-sans), sans-serif' }}
          >
            Please confirm your email
          </h1>

          <p className="text-gray-600 text-sm leading-relaxed mb-2">
            We&apos;ve sent a confirmation link to:
          </p>
          <p className="font-semibold text-gray-900 text-sm mb-6 break-all">{email}</p>

          <p className="text-gray-500 text-sm leading-relaxed">
            Click the link in the email to continue setting up your account and start your onboarding.
            The link will expire after 24 hours.
          </p>

          <div className="mt-8 pt-6 border-t border-gray-100 space-y-3 text-sm text-gray-500">
            <p>
              Didn&apos;t receive it? Check your spam folder, or{' '}
              <Link
                href={`/auth/resend-confirmation?email=${encodeURIComponent(email)}`}
                className="font-semibold"
                style={{ color: '#bf5d9f' }}
              >
                resend the confirmation email
              </Link>
              .
            </p>
            <p>
              Wrong email?{' '}
              <Link
                href="/auth?role=staff"
                className="font-semibold"
                style={{ color: '#bf5d9f' }}
              >
                Sign up again
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Already confirmed?{' '}
          <Link href="/auth" className="font-medium text-gray-600 hover:text-gray-900">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f0f5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#bf5d9f' }} />
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  );
}
