'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { logger } from '@/app/lib/logger';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const requestId = crypto.randomUUID();
    logger.info('Password reset requested', { requestId, email });

    try {
      // Lazy import supabase to avoid SSR/build-time initialization issues
      const { supabase } = await import('@/app/lib/supabase');
      
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
      });

      if (resetError) {
        logger.error('Password reset request failed', resetError, { requestId, email });
        setError(resetError.message);
        setLoading(false);
        return;
      }

      logger.info('Password reset email sent', { requestId, email });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/stafferoo-logo.png"
              alt="Stafferoo"
              width={300}
              height={113}
              priority
              className="h-auto w-auto max-w-xs mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-edensor), var(--font-geist-sans), sans-serif', color: '#1f2937' }}>
            Reset Your Password
          </h1>
          <p className="text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 border border-[rgba(180,156,220,0.2)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(191, 93, 159, 0.1)', border: '1px solid rgba(191, 93, 159, 0.3)', color: '#1f2937' }}>
                <p className="font-medium mb-1">Check your email</p>
                <p>We&apos;ve sent a password reset link to:</p>
                <p className="font-medium mt-1">{email}</p>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
              </p>
              <Link
                href="/auth"
                className="inline-block w-full py-3 px-6 rounded-lg font-semibold text-white text-center transition-colors"
                style={{ backgroundColor: '#bf5d9f' }}
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#bf5d9f] focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-lg font-semibold transition-colors"
                  style={{ 
                    backgroundColor: loading ? '#9ca3af' : '#bf5d9f',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = '#a84d87';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = '#bf5d9f';
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <Link
                href="/auth"
                className="text-sm font-medium"
                style={{ color: '#bf5d9f' }}
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
