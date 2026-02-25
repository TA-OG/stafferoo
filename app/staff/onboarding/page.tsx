'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabase';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import Step1AccountStatus from '@/app/components/onboarding/Step1AccountStatus';
import Step2ProfileBasics from '@/app/components/onboarding/Step2ProfileBasics';
import Step3Compliance from '@/app/components/onboarding/Step3Compliance';
import Step4HealthSafety from '@/app/components/onboarding/Step4HealthSafety';
import Step5Signature from '@/app/components/onboarding/Step5Signature';
import Step6References from '@/app/components/onboarding/Step6References';
import {
  StaffProfileBasicsInput,
  StaffComplianceInput,
  StaffHealthSafetyInput,
  StaffSignatureInput,
} from '@/app/lib/validations/staff';

interface StaffProfile {
  verification_status: string;
  submitted_at: string | null;
  full_name?: string;
  dbs_certificate_number?: string;
  gp_name?: string;
  digital_signature_svg?: string;
  [key: string]: unknown;
}

const encouragingMessages = [
  "Keep going! You're only moments away from being able to help early years businesses take care of their children.",
  "You're doing great! Every step brings you closer to making a real difference in children's lives.",
  "Almost there! Your dedication to quality childcare is what makes you special.",
  "Fantastic progress! Soon you'll be empowering nurseries to provide exceptional care.",
  "You're on fire! Just a few more steps to start your rewarding journey with Stafferoo.",
  "Last step! Add your references and we'll be in touch very soon.",
];

const hardStopMessage = "This isn't the end, it's just a minor bump in the road. Reach out to us if you need help getting over it! We're here to support you.";

