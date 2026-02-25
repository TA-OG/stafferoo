'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { jobRoles, jobRoleLabels, type JobRole } from '@/app/lib/validations/jobs';
import Breadcrumbs from '@/app/components/Breadcrumbs';

interface Job {
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
  role_label: string;
  setting_name: string;
  setting_ofsted_rating: string | null;
  setting_address: string;
  created_at: string;
}

export default function StaffJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    role: 'all',
    date_from: '',
    date_to: '',
    postcode: '',
  });

  useEffect(() => {
    loadJobs();
  }, [filters]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/auth?redirectTo=/staff/jobs');
        return;
      }

      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.role && filters.role !== 'all') params.set('role', filters.role);
      if (filters.date_from) params.set('date_from', filters.date_from);
      if (filters.date_to) params.set('date_to', filters.date_to);
      if (filters.postcode) params.set('postcode', filters.postcode);

      const res = await fetch(`/api/staff/jobs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await res.json();

      if (!json.ok) {
        if (json.error?.code === 'NOT_VERIFIED') {
          setError('You need to be verified before you can browse jobs. Please wait for admin approval.');
        } else {
          setError(json.error?.message || 'Failed to load jobs');
        }
        setJobs([]);
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

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

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
            { label: 'Browse Jobs' },
          ]}
        />

        <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">
          Browse Available Jobs
        </h1>
        <p className="text-gray-600 mb-6">
          Find shifts that match your skills and availability.
        </p>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Role Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
              >
                <option value="all">All Roles</option>
                {jobRoles.map((role) => (
                  <option key={role} value={role}>
                    {jobRoleLabels[role]}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.date_from}
                min={today}
                onChange={(e) => setFilters(f => ({ ...f, date_from: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.date_to}
                min={filters.date_from || today}
                onChange={(e) => setFilters(f => ({ ...f, date_to: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
              />
            </div>

            {/* Postcode */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Postcode Area
              </label>
              <input
                type="text"
                value={filters.postcode}
                onChange={(e) => setFilters(f => ({ ...f, postcode: e.target.value.toUpperCase() }))}
                placeholder="e.g. SW1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
              />
            </div>
          </div>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h2>
            <p className="text-gray-600">
              Try adjusting your filters or check back later for new opportunities.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/staff/jobs/${job.id}`}
                className="block bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {job.title}
                      </h3>
                      {job.setting_ofsted_rating && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Ofsted {job.setting_ofsted_rating}
                        </span>
                      )}
                    </div>

                    {/* Setting info */}
                    <p className="text-sm text-gray-600 mb-3">
                      {job.setting_name}
                      {job.setting_address && ` • ${job.setting_address}`}
                    </p>

                    {/* Job details */}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        £{job.hourly_rate}/hr
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.postcode}
                      </span>
                    </div>
                  </div>

                  {/* Right side - Rate and CTA */}
                  <div className="ml-4 text-right shrink-0">
                    <p className="text-lg font-bold text-[#bf5d9f]">
                      £{job.estimated_total?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {calculateDuration(job.start_time, job.end_time)} hrs
                    </p>
                    <span className="mt-2 inline-block text-sm text-[#bf5d9f] font-medium">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
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
