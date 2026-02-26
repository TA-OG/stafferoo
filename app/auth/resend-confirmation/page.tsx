'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
function ResendConfirmationForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Lazy import supabase to avoid SSR/build-time initialization issues
    const { supabase } = await import('@/app/lib/supabase');
    
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/staff/onboarding`,
      },
    });

    setLoading(false);

    if (resendError) {
      const msg = resendError.message.toLowerCase();
      if (msg.includes('rate limit') || msg.includes('email rate')) {
        setError('Too many attempts. Please wait a few minutes before trying again.');
      } else {
        setError(resendError.message);
      }
      return;
    }

    setSent(true);
  }

  if (sent) {
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
              Email sent
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed mb-2">
              We&apos;ve sent a new confirmation link to:
            </p>
            <p className="font-semibold text-gray-900 text-sm mb-6 break-all">{email}</p>
            <p className="text-gray-500 text-sm">
              Click the link in the email to continue your onboarding.
            </p>
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

  return (
    <div className="min-h-screen bg-[#f8f0f5] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/brand/stafferoo-logo.png"
              alt="Stafferoo"
              width={200}
              height={76}
              priority
              className="h-auto w-auto mx-auto"
            />
          </Link>
          <h1
            className="text-2xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: 'var(--font-edensor), var(--font-geist-sans), sans-serif' }}
          >
            Resend confirmation email
          </h1>
          <p className="text-gray-600 text-sm">
            Enter your email address and we&apos;ll send you a new confirmation link.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[rgba(180,156,220,0.2)] p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg font-semibold text-sm transition-colors"
              style={{
                backgroundColor: loading ? '#9ca3af' : '#bf5d9f',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Sending…' : 'Send confirmation email'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-400">
            Already confirmed?{' '}
            <Link href="/auth" className="font-medium text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
          </p>
          <p className="text-xs text-gray-400">
            Need to create an account?{' '}
            <Link href="/auth?role=staff" className="font-medium text-gray-600 hover:text-gray-900">
              Sign up as Staff
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResendConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f0f5] flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2"
          style={{ borderColor: '#bf5d9f' }}
        />
      </div>
    }>
      <ResendConfirmationForm />
    </Suspense>
  );
}
