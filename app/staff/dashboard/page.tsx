'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardProfile {
  full_name: string | null;
  dbs_issue_date: string | null;
  travel_radius_miles: number | null;
  transport_mode: string | null;
  years_experience: number | null;
  qualification_level: string | null;
  qualification_name: string | null;
  verification_status: string | null;
  submitted_at: string | null;
}

interface Verification {
  status: string;
  rejection_reason: string | null;
  last_reviewed_at: string | null;
}

interface NotificationPrefs {
  email_on: boolean;
  sms_on: boolean;
  browser_on: boolean;
}

interface UnavailabilityBlock {
  id: string;
  starts_on: string;
  ends_on: string;
  note: string | null;
}

interface DashboardData {
  profile: DashboardProfile | null;
  verification: Verification;
  notificationPrefs: NotificationPrefs;
  unavailability: UnavailabilityBlock[];
  jobsCount: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function dbsExpiryInfo(dbsIssueDate: string | null): {
  label: string;
  colour: 'green' | 'amber' | 'red' | 'gray';
} {
  if (!dbsIssueDate) return { label: 'Not yet provided', colour: 'gray' };
  const issued = new Date(dbsIssueDate);
  const expiry = new Date(issued);
  expiry.setFullYear(expiry.getFullYear() + 3);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msRemaining = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  if (daysRemaining <= 0)
    return { label: 'Expired', colour: 'red' };
  if (daysRemaining <= 30)
    return { label: `${daysRemaining}d until expiry`, colour: 'red' };
  if (daysRemaining <= 90)
    return { label: `${daysRemaining}d until expiry`, colour: 'amber' };
  return { label: `${daysRemaining}d until expiry`, colour: 'green' };
}

const TRANSPORT_LABELS: Record<string, string> = {
  car: 'Car',
  public_transport: 'Public transport',
  bicycle: 'Bicycle',
  walking: 'Walking',
};

const QUAL_LABELS: Record<string, string> = {
  level_2: 'Level 2',
  level_3: 'Level 3',
  level_4_plus: 'Level 4+',
  unqualified: 'Unqualified',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusCard({
  verification,
  submittedAt,
}: {
  verification: Verification;
  submittedAt: string | null;
}) {
  const configs: Record<
    string,
    { bg: string; border: string; icon: string; heading: string; body: string; cta?: { label: string; href: string } }
  > = {
    incomplete: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: '📋',
      heading: 'Application not yet submitted',
      body: 'Complete your onboarding to start receiving job alerts.',
      cta: { label: 'Continue onboarding', href: '/staff/onboarding' },
    },
    pending_review: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: '⏳',
      heading: 'Under review',
      body: "We're checking your documents and references. You'll hear from us within 2–3 working days.",
    },
    verified: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '✅',
      heading: "You're approved!",
      body: "Your profile is live. We'll send you job alerts that match your preferences.",
    },
    rejected: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '✕',
      heading: 'Application declined',
      body: 'Unfortunately your application was unsuccessful.',
      cta: { label: 'Contact support', href: 'mailto:support@stafferoo.app' },
    },
    request_changes: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: '✏️',
      heading: 'Changes requested',
      body: 'Our team has flagged some updates needed before we can approve your application.',
      cta: { label: 'Update application', href: '/staff/onboarding' },
    },
  };

  const cfg = configs[verification.status] ?? configs.incomplete;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-5`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 text-base">{cfg.heading}</h2>
          <p className="mt-1 text-sm text-gray-700">{cfg.body}</p>

          {/* Rejection / change notes */}
          {verification.rejection_reason &&
            (verification.status === 'rejected' || verification.status === 'request_changes') && (
              <div className="mt-3 rounded-lg bg-white border border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {verification.status === 'rejected' ? 'Reason' : 'Notes from reviewer'}
                </p>
                <p className="text-sm text-gray-800">{verification.rejection_reason}</p>
              </div>
            )}

          {submittedAt && (
            <p className="mt-3 text-xs text-gray-500">
              Submitted {formatDate(submittedAt)}
            </p>
          )}

          {cfg.cta && (
            <div className="mt-4">
              <Link
                href={cfg.cta.href}
                className="inline-block text-sm font-semibold bg-[#bf5d9f] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                {cfg.cta.label}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  colour,
}: {
  icon: string;
  label: string;
  value: string;
  colour?: 'green' | 'amber' | 'red' | 'gray';
}) {
  const colourClasses: Record<string, string> = {
    green: 'text-green-700',
    amber: 'text-amber-700',
    red: 'text-red-600',
    gray: 'text-gray-500',
  };
  return (
    <div className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-4 flex items-start gap-3 flex-1 min-w-0">
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={`text-sm font-bold mt-0.5 ${colour ? colourClasses[colour] : 'text-gray-900'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b49cdc] focus-visible:ring-offset-2 ${
          checked ? 'bg-[#bf5d9f]' : 'bg-gray-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StaffDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');

  // Settings form state
  const [settings, setSettings] = useState({
    travel_radius_miles: 10,
    transport_mode: 'car',
    years_experience: 0,
    qualification_level: 'level_3',
    qualification_name: '',
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Notification prefs state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    email_on: true,
    sms_on: false,
    browser_on: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const notifDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Unavailability state
  const [unavailability, setUnavailability] = useState<UnavailabilityBlock[]>([]);
  const [newBlock, setNewBlock] = useState({ starts_on: '', ends_on: '', note: '' });
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  // Increment to trigger a reload (used by "Try again" button)
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        router.push('/auth?redirectTo=/staff/dashboard');
        return;
      }
      if (cancelled) return;
      setUserEmail(user.email ?? '');

      const res = await fetch('/api/staff/dashboard');
      const json = await res.json() as { ok: boolean; data?: DashboardData; error?: { code: string; message: string } };

      if (cancelled) return;

      if (!json.ok) {
        // Session cookie missing or expired — bounce back to auth
        if (res.status === 401) {
          router.push('/auth?redirectTo=/staff/dashboard');
          return;
        }
        setError(`Failed to load dashboard (${json.error?.code ?? res.status}). Please refresh.`);
        setLoading(false);
        return;
      }

      const d = json.data!;
      setData(d);
      setNotifPrefs(d.notificationPrefs);
      setUnavailability(d.unavailability);
      if (d.profile) {
        setSettings({
          travel_radius_miles: d.profile.travel_radius_miles ?? 10,
          transport_mode: d.profile.transport_mode ?? 'car',
          years_experience: d.profile.years_experience ?? 0,
          qualification_level: d.profile.qualification_level ?? 'level_3',
          qualification_name: d.profile.qualification_name ?? '',
        });
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.push('/auth?reason=session_expired');
      return null;
    }
    return session.access_token;
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsError(null);
    setSettingsSaved(false);

    const token = await getToken();
    if (!token) return;

    const res = await fetch('/api/staff/profile/update-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...settings,
        travel_radius_miles: Number(settings.travel_radius_miles),
        years_experience: Number(settings.years_experience),
      }),
    });
    const json = await res.json();
    setSettingsSaving(false);

    if (!json.ok) {
      const details = json.error?.details?.fieldErrors;
      if (details) {
        const msgs = Object.values(details).flat().join(', ');
        setSettingsError(msgs);
      } else {
        setSettingsError(json.error?.message ?? 'Failed to save settings');
      }
      return;
    }

    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  }

  function handleNotifChange(key: keyof NotificationPrefs, value: boolean) {
    const next = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);

    if (notifDebounceRef.current) clearTimeout(notifDebounceRef.current);
    notifDebounceRef.current = setTimeout(async () => {
      setNotifSaving(true);
      const token = await getToken();
      if (!token) return;
      await fetch('/api/staff/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(next),
      });
      setNotifSaving(false);
    }, 600);
  }

  async function handleAddBlock(e: React.FormEvent) {
    e.preventDefault();
    setBlockError(null);
    if (!newBlock.starts_on || !newBlock.ends_on) {
      setBlockError('Start and end dates are required');
      return;
    }
    if (newBlock.ends_on < newBlock.starts_on) {
      setBlockError('End date must be on or after start date');
      return;
    }
    setBlockSaving(true);
    const token = await getToken();
    if (!token) return;

    const res = await fetch('/api/staff/unavailability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newBlock),
    });
    const json = await res.json();
    setBlockSaving(false);

    if (!json.ok) {
      setBlockError(json.error?.message ?? 'Failed to add block');
      return;
    }
    setUnavailability((prev) => [...prev, json.data].sort((a, b) => a.starts_on.localeCompare(b.starts_on)));
    setNewBlock({ starts_on: '', ends_on: '', note: '' });
  }

  async function handleDeleteBlock(id: string) {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/staff/unavailability/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setUnavailability((prev) => prev.filter((b) => b.id !== id));
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
            onClick={() => { setError(null); setLoading(true); setReloadKey((k) => k + 1); }}
            className="mt-4 text-sm font-semibold text-[#bf5d9f] hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const dbs = dbsExpiryInfo(data?.profile?.dbs_issue_date ?? null);
  const verif = data?.verification ?? { status: 'incomplete', rejection_reason: null, last_reviewed_at: null };

  return (
    <div className="min-h-screen bg-[#f8f0f5] py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/stafferoo-logo.png"
              alt="Stafferoo"
              width={120}
              height={45}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[200px]">{userEmail}</span>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          {data?.profile?.full_name ? `Hi, ${data.profile.full_name.split(' ')[0]}` : 'My Dashboard'}
        </h1>

        {/* Verification status */}
        <StatusCard
          verification={verif}
          submittedAt={data?.profile?.submitted_at ?? null}
        />

        {/* Stats row */}
        <div className="flex gap-3 flex-wrap">
          <StatCard
            icon="🛡️"
            label="DBS certificate"
            value={dbs.label}
            colour={dbs.colour}
          />
          <StatCard
            icon="💼"
            label="Recent jobs"
            value={String(data?.jobsCount ?? 0)}
          />
        </div>

        {/* Notification preferences */}
        <div className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-sm">Notification preferences</h2>
            {notifSaving && (
              <span className="text-xs text-gray-400">Saving…</span>
            )}
          </div>
          <div className="space-y-4">
            <Toggle
              label="Email notifications"
              checked={notifPrefs.email_on}
              onChange={(v) => handleNotifChange('email_on', v)}
            />
            <Toggle
              label="SMS notifications"
              checked={notifPrefs.sms_on}
              onChange={(v) => handleNotifChange('sms_on', v)}
            />
            <Toggle
              label="Browser notifications"
              checked={notifPrefs.browser_on}
              onChange={(v) => handleNotifChange('browser_on', v)}
            />
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Preferences are saved automatically. Notifications are sent when a matching job becomes available.
          </p>
        </div>

        {/* Account settings */}
        <div className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-5">
          <h2 className="font-bold text-gray-900 text-sm mb-4">Account settings</h2>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Travel radius (miles)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={settings.travel_radius_miles}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, travel_radius_miles: Number(e.target.value) }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Transport
                </label>
                <select
                  value={settings.transport_mode}
                  onChange={(e) => setSettings((s) => ({ ...s, transport_mode: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
                >
                  {Object.entries(TRANSPORT_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Years of experience
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={settings.years_experience}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, years_experience: Number(e.target.value) }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Qualification level
                </label>
                <select
                  value={settings.qualification_level}
                  onChange={(e) => setSettings((s) => ({ ...s, qualification_level: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
                >
                  {Object.entries(QUAL_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Qualification name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CACHE Level 3 Diploma"
                value={settings.qualification_name}
                onChange={(e) => setSettings((s) => ({ ...s, qualification_name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
              />
            </div>

            {settingsError && (
              <p className="text-sm text-red-600 font-medium">{settingsError}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={settingsSaving}
                className="bg-[#bf5d9f] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {settingsSaving ? 'Saving…' : 'Save settings'}
              </button>
              {settingsSaved && (
                <span className="text-sm text-green-600 font-medium">✓ Saved</span>
              )}
            </div>
          </form>
        </div>

        {/* Unavailability calendar */}
        <div className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-5">
          <h2 className="font-bold text-gray-900 text-sm mb-1">Unavailability</h2>
          <p className="text-xs text-gray-500 mb-4">
            Block out dates when you can&apos;t take jobs. You won&apos;t receive alerts during these periods.
          </p>

          {/* Existing blocks */}
          {unavailability.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No blocks added yet.</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {unavailability.map((block) => (
                <li
                  key={block.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {formatDate(block.starts_on)}
                      {block.starts_on !== block.ends_on && (
                        <> &rarr; {formatDate(block.ends_on)}</>
                      )}
                    </p>
                    {block.note && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{block.note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    className="shrink-0 text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                    aria-label="Remove block"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add block form */}
          <form onSubmit={handleAddBlock} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                <input
                  type="date"
                  value={newBlock.starts_on}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewBlock((b) => ({ ...b, starts_on: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                <input
                  type="date"
                  value={newBlock.ends_on}
                  min={newBlock.starts_on || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewBlock((b) => ({ ...b, ends_on: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Note <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Holiday"
                value={newBlock.note}
                onChange={(e) => setNewBlock((b) => ({ ...b, note: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
              />
            </div>

            {blockError && (
              <p className="text-sm text-red-600 font-medium">{blockError}</p>
            )}

            <button
              type="submit"
              disabled={blockSaving}
              className="bg-[#bf5d9f] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {blockSaving ? 'Adding…' : 'Add block'}
            </button>
          </form>
        </div>

        {/* Footer nav */}
        <div className="flex justify-center gap-6 pb-4 text-xs text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <Link href="/staff/onboarding" className="hover:text-gray-600 transition-colors">Onboarding</Link>
        </div>
      </div>
    </div>
  );
}
