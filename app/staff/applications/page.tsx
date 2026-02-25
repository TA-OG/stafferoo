'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import Breadcrumbs from '@/app/components/Breadcrumbs';

interface Application {
  id: string;
  status: string;
  message: string | null;
  appliedAt: string;
  respondedAt: string | null;
  job: {
    id: string;
    title: string;
    description: string;
    jobDate: string;
    startTime: string;
    endTime: string;
    roleLabel: string;
    hourlyRate: number;
    estimatedTotal: number;
    postcode: string;
    jobStatus: string;
  };
  setting: {
    name: string;
    ofstedRating: string | null;
    address: string;
    postcode: string;
    phone: string | null;
  };
  booking: {
    status: string;
    isPrimary: boolean;
    isSecondary: boolean;
  } | null;
}

export default function StaffApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/auth?redirectTo=/staff/applications');
        return;
      }

      const res = await fetch('/api/staff/applications', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message || 'Failed to load applications');
        return;
      }

      setApplications(json.data?.applications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A';
    return new Date(timeStr).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
      accepted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Accepted' },
      declined: { bg: 'bg-red-100', text: 'text-red-800', label: 'Not Selected' },
      withdrawn: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Withdrawn' },
      selected_primary: { bg: 'bg-green-100', text: 'text-green-800', label: 'Selected - Primary' },
      selected_secondary: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Selected - Backup' },
    };
    const cfg = configs[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </span>
    );
  };

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
            href="/staff/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <Breadcrumbs
          items={[
            { label: 'Staff', href: '/staff/dashboard' },
            { label: 'My Applications' },
          ]}
        />

        <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">
          My Job Applications
        </h1>
        <p className="text-gray-600 mb-6">
          Track the status of your job applications and bookings.
        </p>

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
            <p className="text-gray-500">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#bf5d9f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h2>
            <p className="text-gray-600 mb-6">
              Browse available jobs and apply to start building your schedule.
            </p>
            <Link
              href="/staff/jobs"
              className="inline-block bg-[#bf5d9f] text-white font-semibold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className={`bg-white rounded-xl border p-5 ${
                  app.booking?.isPrimary 
                    ? 'border-green-300 ring-2 ring-green-100' 
                    : app.booking?.isSecondary 
                      ? 'border-blue-300 ring-2 ring-blue-100' 
                      : 'border-[rgba(180,156,220,0.42)]'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {app.job.title}
                      </h3>
                      {app.setting.ofstedRating && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Ofsted {app.setting.ofstedRating}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{app.setting.name}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(app.status)}
                    <p className="text-xs text-gray-400 mt-1">
                      Applied {formatDate(app.appliedAt)}
                    </p>
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <p className="font-medium">{formatDate(app.job.jobDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <p className="font-medium">{formatTime(app.job.startTime)} - {formatTime(app.job.endTime)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Role:</span>
                    <p className="font-medium">{app.job.roleLabel}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Pay:</span>
                    <p className="font-medium text-[#bf5d9f]">£{app.job.estimatedTotal?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-600">
                      {app.setting.address || app.setting.postcode || 'N/A'}
                    </span>
                  </div>
                  {app.setting.phone && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href={`tel:${app.setting.phone}`} className="text-[#bf5d9f] hover:underline">
                        {app.setting.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Selection Info */}
                {app.booking?.isPrimary && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-green-900">
                          You are the primary staff for this shift!
                        </p>
                        <p className="text-xs text-green-700 mt-0.5">
                          Please arrive on time. The nursery is expecting you.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {app.booking?.isSecondary && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          You are the backup staff for this shift.
                        </p>
                        <p className="text-xs text-blue-700 mt-0.5">
                          You will be contacted if the primary staff cannot attend.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center">
                  <Link
                    href={`/staff/jobs/${app.job.id}`}
                    className="text-sm text-[#bf5d9f] hover:underline"
                  >
                    View Job Details →
                  </Link>
                  {app.status === 'pending' && (
                    <span className="text-xs text-amber-600">
                      Waiting for nursery response...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <Link href="/staff/dashboard" className="hover:text-gray-600 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
