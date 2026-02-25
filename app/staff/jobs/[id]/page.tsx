'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { jobRoleLabels } from '@/app/lib/validations/jobs';
import Breadcrumbs from '@/app/components/Breadcrumbs';

interface JobDetail {
  id: string;
  title: string;
  description: string;
  job_date: string;
  start_time: string;
  end_time: string;
  role_required: string;
  hourly_rate: number;
  estimated_total: number;
  postcode: string;
  status: string;
  setting_id: string;
  setting_name: string;
  setting_ofsted_rating: string | null;
  setting_address: string;
  setting_phone: string | null;
}

interface ApplicationStatus {
  hasApplied: boolean;
  applicationId?: string;
  status?: string;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>({ hasApplied: false });
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  const loadJob = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/auth?redirectTo=/staff/jobs/' + jobId);
        return;
      }

      // Fetch job details
      const res = await fetch(`/api/staff/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await res.json();

      if (!json.ok) {
        if (json.error?.code === 'NOT_VERIFIED') {
          setError('You need to be verified before you can view jobs.');
        } else if (json.error?.code === 'JOB_NOT_FOUND') {
          setError('This job is no longer available.');
        } else {
          setError(json.error?.message || 'Failed to load job');
        }
        return;
      }

      setJob(json.data?.job || null);
      setApplicationStatus(json.data?.applicationStatus || { hasApplied: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!job) return;

    try {
      setApplying(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/auth?redirectTo=/staff/jobs/' + jobId);
        return;
      }

      const res = await fetch(`/api/staff/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message || 'Failed to apply for job');
        return;
      }

      setApplySuccess(true);
      setApplicationStatus({ hasApplied: true, applicationId: json.data?.applicationId, status: 'pending' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setApplying(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f0f5] py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bf5d9f] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#f8f0f5] py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">{error || 'Job not found'}</p>
            <Link
              href="/staff/jobs"
              className="mt-4 inline-block text-sm font-semibold text-[#bf5d9f] hover:underline"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const duration = calculateDuration(job.start_time, job.end_time);

  return (
    <div className="min-h-screen bg-[#f8f0f5] py-8 px-4">
      <div className="max-w-2xl mx-auto">
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
            href="/staff/jobs"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Jobs
          </Link>
        </div>

        <Breadcrumbs
          items={[
            { label: 'Staff', href: '/staff/dashboard' },
            { label: 'Jobs', href: '/staff/jobs' },
            { label: 'Job Details' },
          ]}
        />

        {/* Success Message */}
        {applySuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-700 font-medium">
              ✓ Application submitted successfully!
            </p>
            <p className="text-xs text-green-600 mt-1">
              The nursery will review your application and contact you soon.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Job Card */}
        <div className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-6 mb-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              {job.setting_ofsted_rating && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                  Ofsted {job.setting_ofsted_rating}
                </span>
              )}
            </div>
            <p className="text-lg text-gray-700">{job.setting_name}</p>
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Date</p>
              <p className="font-medium text-gray-900">{formatDate(job.job_date)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Time</p>
              <p className="font-medium text-gray-900">
                {formatTime(job.start_time)} - {formatTime(job.end_time)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Role</p>
              <p className="font-medium text-gray-900">
                {jobRoleLabels[job.role_required as keyof typeof jobRoleLabels] || job.role_required}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Location</p>
              <p className="font-medium text-gray-900">{job.postcode}</p>
            </div>
          </div>

          {/* Pay Summary */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Pay Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Hourly Rate:</span>
                <span className="font-medium">£{job.hourly_rate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{duration} hours</span>
              </div>
              <div className="flex justify-between border-t border-purple-200 pt-2 mt-2">
                <span className="text-gray-900 font-semibold">Total Pay:</span>
                <span className="text-[#bf5d9f] font-bold">£{job.estimated_total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Job Description</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* Setting Info */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Nursery Information</h3>
            <div className="text-sm text-gray-700">
              <p className="font-medium">{job.setting_name}</p>
              {job.setting_address && <p>{job.setting_address}</p>}
              <p>{job.postcode}</p>
              {job.setting_phone && (
                <p className="mt-2 text-[#bf5d9f]">{job.setting_phone}</p>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex gap-3">
            {applicationStatus.hasApplied ? (
              <div className="w-full bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Already applied</span> — Your application is being reviewed.
                </p>
                {applicationStatus.status && (
                  <p className="text-xs text-gray-500 mt-1">
                    Status: <span className="capitalize">{applicationStatus.status}</span>
                  </p>
                )}
              </div>
            ) : job.status !== 'open' ? (
              <div className="w-full bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-700">
                  This job is no longer accepting applications.
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="flex-1 bg-[#bf5d9f] text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {applying ? 'Applying...' : 'Apply for this Job'}
                </button>
                <Link
                  href="/staff/jobs"
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-colors"
                >
                  Back
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400">
          <Link href="/staff/dashboard" className="hover:text-gray-600 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
