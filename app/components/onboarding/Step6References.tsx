'use client';

/**
 * Step 6 — Staff References
 *
 * Applicant enters two references:
 *   1. Professional — work email required (no free providers), Ofsted URN, setting name
 *   2. Personal     — any valid email, optional position
 *
 * After links are sent the cards switch to a live-status view showing the
 * current state of each reference request (not_sent | sent | viewed | submitted | expired).
 * A "Resend links" button is shown when all are sent/viewed but none yet submitted.
 */

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import {
  isFreeEmailDomain,
  extractEmailDomain,
  ProfessionalReferenceInput,
  PersonalReferenceInput,
} from '@/app/lib/validations/references';

async function getToken(): Promise<string | null> {
  // Try the cached session first (reads from localStorage, no network call)
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) return session.access_token;

  // Session missing or expired — attempt a token refresh before giving up
  const { data: refreshData } = await supabase.auth.refreshSession();
  return refreshData.session?.access_token ?? null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RefStatus = 'not_sent' | 'sent' | 'viewed' | 'submitted' | 'expired';

interface ReferenceState {
  professional: ProfessionalReferenceInput & { status: RefStatus };
  personal: PersonalReferenceInput & { status: RefStatus };
}

interface Step6ReferencesProps {
  onNext: () => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Small sub-components
// ---------------------------------------------------------------------------

function StatusPill({ status }: { status: RefStatus }) {
  const map: Record<RefStatus, { label: string; classes: string }> = {
    not_sent:  { label: 'Not sent',  classes: 'bg-gray-100 text-gray-600' },
    sent:      { label: 'Sent',      classes: 'bg-blue-100 text-blue-700' },
    viewed:    { label: 'Viewed',    classes: 'bg-yellow-100 text-yellow-700' },
    submitted: { label: 'Submitted', classes: 'bg-green-100 text-green-700' },
    expired:   { label: 'Expired',   classes: 'bg-red-100 text-red-700' },
  };
  const { label, classes } = map[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}

const inputClass =
  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c653a0] focus:border-transparent';

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, error, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && ' *'}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Step6References({ onNext, onBack }: Step6ReferencesProps) {
  const [refs, setRefs] = useState<ReferenceState>({
    professional: {
      referee_name:     '',
      referee_position: '',
      referee_email:    '',
      setting_urn:      '',
      setting_name:     '',
      status:           'not_sent',
    },
    personal: {
      referee_name:     '',
      referee_position: '',
      referee_email:    '',
      status:           'not_sent',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending]   = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [linksSent, setLinksSent] = useState(false);

  // ----- Derived state -----
  const profStatus = refs.professional.status;
  const persStatus = refs.personal.status;

  const allSubmitted =
    profStatus === 'submitted' && persStatus === 'submitted';

  const canSend =
    !allSubmitted && (profStatus === 'not_sent' || profStatus === 'expired' ||
                      persStatus === 'not_sent' || persStatus === 'expired');

  const canResend =
    !allSubmitted && linksSent &&
    (profStatus === 'sent' || profStatus === 'viewed') &&
    (persStatus === 'sent' || persStatus === 'viewed');

  // ----- Helpers -----

  function setProfField<K extends keyof ReferenceState['professional']>(
    key: K,
    value: ReferenceState['professional'][K]
  ) {
    setRefs(prev => ({
      ...prev,
      professional: { ...prev.professional, [key]: value },
    }));
    // Clear error on edit
    if (errors[`prof_${key}`]) {
      setErrors(prev => { const n = { ...prev }; delete n[`prof_${key}`]; return n; });
    }
  }

  function setPersField<K extends keyof ReferenceState['personal']>(
    key: K,
    value: ReferenceState['personal'][K]
  ) {
    setRefs(prev => ({
      ...prev,
      personal: { ...prev.personal, [key]: value },
    }));
    if (errors[`pers_${key}`]) {
      setErrors(prev => { const n = { ...prev }; delete n[`pers_${key}`]; return n; });
    }
  }

  // ----- Client-side validation -----

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const p = refs.professional;
    const q = refs.personal;

    if (!p.referee_name.trim())
      errs.prof_referee_name = 'Full name is required';
    if (!p.referee_position.trim())
      errs.prof_referee_position = 'Job title is required';
    if (!p.referee_email.trim())
      errs.prof_referee_email = 'Work email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.referee_email))
      errs.prof_referee_email = 'Please enter a valid email address';
    else if (isFreeEmailDomain(extractEmailDomain(p.referee_email)))
      errs.prof_referee_email =
        'Professional referee must have a work email — personal providers (Gmail, Hotmail, etc.) are not accepted';
    if (!p.setting_urn.trim())
      errs.prof_setting_urn = 'Ofsted URN is required';
    else if (!/^\d{6,9}$|^EY\d{6,9}$/i.test(p.setting_urn))
      errs.prof_setting_urn = 'URN should be 6–9 digits, or start with EY';
    if (!p.setting_name.trim())
      errs.prof_setting_name = 'Setting name is required';

    if (!q.referee_name.trim())
      errs.pers_referee_name = 'Full name is required';
    if (!q.referee_email.trim())
      errs.pers_referee_email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.referee_email))
      errs.pers_referee_email = 'Please enter a valid email address';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ----- Send links -----

  async function handleSendLinks() {
    setApiError(null);
    if (!validate()) return;

    setSending(true);
    try {
      const token = await getToken();
      if (!token) {
        // Session fully expired — redirect to auth with return URL
        window.location.href = '/auth?reason=session_expired&redirectTo=/staff/onboarding';
        return;
      }

      const resp = await fetch('/api/staff/onboarding/references/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          professional: {
            referee_name:     refs.professional.referee_name,
            referee_position: refs.professional.referee_position,
            referee_email:    refs.professional.referee_email,
            setting_urn:      refs.professional.setting_urn,
            setting_name:     refs.professional.setting_name,
          },
          personal: {
            referee_name:     refs.personal.referee_name,
            referee_position: refs.personal.referee_position || undefined,
            referee_email:    refs.personal.referee_email,
          },
        }),
      });

      if (resp.status === 401) {
        window.location.href = '/auth?reason=session_expired&redirectTo=/staff/onboarding';
        return;
      }

      const result = await resp.json();

      if (!result.ok) {
        const err = result.error;
        if (err?.code === 'VALIDATION_ERROR' && err?.details) {
          const details = err.details as {
            fieldErrors?: Record<string, string[]>;
            formErrors?: string[];
          };
          const mapped: Record<string, string> = {};
          if (details.fieldErrors) {
            for (const [field, msgs] of Object.entries(details.fieldErrors)) {
              mapped[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
            }
          }
          if (Object.keys(mapped).length) {
            setErrors(mapped);
          } else {
            setApiError(err.message ?? 'Validation failed');
          }
        } else {
          setApiError(err?.message ?? 'Failed to send reference links. Please try again.');
        }
        return;
      }

      // Success — mark as sent
      setRefs(prev => ({
        professional: { ...prev.professional, status: 'sent' },
        personal:     { ...prev.personal,     status: 'sent' },
      }));
      setLinksSent(true);
    } catch {
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setSending(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const profEmailIsFree =
    refs.professional.referee_email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(refs.professional.referee_email) &&
    isFreeEmailDomain(extractEmailDomain(refs.professional.referee_email));

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">References</h2>
      <p className="text-sm text-gray-600 mb-6">
        We require two references. Your referees will each receive a secure link by email to
        complete a short questionnaire. Links expire after 14 days.
      </p>

      {apiError && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Error:</p>
          <p className="text-sm text-red-700 mt-1">{apiError}</p>
        </div>
      )}

      <div className="space-y-6">

        {/* ------------------------------------------------------------------ */}
        {/* Professional reference card                                         */}
        {/* ------------------------------------------------------------------ */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-[#c653a0] px-5 py-3 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">
              Reference 1 — Professional (Childcare Setting)
            </h3>
            <StatusPill status={profStatus} />
          </div>

          <div className="p-5 space-y-4">
            <p className="text-xs text-gray-500">
              Must be a manager or senior colleague at an Ofsted-registered childcare setting.
              A <strong>work email address</strong> is required — personal email providers are not accepted.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Referee full name" required error={errors.prof_referee_name}>
                <input
                  type="text"
                  value={refs.professional.referee_name}
                  onChange={(e) => setProfField('referee_name', e.target.value)}
                  className={inputClass}
                  disabled={profStatus === 'submitted'}
                />
              </Field>

              <Field label="Referee job title" required error={errors.prof_referee_position}>
                <input
                  type="text"
                  value={refs.professional.referee_position}
                  onChange={(e) => setProfField('referee_position', e.target.value)}
                  placeholder="e.g. Room Leader, Manager"
                  className={inputClass}
                  disabled={profStatus === 'submitted'}
                />
              </Field>
            </div>

            <Field
              label="Referee work email"
              required
              error={errors.prof_referee_email}
              hint={
                profEmailIsFree
                  ? undefined
                  : 'Must be a work email — no Gmail, Hotmail, Yahoo, etc.'
              }
            >
              <input
                type="email"
                value={refs.professional.referee_email}
                onChange={(e) => setProfField('referee_email', e.target.value)}
                className={inputClass}
                disabled={profStatus === 'submitted'}
              />
              {profEmailIsFree && !errors.prof_referee_email && (
                <p className="mt-1 text-xs text-amber-600 font-medium">
                  ⚠ This looks like a personal email address. Please use your referee&apos;s work email.
                </p>
              )}
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Ofsted URN"
                required
                error={errors.prof_setting_urn}
                hint="6–9 digit number found on the Ofsted register"
              >
                <input
                  type="text"
                  value={refs.professional.setting_urn}
                  onChange={(e) => setProfField('setting_urn', e.target.value.replace(/\s/g, ''))}
                  placeholder="e.g. 123456"
                  className={inputClass}
                  disabled={profStatus === 'submitted'}
                />
              </Field>

              <Field label="Setting name" required error={errors.prof_setting_name}>
                <input
                  type="text"
                  value={refs.professional.setting_name}
                  onChange={(e) => setProfField('setting_name', e.target.value)}
                  placeholder="e.g. Sunshine Day Nursery"
                  className={inputClass}
                  disabled={profStatus === 'submitted'}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Personal reference card                                             */}
        {/* ------------------------------------------------------------------ */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-700 px-5 py-3 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">
              Reference 2 — Personal or Additional Professional
            </h3>
            <StatusPill status={persStatus} />
          </div>

          <div className="p-5 space-y-4">
            <p className="text-xs text-gray-500">
              Can be a professional colleague, tutor, or personal referee who has known you for
              at least two years and is not a family member.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Referee full name" required error={errors.pers_referee_name}>
                <input
                  type="text"
                  value={refs.personal.referee_name}
                  onChange={(e) => setPersField('referee_name', e.target.value)}
                  className={inputClass}
                  disabled={persStatus === 'submitted'}
                />
              </Field>

              <Field label="Referee position / relationship" error={errors.pers_referee_position}>
                <input
                  type="text"
                  value={refs.personal.referee_position ?? ''}
                  onChange={(e) => setPersField('referee_position', e.target.value)}
                  placeholder="e.g. Tutor, Family friend"
                  className={inputClass}
                  disabled={persStatus === 'submitted'}
                />
              </Field>
            </div>

            <Field
              label="Referee email"
              required
              error={errors.pers_referee_email}
            >
              <input
                type="email"
                value={refs.personal.referee_email}
                onChange={(e) => setPersField('referee_email', e.target.value)}
                className={inputClass}
                disabled={persStatus === 'submitted'}
              />
            </Field>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Status summary (shown after links are sent)                         */}
        {/* ------------------------------------------------------------------ */}
        {linksSent && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">Reference links sent</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                Professional referee ({refs.professional.referee_name || 'referee'}):&nbsp;
                <StatusPill status={profStatus} />
              </li>
              <li>
                Personal referee ({refs.personal.referee_name || 'referee'}):&nbsp;
                <StatusPill status={persStatus} />
              </li>
            </ul>
            {!allSubmitted && (
              <p className="mt-3 text-xs text-blue-600">
                You can continue and submit your application now — we&apos;ll chase your referees
                automatically. You can come back to check status or resend links at any time.
              </p>
            )}
            {allSubmitted && (
              <p className="mt-3 text-xs text-green-700 font-medium">
                ✓ Both references have been submitted. Thank you!
              </p>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Note about skipping                                                 */}
        {/* ------------------------------------------------------------------ */}
        {!linksSent && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              <strong>You can continue without sending now.</strong> Reference links can be sent
              at any time before your application is fully approved. However, we cannot activate
              your account until both references are received.
            </p>
          </div>
        )}

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Action row                                                            */}
      {/* -------------------------------------------------------------------- */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={sending}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50 self-start sm:self-auto"
        >
          ← Back
        </button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Resend button — shown only when all sent/viewed but none submitted */}
          {canResend && (
            <button
              type="button"
              onClick={handleSendLinks}
              disabled={sending}
              className="w-full sm:w-auto px-5 py-2 border border-[#c653a0] text-[#c653a0] rounded-lg font-medium text-sm hover:bg-pink-50 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Resend links'}
            </button>
          )}

          {/* Send links button — shown when there are unsent refs */}
          {canSend && (
            <button
              type="button"
              onClick={handleSendLinks}
              disabled={sending}
              className="w-full sm:w-auto bg-[#c653a0] text-white py-2 px-6 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending…
                </span>
              ) : (
                'Send reference links'
              )}
            </button>
          )}

          {/* Continue / finish button — always available */}
          <button
            type="button"
            onClick={onNext}
            disabled={sending}
            className="w-full sm:w-auto bg-gray-800 text-white py-2 px-6 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
          >
            {allSubmitted ? 'Continue →' : 'Skip for now →'}
          </button>
        </div>
      </div>
    </div>
  );
}
