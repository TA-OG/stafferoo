'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

interface LogoutButtonProps {
  variant?: 'default' | 'admin';
}

export default function LogoutButton({ variant = 'default' }: LogoutButtonProps) {
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  }

  if (variant === 'admin') {
    return (
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign Out
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
    >
      Sign out
    </button>
  );
}
