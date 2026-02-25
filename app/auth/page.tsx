'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const initialRole = searchParams.get('role') as 'staff' | 'setting' | null;
  const initialMode = initialRole ? 'signup' : 'signin';

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [role, setRole] = useState<'staff' | 'setting' | null>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // If a specific redirectTo was given (e.g. from a protected page), honour it.
        // Otherwise route by role so the user lands on their dashboard, not the homepage.
        if (redirectTo !== '/') {
          router.push(redirectTo);
          return;
        }
        const userRole = data.user.user_metadata?.role as string | undefined;
        if (userRole === 'staff') {
          router.push('/staff/dashboard');
        } else if (userRole === 'setting') {
          router.push('/settings/dashboard');
        } else {
          // No role set — likely an admin account; the admin page enforces its own access check.
          router.push('/admin');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Build the post-confirmation redirect URL for staff so that clicking
      // the confirmation email lands on the callback page which then forwards
      // to onboarding once the session is established.
      const emailRedirectTo =
        role === 'staff'
          ? `${window.location.origin}/auth/callback?next=/staff/onboarding`
          : undefined;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...(role ? { data: { role } } : {}),
          ...(emailRedirectTo ? { emailRedirectTo } : {}),
        },
      });

      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (msg.includes('rate limit') || msg.includes('email rate')) {
          setError('Too many sign-up attempts. Please wait a few minutes and try again.');
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        if (data.user.identities && data.user.identities.length === 0) {
          setError('An account with this email already exists. Please sign in instead.');
          setMode('signin');
          setLoading(false);
          return;
        }

        if (role === 'staff') {
          // Always go to the check-email page — Supabase will send a
          // confirmation link, and the callback page handles onboarding redirect.
          router.push(`/auth/check-email?email=${encodeURIComponent(email)}`);
        } else if (role === 'setting') {
          router.push('/settings/register');
        } else {
          setMessage('Account created successfully! You can now sign in.');
          setMode('signin');
        }
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/brand/stafferoo-logo.png"
              alt="Stafferoo"
              width={300}
              height={113}
              priority
              className="h-auto w-auto max-w-xs mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-edensor), var(--font-geist-sans), sans-serif', color: '#1f2937' }}>
            {mode === 'signin'
              ? 'Welcome Back'
              : role === 'staff'
                ? 'Sign Up as Staff'
                : role === 'setting'
                  ? 'Sign Up as a Business'
                  : 'Create Account'}
          </h1>
          <p className="text-gray-600">
            {mode === 'signin'
              ? 'Sign in to continue to your account'
              : role === 'staff'
                ? 'Create your account to start onboarding'
                : role === 'setting'
                  ? 'Create your account to register your business'
                  : 'Sign up to get started with Stafferoo'}
          </p>
        </div>

        {mode === 'signup' && !initialRole && (
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('staff')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold border-2 transition-colors ${
                role === 'staff'
                  ? 'border-[#bf5d9f] bg-[#bf5d9f] text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-[#bf5d9f]'
              }`}
            >
              I&rsquo;m Staff
            </button>
            <button
              type="button"
              onClick={() => setRole('setting')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold border-2 transition-colors ${
                role === 'setting'
                  ? 'border-[#b49cdc] bg-[#b49cdc] text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-[#b49cdc]'
              }`}
            >
              I&rsquo;m a Business
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8 border border-[rgba(180,156,220,0.2)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(191, 93, 159, 0.1)', border: '1px solid rgba(191, 93, 159, 0.3)', color: '#1f2937' }}>
              {message}
            </div>
          )}

          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
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
                  className="w-full px-4 py-2 rounded-lg"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-lg"
                  placeholder="••••••••"
                />
                {mode === 'signup' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 6 characters
                  </p>
                )}
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
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                if (mode === 'signup') setRole(null);
                setError(null);
                setMessage(null);
              }}
              className="text-sm font-medium"
              style={{ color: '#bf5d9f' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#a84d87'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#bf5d9f'}
            >
              {mode === 'signin' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#bf5d9f' }}></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
