'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SettingProfile {
  setting_name: string | null;
  ofsted_urn: string | null;
  ofsted_rating: string | null;
  email: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postcode: string | null;
  has_parking: boolean | null;
  number_of_children: number | null;
  team_size: number | null;
  operation_hours_start: string | null;
  operation_hours_end: string | null;
  verification_status: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  created_at: string | null;
}

interface DashboardData {
  profile: SettingProfile | null;
}

interface EditableFields {
  phone: string;
  operation_hours_start: string;
  operation_hours_end: string;
  number_of_children: string;
  team_size: string;
  has_parking: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatAddress(profile: SettingProfile): string {
  return [
    profile.address_line_1,
    profile.address_line_2,
    profile.city,
    profile.postcode,
  ]
    .filter(Boolean)
    .join(', ');
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusCard({ profile }: { profile: SettingProfile }) {
  const status = profile.verification_status ?? 'pending';

  const configs: Record<
    string,
    {
      bg: string;
      border: string;
      icon: string;
      heading: string;
      body: string;
      cta?: { label: string; href: string };
    }
  > = {
    pending: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: '⏳',
      heading: 'Application under review',
      body: "Our team is verifying your Ofsted registration. You'll receive an email once approved — this typically takes 1–2 working days.",
    },
    approved: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '✅',
      heading: "You're approved!",
      body: 'Your setting is live on Stafferoo. You can now post jobs and connect with qualified staff.',
    },
    rejected: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '✕',
      heading: 'Application declined',
      body: 'Unfortunately your application was unsuccessful. Please contact support for more information.',
      cta: { label: 'Contact support', href: 'mailto:support@stafferoo.app' },
    },
  };

  const cfg = configs[status] ?? configs.pending;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-5`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">
          {cfg.icon}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 text-base">{cfg.heading}</h2>
          <p className="mt-1 text-sm text-gray-700">{cfg.body}</p>

          {profile.verification_notes && status === 'rejected' && (
            <div className="mt-3 rounded-lg bg-white border border-gray-200 p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Reason
              </p>
              <p className="text-sm text-gray-800">{profile.verification_notes}</p>
            </div>
          )}

          {profile.verified_at && status === 'approved' && (
            <p className="mt-3 text-xs text-gray-500">
              Approved {formatDate(profile.verified_at)}
            </p>
          )}

          {profile.created_at && (
            <p className="mt-1 text-xs text-gray-500">
              Registered {formatDate(profile.created_at)}
            </p>
          )}

          {cfg.cta && (
            <div className="mt-4">
              <a
                href={cfg.cta.href}
                className="inline-block text-sm font-semibold bg-[#bf5d9f] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                {cfg.cta.label}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3">
      <span className="text-xs font-medium text-gray-500 sm:w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value ?? '—'}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Editable form state
  const [fields, setFields] = useState<EditableFields>({
    phone: '',
    operation_hours_start: '',
    operation_hours_end: '',
    number_of_children: '',
    team_size: '',
    has_parking: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user) {
        router.push('/auth?redirectTo=/settings/dashboard');
        return;
      }

      if (cancelled) return;
      setUserEmail(user.email ?? '');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch('/api/settings/dashboard', {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });

      const json = (await res.json()) as { ok: boolean; data?: DashboardData };

      if (cancelled) return;

      if (!json.ok) {
        setError('Failed to load dashboard. Please refresh.');
        setLoading(false);
        return;
      }

      const d = json.data!;
      setData(d);

      if (d.profile) {
        setFields({
          phone: d.profile.phone ?? '',
          operation_hours_start: d.profile.operation_hours_start ?? '',
          operation_hours_end: d.profile.operation_hours_end ?? '',
          number_of_children: d.profile.number_of_children != null ? String(d.profile.number_of_children) : '',
          team_size: d.profile.team_size != null ? String(d.profile.team_size) : '',
          has_parking: d.profile.has_parking ?? false,
        });
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function getToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.push('/auth?reason=session_expired');
      return null;
    }
    return session.access_token;
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    const token = await getToken();
    if (!token) return;

    const body = {
      phone: fields.phone,
      operation_hours_start: fields.operation_hours_start || undefined,
      operation_hours_end: fields.operation_hours_end || undefined,
      number_of_children: fields.number_of_children ? Number(fields.number_of_children) : null,
      team_size: fields.team_size ? Number(fields.team_size) : null,
      has_parking: fields.has_parking,
    };

    const res = await fetch('/api/settings/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    setSaving(false);

    if (!json.ok) {
      const fieldErrors = json.error?.details?.fieldErrors;
      if (fieldErrors) {
        const msgs = Object.values(fieldErrors).flat().join(', ');
        setSaveError(msgs);
      } else {
        setSaveError(json.error?.message ?? 'Failed to save changes');
      }
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f0f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bf5d9f] mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f0f5] flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-red-200 p-6 max-w-md text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              setReloadKey((k) => k + 1);
            }}
            className="mt-4 text-sm font-semibold text-[#bf5d9f] hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const profile = data?.profile;

  return (
    <div className="min-h-screen bg-[#f8f0f5] py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Image
            src="/brand/stafferoo-logo.png"
            alt="Stafferoo"
            width={120}
            height={45}
            className="object-contain"
            priority
          />
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[200px]">
              {userEmail}
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          {profile?.setting_name ?? 'My Dashboard'}
        </h1>

        {/* Verification status */}
        {profile ? (
          <StatusCard profile={profile} />
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm text-gray-700">
              No setting profile found.{' '}
              <a href="/settings/register" className="font-semibold text-[#bf5d9f] hover:underline">
                Register your setting
              </a>
            </p>
          </div>
        )}

        {/* Setting details (read-only) */}
        {profile && (
          <div className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-5">
            <h2 className="font-bold text-gray-900 text-sm mb-4">Setting details</h2>
            <div className="space-y-3">
              <InfoRow label="Ofsted URN" value={profile.ofsted_urn} />
              <InfoRow label="Ofsted rating" value={profile.ofsted_rating} />
              <InfoRow label="Address" value={formatAddress(profile)} />
            </div>
            <p className="mt-4 text-xs text-gray-400">
              To update your Ofsted URN or address, please contact{' '}
              <a
                href="mailto:support@stafferoo.app"
                className="text-[#bf5d9f] hover:underline"
              >
                support@stafferoo.app
              </a>
              .
            </p>
          </div>
        )}

        {/* Editable operational details */}
        {profile && (
          <div className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-5">
            <h2 className="font-bold text-gray-900 text-sm mb-4">Operational details</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={fields.phone}
                  onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
                  placeholder="e.g. 01234 567890"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Opening time
                  </label>
                  <input
                    type="time"
                    value={fields.operation_hours_start}
                    onChange={(e) =>
                      setFields((f) => ({ ...f, operation_hours_start: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Closing time
                  </label>
                  <input
                    type="time"
                    value={fields.operation_hours_end}
                    onChange={(e) =>
                      setFields((f) => ({ ...f, operation_hours_end: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Number of children on roll
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={fields.number_of_children}
                    onChange={(e) =>
                      setFields((f) => ({ ...f, number_of_children: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
                    placeholder="e.g. 30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Team size
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={fields.team_size}
                    onChange={(e) =>
                      setFields((f) => ({ ...f, team_size: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
                    placeholder="e.g. 8"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={fields.has_parking}
                    onChange={(e) =>
                      setFields((f) => ({ ...f, has_parking: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-[#bf5d9f] focus:ring-[#b49cdc]"
                  />
                  <span className="text-sm font-medium text-gray-800">Parking available on site</span>
                </label>
              </div>

              {saveError && (
                <p className="text-sm text-red-600 font-medium">{saveError}</p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#bf5d9f] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                {saved && (
                  <span className="text-sm text-green-600 font-medium">✓ Saved</span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-center gap-6 pb-4 text-xs text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">
            Home
          </Link>
          <a
            href="mailto:support@stafferoo.app"
            className="hover:text-gray-600 transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </div>
  );
}
