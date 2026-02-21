'use client';

/**
 * RefereeForm — client component for the referee questionnaire.
 *
 * Validates locally, then POSTs to /api/r/reference/[token]/submit.
 * Shows a success screen on submission; errors are displayed inline.
 */

import { useState } from 'react';

interface RefereeFormProps {
  token: string;
  requestId: string;
  applicantName: string;
  refereeName: string;
  refereePosition: string;
}

type Rating = 'excellent' | 'good' | 'satisfactory' | 'poor';
type YesNo = true | false | null;

function RatingSelect({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: Rating | '';
  onChange: (val: Rating) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} *</label>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value as Rating)}
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c653a0] focus:border-transparent text-sm"
      >
        <option value="">Select…</option>
        <option value="excellent">Excellent</option>
        <option value="good">Good</option>
        <option value="satisfactory">Satisfactory</option>
        <option value="poor">Poor</option>
      </select>
    </div>
  );
}

function YesNoField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: YesNo;
  onChange: (val: boolean) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label} *</p>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === false}
            onChange={() => onChange(false)}
            required
          />
          <span className="text-sm text-gray-700">No</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === true}
            onChange={() => onChange(true)}
          />
          <span className="text-sm text-gray-700">Yes</span>
        </label>
      </div>
    </div>
  );
}

export default function RefereeForm({
  token,
  applicantName,
  refereeName,
  refereePosition,
}: RefereeFormProps) {
  const [confirmedName,     setConfirmedName]     = useState(refereeName);
  const [confirmedPosition, setConfirmedPosition] = useState(refereePosition);
  const [knownSince,        setKnownSince]        = useState('');
  const [reliability,       setReliability]       = useState<Rating | ''>('');
  const [punctuality,       setPunctuality]       = useState<Rating | ''>('');
  const [safeguarding,      setSafeguarding]      = useState<YesNo>(null);
  const [rehire,            setRehire]            = useState<YesNo>(null);
  const [comments,          setComments]          = useState('');
  const [submitting,        setSubmitting]        = useState(false);
  const [submitted,         setSubmitted]         = useState(false);
  const [formError,         setFormError]         = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Client-side guard: required fields
    if (!confirmedName.trim())     { setFormError('Please confirm your name.'); return; }
    if (!confirmedPosition.trim()) { setFormError('Please confirm your job title.'); return; }
    if (!knownSince.trim())        { setFormError('Please tell us how long you have known the applicant.'); return; }
    if (!reliability)              { setFormError('Please rate reliability.'); return; }
    if (!punctuality)              { setFormError('Please rate punctuality.'); return; }
    if (safeguarding === null)     { setFormError('Please answer the safeguarding question.'); return; }
    if (rehire === null)           { setFormError('Please answer the rehire eligibility question.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/r/reference/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: {
            confirmed_name:        confirmedName.trim(),
            confirmed_position:    confirmedPosition.trim(),
            known_applicant_since: knownSince.trim(),
            reliability,
            punctuality,
            safeguarding_concerns: safeguarding,
            eligible_for_rehire:   rehire,
            comments:              comments.trim() || undefined,
          },
        }),
      });

      const result = await res.json() as { ok: boolean; error?: { message: string } };

      if (!result.ok) {
        setFormError(result.error?.message ?? 'Submission failed — please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setFormError('Network error — please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h3>
        <p className="text-gray-600 text-sm">
          Your reference for <strong>{applicantName}</strong> has been submitted successfully.
          You can now close this page.
        </p>
        <p className="mt-4 text-xs text-gray-400">
          Questions? <a href="mailto:support@stafferoo.app" className="underline text-[#c653a0]">support@stafferoo.app</a>
        </p>
      </div>
    );
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c653a0] focus:border-transparent text-sm';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Please fix the following:</p>
          <p className="text-sm text-red-700 mt-1">{formError}</p>
        </div>
      )}

      {/* Section 1: Confirm details */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">1. Confirm your details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your full name *</label>
            <input
              type="text"
              value={confirmedName}
              onChange={(e) => setConfirmedName(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your job title *</label>
            <input
              type="text"
              value={confirmedPosition}
              onChange={(e) => setConfirmedPosition(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How long have you known <strong>{applicantName}</strong>? *
            </label>
            <input
              type="text"
              value={knownSince}
              onChange={(e) => setKnownSince(e.target.value)}
              placeholder="e.g. 3 years as a colleague at Sunshine Nursery"
              className={inputClass}
              required
            />
          </div>
        </div>
      </div>

      {/* Section 2: Ratings */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">2. Performance ratings</h3>
        <div className="space-y-4">
          <RatingSelect
            label={`Reliability of ${applicantName}`}
            name="reliability"
            value={reliability}
            onChange={setReliability}
          />
          <RatingSelect
            label={`Punctuality of ${applicantName}`}
            name="punctuality"
            value={punctuality}
            onChange={setPunctuality}
          />
        </div>
      </div>

      {/* Section 3: Yes/No declarations */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">3. Declarations</h3>
        <div className="space-y-6">
          <YesNoField
            label={`Do you have any safeguarding concerns about ${applicantName}?`}
            name="safeguarding"
            value={safeguarding}
            onChange={setSafeguarding}
          />
          {safeguarding === true && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
              Please provide details in the comments box below.
            </div>
          )}
          <YesNoField
            label={`Would you re-employ ${applicantName} if the opportunity arose?`}
            name="rehire"
            value={rehire}
            onChange={setRehire}
          />
        </div>
      </div>

      {/* Section 4: Comments */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="font-semibold text-gray-900 mb-2">4. Additional comments</h3>
        <p className="text-sm text-gray-600 mb-3">
          Is there anything else you would like to add about {applicantName}?
          {safeguarding === true && ' Please include your safeguarding concerns here.'}
        </p>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Optional — your comments will be kept confidential"
          className={inputClass}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{comments.length}/2000</p>
      </div>

      {/* Declaration */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
        By submitting this form you confirm that the information you have provided is truthful
        and accurate to the best of your knowledge.
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#c653a0] text-white py-3 rounded-lg font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting…
          </span>
        ) : (
          'Submit Reference'
        )}
      </button>
    </form>
  );
}
