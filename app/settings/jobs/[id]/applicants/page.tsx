'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import Breadcrumbs from '@/app/components/Breadcrumbs';

interface Applicant {
  responseId: string;
  status: string;
  message: string | null;
  respondedAt: string;
  createdAt: string;
  isPrimary: boolean;
  isSecondary: boolean;
  staff: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    yearsExperience: number | null;
    qualificationLevel: string | null;
    qualificationName: string | null;
    postcode: string;
    travelRadius: number | null;
    transportMode: string | null;
    dbsUpdateService: boolean;
    verifiedAt: string | null;
    documents: Record<string, string>;
    allDocsValid: boolean;
  };
}

interface Job {
  id: string;
  title: string;
  status: string;
  roleLabel: string;
}

export default function JobApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      loadApplicants();
    }
  }, [jobId]);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/auth?redirectTo=/settings/jobs/' + jobId + '/applicants');
        return;
      }

      const res = await fetch(`/api/settings/jobs/${jobId}/responses`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message || 'Failed to load applicants');
        return;
      }

      setJob(json.data?.job || null);
      setApplicants(json.data?.applicants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStaff = async (staffId: string, role: 'primary' | 'secondary') => {
    try {
      setSelecting(staffId + role);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/auth?redirectTo=/settings/jobs/' + jobId + '/applicants');
        return;
      }

      const res = await fetch(`/api/settings/jobs/${jobId}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ staffId, role }),
      });

      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message || 'Failed to select staff');
        return;
      }

      // Reload applicants to show updated status
      await loadApplicants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSelecting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getQualificationLabel = (level: string | null) => {
    const labels: Record<string, string> = {
      level_2: 'Level 2',
      level_3: 'Level 3',
      level_4_plus: 'Level 4+',
      unqualified: 'Unqualified',
    };
    return labels[level || ''] || level || 'N/A';
  };

  const getTransportLabel = (mode: string | null) => {
    const labels: Record<string, string> = {
      car: 'Car',
      public_transport: 'Public Transport',
      bicycle: 'Bicycle',
      walking: 'Walking',
    };
    return labels[mode || ''] || mode || 'N/A';
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Check if we already have primary and secondary selected
  const hasPrimary = applicants.some(a => a.isPrimary);
  const hasSecondary = applicants.some(a => a.isSecondary);

  return (
    <div className="min-h-screen bg-[#f8f0f5] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Image
            src="/brand/stafferoo-logo.png"
            alt="Stafferoo"
            width={120}
            height={45}
            className="object-contain"
            priority
          />
          <Link
            href="/settings/jobs"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Jobs
          </Link>
        </div>

        <Breadcrumbs
          items={[
            { label: 'Business', href: '/settings/dashboard' },
            { label: 'Jobs', href: '/settings/jobs' },
            { label: 'Applicants' },
          ]}
        />

        {/* Job Header */}
        <div className="mt-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Applicants for: {job?.title || 'Loading...'}
          </h1>
          <p className="text-gray-600 mt-1">
            Role: {job?.roleLabel} • Status: <span className="capitalize">{job?.status}</span>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bf5d9f] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading applicants...</p>
          </div>
        ) : applicants.length === 0 ? (
          <div className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#bf5d9f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No applicants yet</h2>
            <p className="text-gray-600">
              Staff will appear here when they apply for this position.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selection Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Selection Status
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Primary: {hasPrimary ? '✓ Selected' : 'Not selected'} • 
                    Secondary (backup): {hasSecondary ? '✓ Selected' : 'Not selected'}
                  </p>
                </div>
                <Link
                  href={`/settings/jobs/${jobId}`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Job Details →
                </Link>
              </div>
            </div>

            {applicants.map((applicant) => (
              <div
                key={applicant.responseId}
                className={`bg-white rounded-xl border ${
                  applicant.isPrimary 
                    ? 'border-green-300 ring-2 ring-green-100' 
                    : applicant.isSecondary 
                      ? 'border-blue-300 ring-2 ring-blue-100' 
                      : 'border-[rgba(180,156,220,0.42)]'
                } p-5`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {applicant.staff.fullName}
                      </h3>
                      {applicant.isPrimary && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Primary
                        </span>
                      )}
                      {applicant.isSecondary && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          Secondary
                        </span>
                      )}
                      {applicant.status === 'accepted' && !applicant.isPrimary && !applicant.isSecondary && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                          Declined
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Applied {formatDate(applicant.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    {applicant.staff.allDocsValid ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        ✓ Docs Verified
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                        ⚠ Docs Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Staff Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Experience:</span>
                    <p className="font-medium">{applicant.staff.yearsExperience || 0} years</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Qualification:</span>
                    <p className="font-medium">{getQualificationLabel(applicant.staff.qualificationLevel)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <p className="font-medium">{applicant.staff.postcode || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Transport:</span>
                    <p className="font-medium">{getTransportLabel(applicant.staff.transportMode)}</p>
                  </div>
                </div>

                {/* Documents */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(applicant.staff.documents).map(([docType, status]) => (
                      <span
                        key={docType}
                        className={`px-2 py-1 rounded text-xs font-medium ${getDocumentStatusColor(status)}`}
                      >
                        {docType.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <a 
                      href={`mailto:${applicant.staff.email}`}
                      className="text-[#bf5d9f] hover:underline"
                    >
                      {applicant.staff.email}
                    </a>
                    {applicant.staff.phone && (
                      <a 
                        href={`tel:${applicant.staff.phone}`}
                        className="text-[#bf5d9f] hover:underline"
                      >
                        {applicant.staff.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Applicant Message */}
                {applicant.message && (
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Message from applicant:</p>
                    <p className="text-sm text-gray-700 italic">&ldquo;{applicant.message}&rdquo;</p>
                  </div>
                )}

                {/* Action Buttons */}
                {job?.status === 'open' && (
                  <div className="flex gap-3">
                    {!applicant.isPrimary && !hasPrimary && applicant.status !== 'declined' && (
                      <button
                        onClick={() => handleSelectStaff(applicant.staff.id, 'primary')}
                        disabled={selecting === applicant.staff.id + 'primary'}
                        className="flex-1 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {selecting === applicant.staff.id + 'primary' 
                          ? 'Selecting...' 
                          : 'Select as Primary'}
                      </button>
                    )}
                    {!applicant.isSecondary && !hasSecondary && !applicant.isPrimary && applicant.status !== 'declined' && (
                      <button
                        onClick={() => handleSelectStaff(applicant.staff.id, 'secondary')}
                        disabled={selecting === applicant.staff.id + 'secondary'}
                        className="flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {selecting === applicant.staff.id + 'secondary' 
                          ? 'Selecting...' 
                          : 'Select as Secondary (Backup)'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <Link href="/settings/dashboard" className="hover:text-gray-600 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
