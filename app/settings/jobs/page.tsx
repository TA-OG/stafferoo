'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabase';
import { jobRoleLabels, type JobRole } from '@/app/lib/validations/jobs';
import Breadcrumbs from '@/app/components/Breadcrumbs';

interface JobRequest {
  id: string;
  title: string;
  description: string;
  job_date: string;
  start_time: string;
  end_time: string;
  role_required: string;
  hourly_rate: number;
  estimated_total: number;
  status: 'draft' | 'open' | 'filled' | 'cancelled' | 'completed';
  created_at: string;
  response_count: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    open: 'bg-green-100 text-green-700',
    filled: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-purple-100 text-purple-700',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    open: 'Open',
    filled: 'Filled',
    cancelled: 'Cancelled',
    completed: 'Completed',
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }

      const res = await fetch('/api/settings/jobs', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message || 'Failed to load jobs');
        return;
      }

      setJobs(json.data?.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
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
            href="/settings/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <Breadcrumbs
          items={[
            { label: 'Business', href: '/settings/dashboard' },
            { label: 'My Jobs' },
          ]}
        />

        {/* Page Header */}
        <div className="flex items-center justify-between mt-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Job Postings</h1>
            <p className="text-gray-600 mt-1">
              Manage your open shifts and view applications.
            </p>
          </div>
          <Link
            href="/settings/jobs/new"
            className="bg-[#bf5d9f] text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span>+</span>
            Post New Job
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Jobs List */}
        {loading ? (
          <div className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bf5d9f] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#bf5d9f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No jobs posted yet</h2>
            <p className="text-gray-600 mb-6">
              Start posting shifts to find qualified staff for your nursery.
            </p>
            <Link
              href="/settings/jobs/new"
              className="inline-block bg-[#bf5d9f] text-white font-semibold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity"
            >
              Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                        {statusLabels[job.status]}
                      </span>
                      <span className="text-sm text-gray-500">
                        Posted {formatDate(job.created_at)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(job.job_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(job.start_time)} - {formatTime(job.end_time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {jobRoleLabels[(job.role_required as JobRole) || 'nursery_practitioner'] || job.role_required}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        £{job.hourly_rate}/hr
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 text-right shrink-0">
                    <p className="text-lg font-bold text-[#bf5d9f]">
                      £{job.estimated_total?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-500">estimated total</p>
                    <div className="mt-2 space-y-1">
                      <Link
                        href={`/settings/jobs/${job.id}/applicants`}
                        className="block text-sm font-medium text-green-600 hover:text-green-700 hover:underline"
                      >
                        {job.response_count > 0 
                          ? `View ${job.response_count} Applicant${job.response_count !== 1 ? 's' : ''} →`
                          : 'View Applicants →'
                        }
                      </Link>
                      <Link
                        href={`/settings/jobs/${job.id}`}
                        className="block text-sm text-gray-500 hover:text-gray-700 hover:underline"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                </div>
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