/** Total visible steps (excluding the completion screen). */
const TOTAL_STEPS = 6;

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-red-500 shrink-0" aria-hidden="true">✕</span>
        <div className="flex-1">
          <p className="font-semibold text-red-800 text-sm">Could not save — please fix the following:</p>
          <p className="mt-1 text-red-700 text-sm whitespace-pre-wrap">{message}</p>
          <p className="mt-3 text-sm text-gray-600 italic">{hardStopMessage}</p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-red-400 hover:text-red-600 text-lg leading-none"
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function EncouragingMessage({ step }: { step: number }) {
  const message = encouragingMessages[(step - 1) % encouragingMessages.length];

  return (
    <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">💜</span>
        <p className="text-purple-900 font-medium text-sm leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
}

export default function StaffOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<Partial<StaffProfile>>({});
  const [stepError, setStepError] = useState<string | null>(null);
  // Lifted save-progress state so the banner lives outside individual step components
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const checkAuthAndLoadProfile = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/auth?redirectTo=/staff/onboarding');
        return;
      }

      setUserEmail(user.email || '');

      const { data: profile } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setProfileData(profile);

        // Resume at the furthest completed step
        if (profile.verification_status === 'pending' || profile.verification_status === 'approved') {
          // Already submitted — show references step (Step 6) so they can add/check refs
          setCurrentStep(6);
        } else if (profile.digital_signature_svg) {
          setCurrentStep(6);
        } else if (profile.gp_name) {
          setCurrentStep(5);
        } else if (profile.dbs_certificate_number) {
          setCurrentStep(4);
        } else if (profile.full_name) {
          setCurrentStep(3);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading profile:', err);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, [checkAuthAndLoadProfile]);

  function formatApiError(result: { error?: { code?: string; message?: string; details?: unknown } }): string {
    const err = result.error;
    if (!err) return 'An unknown error occurred';

    if (err.code === 'VALIDATION_ERROR' && err.details && typeof err.details === 'object') {
      const details = err.details as { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
      const lines: string[] = [];

      if (details.fieldErrors) {
        for (const [field, msgs] of Object.entries(details.fieldErrors)) {
          const label = field.replace(/_/g, ' ');
          lines.push(`• ${label}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`);
        }
      }
      if (details.formErrors?.length) {
        lines.push(...details.formErrors.map((m: string) => `• ${m}`));
      }

      return lines.length > 0 ? lines.join('\n') : (err.message ?? 'Validation failed');
    }

    return err.message ?? 'An error occurred — please try again';
  }

  /** Core save: calls API, updates local profile cache, returns success bool */
  const saveStep = async (step: number, data: Record<string, unknown>): Promise<boolean> => {
    setStepError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        window.location.href = '/auth?reason=session_expired';
        return false;
      }

      const response = await fetch('/api/staff/profile/save-step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ step, data }),
      });

      if (response.status === 401) {
        window.location.href = '/auth?reason=session_expired';
        return false;
      }

      const result = await response.json();

      if (!result.ok) {
        const errorMsg = formatApiError(result);
        setStepError(errorMsg);
        return false;
      }

      setProfileData(prev => ({ ...prev, ...data }));
      return true;
    } catch (err) {
      console.error('Error saving step:', err);
      setStepError(err instanceof Error ? err.message : 'Failed to save step');
      return false;
    }
  };

  /** Save-only handler: saves without advancing. Drives the save status indicator. */
  const handleSaveProgress = async (step: number, data: Record<string, unknown>): Promise<void> => {
    setSaveStatus('saving');
    const ok = await saveStep(step, data);
    setSaveStatus(ok ? 'saved' : 'error');
    if (ok) {
      // Reset the "Saved" badge after 3 s so it doesn't linger
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleStep2Next = async (data: StaffProfileBasicsInput) => {
    setSaveStatus('idle');
    const saved = await saveStep(2, data);
    if (saved) setCurrentStep(3);
  };

  const handleStep3Next = async (data: StaffComplianceInput) => {
    setSaveStatus('idle');
    const saved = await saveStep(3, data);
    if (saved) setCurrentStep(4);
  };

  const handleStep4Next = async (data: StaffHealthSafetyInput) => {
    setSaveStatus('idle');
    const saved = await saveStep(4, data);
    if (saved) setCurrentStep(5);
  };

  const handleStep5Submit = async (data: StaffSignatureInput) => {
    setIsSubmitting(true);
    setStepError(null);

    try {
      const saveResult = await saveStep(5, data);
      if (!saveResult) {
        setIsSubmitting(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        window.location.href = '/auth?reason=session_expired';
        return;
      }

      const response = await fetch('/api/staff/onboarding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.status === 401) {
        window.location.href = '/auth?reason=session_expired';
        return;
      }

      const result = await response.json();

      if (!result.ok) {
        const errorMsg = formatApiError(result);
        setStepError(errorMsg);
        setIsSubmitting(false);
        return;
      }

      // Advance to Step 6 (References) after submission
      setCurrentStep(6);
    } catch (err) {
      console.error('Error submitting onboarding:', err);
      setStepError(err instanceof Error ? err.message : 'Failed to submit onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f0f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c653a0] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Progress bar: clamp display step to 1–TOTAL_STEPS
  const displayStep = Math.min(currentStep, TOTAL_STEPS);
  const progressPct = Math.round((displayStep / TOTAL_STEPS) * 100);

  return (
    <div className="min-h-screen bg-[#f8f0f5] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/brand/stafferoo-logo.png"
            alt="Stafferoo"
            width={160}
            height={60}
            className="object-contain"
            priority
          />
        </div>

        <Breadcrumbs items={[{ label: 'Staff', href: '/staff/dashboard' }, { label: 'Onboarding' }]} />

        {/* Progress bar — hidden on completion screen (step 7) */}
        {currentStep <= TOTAL_STEPS && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Step {displayStep} of {TOTAL_STEPS}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {progressPct}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#c653a0] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Encouraging message */}
        {currentStep > 1 && currentStep <= TOTAL_STEPS && (
          <EncouragingMessage step={currentStep} />
        )}

        {/* Error banner */}
        {stepError && <ErrorBanner message={stepError} onDismiss={() => setStepError(null)} />}

        {/* Form card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep === 1 && (
            <Step1AccountStatus
              userEmail={userEmail}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <Step2ProfileBasics
              initialData={profileData}
              onNext={handleStep2Next}
              onSave={(data) => handleSaveProgress(2, data as unknown as Record<string, unknown>)}
              saveStatus={saveStatus}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <Step3Compliance
              initialData={profileData}
              onNext={handleStep3Next}
              onSave={(data) => handleSaveProgress(3, data as unknown as Record<string, unknown>)}
              saveStatus={saveStatus}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <Step4HealthSafety
              initialData={profileData}
              onNext={handleStep4Next}
              onSave={(data) => handleSaveProgress(4, data as unknown as Record<string, unknown>)}
              saveStatus={saveStatus}
              onBack={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 5 && (
            <Step5Signature
              initialData={profileData}
              onSubmit={handleStep5Submit}
              onBack={() => setCurrentStep(4)}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 6 && (
            <Step6References
              onNext={() => setCurrentStep(7)}
              onBack={() => setCurrentStep(5)}
            />
          )}

          {/* Completion screen — step 7 */}
          {currentStep === 7 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Application Submitted
              </h2>
              <p className="text-gray-600 mb-6">
                Thank you for completing your onboarding application. Our admin team will review
                your profile and documents within 2–3 business days. We will also chase your
                referees on your behalf.
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Status:</strong>{' '}
                  {profileData.verification_status === 'approved' ? 'Approved' : 'Pending Review'}
                </p>
                {profileData.submitted_at && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Submitted:</strong>{' '}
                    {new Date(profileData.submitted_at as string).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/staff/dashboard"
                  className="inline-block bg-[#c653a0] text-white py-3 px-8 rounded-lg font-bold hover:opacity-90 transition-opacity"
                >
                  View My Dashboard
                </Link>
                <Link
                  href="/"
                  className="inline-block bg-white text-gray-700 border border-gray-300 py-3 px-8 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
