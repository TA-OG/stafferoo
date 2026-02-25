'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabase';
import { jobRoles, jobRoleLabels, type JobRole } from '@/app/lib/validations/jobs';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_date: '',
    start_time: '08:00',
    end_time: '17:00',
    role_required: 'nursery_practitioner',
    hourly_rate: 22,
    postcode: '',
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/auth?redirectTo=/settings/jobs/new');
        return;
      }

      const res = await fetch('/api/settings/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!json.ok) {
        if (json.error?.details) {
          // Validation errors
          const errors: Record<string, string> = {};
          Object.entries(json.error.details).forEach(([key, msgs]) => {
            errors[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
          });
          setFieldErrors(errors);
        } else {
          setError(json.error?.message || 'Failed to create job');
        }
        setLoading(false);
        return;
      }

      // Success - redirect to jobs list
      router.push('/settings/jobs');
      router.refresh();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  // Calculate shift duration and estimated total
  const calculateDuration = () => {
    const [startHour, startMin] = formData.start_time.split(':').map(Number);
    const [endHour, endMin] = formData.end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationHours = (endMinutes - startMinutes) / 60;
    const total = durationHours * formData.hourly_rate;
    return { durationHours, total };
  };

  const { durationHours, total } = calculateDuration();

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

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
            href="/settings/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <Breadcrumbs
          items={[
            { label: 'Business', href: '/settings/dashboard' },
            { label: 'Jobs', href: '/settings/jobs' },
            { label: 'Post New Job' },
          ]}
        />

        <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">
          Post a New Job
        </h1>
        <p className="text-gray-600 mb-6">
          Fill in the details below to find qualified staff for your shift.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[rgba(180,156,220,0.42)] p-6 space-y-6">
          {/* Job Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Room Leader Needed - Baby Room"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
              required
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the role, responsibilities, and any specific requirements..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
              required
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              {formData.description.length}/2000 characters
            </p>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="job_date" className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="job_date"
              value={formData.job_date}
              min={today}
              onChange={(e) => handleChange('job_date', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
              required
            />
            {fieldErrors.job_date && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.job_date}</p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="start_time"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
                required
              />
            </div>
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="end_time"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
                required
              />
            </div>
          </div>
          {fieldErrors.end_time && (
            <p className="text-xs text-red-600">{fieldErrors.end_time}</p>
          )}

          {/* Role Required */}
          <div>
            <label htmlFor="role_required" className="block text-sm font-medium text-gray-700 mb-1">
              Role Required <span className="text-red-500">*</span>
            </label>
            <select
              id="role_required"
              value={formData.role_required}
              onChange={(e) => handleChange('role_required', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
              required
            >
              {jobRoles.map((role) => (
                <option key={role} value={role}>
                  {jobRoleLabels[role]}
                </option>
              ))}
            </select>
          </div>

          {/* Hourly Rate */}
          <div>
            <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700 mb-1">
              Hourly Rate (£) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="hourly_rate"
              value={formData.hourly_rate}
              onChange={(e) => handleChange('hourly_rate', Number(e.target.value))}
              min={15}
              max={50}
              step={0.5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
              required
            />
            {fieldErrors.hourly_rate && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.hourly_rate}</p>
            )}
          </div>

          {/* Postcode */}
          <div>
            <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
              Postcode (if different from your main address)
            </label>
            <input
              type="text"
              id="postcode"
              value={formData.postcode}
              onChange={(e) => handleChange('postcode', e.target.value.toUpperCase())}
              placeholder="e.g., SW1A 1AA"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
            />
            {fieldErrors.postcode && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.postcode}</p>
            )}
          </div>

          {/* Cost Estimate */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Cost Estimate</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{durationHours.toFixed(1)} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hourly Rate:</span>
                <span className="font-medium">£{formData.hourly_rate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-purple-200 pt-2 mt-2">
                <span className="text-gray-900 font-semibold">Estimated Total:</span>
                <span className="text-[#bf5d9f] font-bold">£{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#bf5d9f] text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Posting Job...' : 'Post Job'}
            </button>
            <Link
              href="/settings/jobs"
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>

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
