'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import NotificationBell from './NotificationBell';

// ── Breadcrumb types ──────────────────────────────────────────────────────────

interface Crumb {
  label: string;
  href?: string;
}

function getCrumbs(pathname: string): Crumb[] {
  // Admin — individual staff detail
  if (pathname.startsWith('/admin/staff/') && pathname.length > '/admin/staff/'.length) {
    return [
      { label: 'Home', href: '/' },
      { label: 'Admin' },
      { label: 'Staff Queue', href: '/admin/staff' },
      { label: 'Staff Detail' },
    ];
  }
  // Admin — staff queue
  if (pathname === '/admin/staff') {
    return [
      { label: 'Home', href: '/' },
      { label: 'Admin' },
      { label: 'Staff Queue' },
    ];
  }
  // Admin — settings queue
  if (pathname === '/admin/settings') {
    return [
      { label: 'Home', href: '/' },
      { label: 'Admin' },
      { label: 'Settings Queue' },
    ];
  }
  // Admin — postcodes
  if (pathname === '/admin/postcodes') {
    return [
      { label: 'Home', href: '/' },
      { label: 'Admin' },
      { label: 'Postcode Density' },
    ];
  }
  // Staff — onboarding (more specific, must come before /staff/dashboard)
  if (pathname === '/staff/onboarding') {
    return [
      { label: 'Home', href: '/' },
      { label: 'My Dashboard', href: '/staff/dashboard' },
      { label: 'Onboarding' },
    ];
  }
  // Staff — dashboard
  if (pathname === '/staff/dashboard') {
    return [
      { label: 'Home', href: '/' },
      { label: 'My Dashboard' },
    ];
  }
  // Settings — pending approval
  if (pathname === '/settings/pending') {
    return [
      { label: 'Home', href: '/' },
      { label: 'Pending Approval' },
    ];
  }
  // Fallback
  return [{ label: 'Home', href: '/' }];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PageHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const crumbs = getCrumbs(pathname);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <header className="w-full bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between text-sm sticky top-0 z-50">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 flex-wrap min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={crumb.label} className="flex items-center gap-1 text-sm">
            {i > 0 && (
              <span className="text-gray-300 select-none" aria-hidden="true">
                /
              </span>
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-gray-500 hover:text-[#bf5d9f] transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Login status */}
      {email && (
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <NotificationBell />
          <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[220px]">
            {email}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors whitespace-nowrap"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
