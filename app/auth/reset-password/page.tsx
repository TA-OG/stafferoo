'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabase';
import { logger } from '@/app/lib/logger';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Verify we have a session (user clicked the reset link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Invalid or expired reset link. Please request a new one.');
      }
      setSessionChecked(true);
    };
    checkSession();
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 12) return 'Password must be at least 12 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain a lowercase letter';
    if (!/\d/.test(pwd)) return 'Password must contain a number';
    if (!/[@$!%*?&]/.test(pwd)) return 'Password must contain a special character (@$!%*?&)';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const requestId = crypto.randomUUID();

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      logger.info('Password reset attempt', { requestId });

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        logger.error('Password reset failed', updateError, { requestId });
        setError(updateError.message);
        setLoading(false);
        return;
      }

      logger.info('Password reset successful', { requestId });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#bf5d9f' }}></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
            Set New Password
          </h1>
          <p className="text-gray-600">
            Enter your new password below.
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
                <p className="font-medium">Password updated successfully!</p>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Your password has been reset. You can now sign in with your new password.
              </p>
              <button
                onClick={() => router.push('/auth')}
                className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors"
                style={{ backgroundColor: '#bf5d9f' }}
              >
                Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={12}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#bf5d9f] focus:border-transparent"
                    placeholder="••••••••••••"
                  />
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <p>Password must have:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-1">
                      <li className={password.length >= 12 ? 'text-green-600' : ''}>At least 12 characters</li>
                      <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>One uppercase letter</li>
                      <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>One lowercase letter</li>
                      <li className={/\d/.test(password) ? 'text-green-600' : ''}>One number</li>
                      <li className={/[@$!%*?&]/.test(password) ? 'text-green-600' : ''}>One special character (@$!%*?&)</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#bf5d9f] focus:border-transparent"
                    placeholder="••••••••••••"
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
                  {loading ? 'Updating...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
