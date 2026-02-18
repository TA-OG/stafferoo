'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import Step1AccountStatus from '@/app/components/onboarding/Step1AccountStatus';
import Step2ProfileBasics from '@/app/components/onboarding/Step2ProfileBasics';
import Step3Compliance from '@/app/components/onboarding/Step3Compliance';
import Step4HealthSafety from '@/app/components/onboarding/Step4HealthSafety';
import Step5Signature from '@/app/components/onboarding/Step5Signature';
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

export default function StaffOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<Partial<StaffProfile>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setError('You must be signed in to access onboarding. Please sign in or create an account.');
        setLoading(false);
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

        if (profile.verification_status === 'pending' || profile.verification_status === 'approved') {
          setCurrentStep(6);
        } else if (profile.digital_signature_svg) {
          setCurrentStep(5);
        } else if (profile.gp_name) {
          setCurrentStep(4);
        } else if (profile.dbs_certificate_number) {
          setCurrentStep(3);
        } else if (profile.full_name) {
          setCurrentStep(2);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
      setLoading(false);
    }
  };

  const saveStep = async (step: number, data: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/staff/profile/save-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, data }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error.message);
      }

      setProfileData({ ...profileData, ...data });
      return true;
    } catch (err) {
      console.error('Error saving step:', err);
      alert(err instanceof Error ? err.message : 'Failed to save step');
      return false;
    }
  };

  const handleStep2Next = async (data: StaffProfileBasicsInput) => {
    const saved = await saveStep(2, data);
    if (saved) setCurrentStep(3);
  };

  const handleStep3Next = async (data: StaffComplianceInput) => {
    const saved = await saveStep(3, data);
    if (saved) setCurrentStep(4);
  };

  const handleStep4Next = async (data: StaffHealthSafetyInput) => {
    const saved = await saveStep(4, data);
    if (saved) setCurrentStep(5);
  };

  const handleStep5Submit = async (data: StaffSignatureInput) => {
    setIsSubmitting(true);

    try {
      const saveResult = await saveStep(5, data);
      if (!saveResult) {
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/staff/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error.message);
      }

      setCurrentStep(6);
    } catch (err) {
      console.error('Error submitting onboarding:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-red-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of 5
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round((currentStep / 5) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

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
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <Step3Compliance
              initialData={profileData}
              onNext={handleStep3Next}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <Step4HealthSafety
              initialData={profileData}
              onNext={handleStep4Next}
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
                your profile and documents within 2-3 business days.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Status:</strong> {profileData.verification_status === 'approved' ? 'Approved' : 'Pending Review'}
                </p>
                {profileData.submitted_at && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Submitted:</strong> {new Date(profileData.submitted_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Link
                href="/"
                className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
