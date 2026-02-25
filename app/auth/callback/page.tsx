'use client';

/**
 * Auth callback landing page.
 *
 * Supabase redirects here after email confirmation, appending auth tokens
 * to the URL hash (implicit flow). The Supabase JS client picks them up
 * automatically; we just wait for the SIGNED_IN event then forward the user
 * to the `?next=` destination (e.g. /staff/onboarding).
 */

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Supabase fires SIGNED_IN once it has processed the hash fragment.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        subscription.unsubscribe();
        router.replace(next);
      }
    });

    // If there is already an active session (e.g. user re-visits the link)
    // forward immediately.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        router.replace(next);
      }
    });

    // Safety timeout — if no session is established after 8 s, send to /auth.
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      setTimedOut(true);
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (timedOut) {
    return (
      <div className="min-h-screen bg-[#f8f0f5] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-sm text-center">
          <p className="text-red-700 font-medium mb-4">
            The confirmation link may have expired or already been used.
          </p>
          <a
            href="/auth"
            className="text-sm font-semibold"
            style={{ color: '#bf5d9f' }}
          >
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f0f5] flex items-center justify-center">
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
          style={{ borderColor: '#bf5d9f' }}
        />
        <p className="text-gray-600 text-sm">Confirming your account…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f0f5] flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: '#bf5d9f' }}
        />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
