'use client';

/**
 * LoginGate — wraps any protected page.
 *
 * • While auth state resolves: shows a branded spinner.
 * • If the user is unauthenticated: shows a centred login prompt with a
 *   button linking to /auth?redirectTo=<current pathname>.  After a
 *   successful login the auth page returns the user here automatically.
 * • If authenticated: renders children normally.
 *
 * Usage:
 *   export default function MyProtectedPage() {
 *     return <LoginGate><MyPageContent /></LoginGate>;
 *   }
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabase';

type AuthStatus = 'loading' | 'authed' | 'unauthed';

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    // Resolve initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setStatus(user ? 'authed' : 'unauthed');
    });

    // Keep in sync when the session changes in this tab (or another tab via
    // storage events), e.g. sign-out, token refresh, or sign-in from elsewhere.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session?.user ? 'authed' : 'unauthed');
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f8f0f5] flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: '#bf5d9f' }}
          />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  // ── Unauthenticated ───────────────────────────────────────────────────────

  if (status === 'unauthed') {
    return (
      <div className="min-h-screen bg-[#f8f0f5] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-[rgba(180,156,220,0.42)] shadow-lg p-8 max-w-sm w-full text-center">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/stafferoo-logo.png"
              alt="Stafferoo"
              width={160}
              height={48}
              priority
              className="object-contain mx-auto"
            />
          </Link>

          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Sign in to continue
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            You need to be logged in to view this page.
          </p>

          <Link
            href={`/auth?redirectTo=${encodeURIComponent(pathname)}`}
            className="block w-full bg-[#bf5d9f] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
          >
            Log in
          </Link>

          <Link
            href="/"
            className="block mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Authenticated ─────────────────────────────────────────────────────────

  return <>{children}</>;
}
