'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { settingRegistrationSchema, type SettingRegistrationInput } from '@/app/lib/validations/setting';

export default function SettingsRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<SettingRegistrationInput>>({
    has_parking: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? (value ? parseInt(value) : undefined) :
              value,
    }));
    if (errors[name]) {
      setErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const validated = settingRegistrationSchema.parse(formData);
      const response = await fetch('/api/settings/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      router.push('/settings/pending');
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'errors' in error) {
        const fieldErrors: Record<string, string> = {};
        (error as { errors: Array<{ path?: string[]; message: string }> }).errors.forEach((err) => {
          if (err.path && err.path.length > 0) fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        setSubmitError(error.message || 'An error occurred');
      } else {
        setSubmitError('An error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inp = (id: string, label: string, required = false, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id} name={id}
        value={(formData as Record<string, string | number | boolean | undefined>)[id]?.toString() ?? ''}
        onChange={handleChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#b49cdc] focus:border-transparent"
        {...extra}
      />
      {errors[id] && <p className="mt-1 text-xs text-red-600">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f0f5] py-10 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <Image src="/stafferoo-logo.png" alt="Stafferoo" width={180} height={55} priority className="object-contain" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[rgba(180,156,220,0.42)] p-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
            Register your Early Years Childcare Business
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Tell us about your setting. We&apos;ll review your registration and be in touch within 1 working day.
          </p>

          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {inp('setting_name', 'Setting name', true, { placeholder: 'Happy Days Nursery' })}
            {inp('manager_name', 'Manager name', true, { placeholder: 'Jane Smith' })}
            {inp('ofsted_urn', 'Ofsted URN', true, { placeholder: 'EY123456', maxLength: 8 })}
            <p className="-mt-3 text-xs text-gray-400">Format: EY followed by 6 digits</p>

            <div>
              <label htmlFor="ofsted_rating" className="block text-sm font-medium text-gray-700 mb-1">
                Ofsted rating
              </label>
              <select id="ofsted_rating" name="ofsted_rating" value={formData.ofsted_rating ?? ''} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#b49cdc] focus:border-transparent">
                <option value="">Select rating</option>
                <option value="Outstanding">Outstanding</option>
                <option value="Good">Good</option>
                <option value="Requires Improvement">Requires Improvement</option>
                <option value="Inadequate">Inadequate</option>
              </select>
              {errors.ofsted_rating && <p className="mt-1 text-xs text-red-600">{errors.ofsted_rating}</p>}
            </div>

            {inp('email', 'Email address', true, { type: 'email', placeholder: 'manager@nursery.com' })}
            {inp('phone', 'Phone number', true, { type: 'tel', placeholder: '020 1234 5678' })}
            {inp('address_line_1', 'Address line 1', true, { placeholder: '123 Main Street' })}
            {inp('address_line_2', 'Address line 2', false, { placeholder: 'Apartment / Floor (optional)' })}

            <div className="grid grid-cols-2 gap-4">
              {inp('city', 'City', true, { placeholder: 'London' })}
              {inp('postcode', 'Postcode', true, { placeholder: 'SW1A 1AA' })}
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="has_parking" name="has_parking"
                checked={formData.has_parking ?? false} onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-[#bf5d9f] focus:ring-[#b49cdc]" />
              <label htmlFor="has_parking" className="text-sm text-gray-700">Parking available on site</label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {inp('number_of_children', 'Number of children', false, { type: 'number', placeholder: '30', min: '1' })}
              {inp('team_size', 'Team size', false, { type: 'number', placeholder: '5', min: '1' })}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="operation_hours_start" className="block text-sm font-medium text-gray-700 mb-1">Opening time</label>
                <input type="time" id="operation_hours_start" name="operation_hours_start"
                  value={formData.operation_hours_start ?? ''} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#b49cdc] focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="operation_hours_end" className="block text-sm font-medium text-gray-700 mb-1">Closing time</label>
                <input type="time" id="operation_hours_end" name="operation_hours_end"
                  value={formData.operation_hours_end ?? ''} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#b49cdc] focus:border-transparent" />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full bg-[#bf5d9f] text-white py-3 px-6 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity mt-2">
              {isSubmitting ? 'Submitting\u2026' : 'Submit registration'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/auth" className="text-[#bf5d9f] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
