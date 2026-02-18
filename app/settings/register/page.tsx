'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
              value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    try {
      // Validate with Zod
      const validated = settingRegistrationSchema.parse(formData);

      // Submit to API
      const response = await fetch('/api/settings/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Redirect to pending page
      router.push('/settings/pending');
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'errors' in error) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {};
        const zodErrors = (error as { errors: Array<{ path?: string[]; message: string }> }).errors;
        zodErrors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message;
          }
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Register Your Setting
          </h1>
          <p className="text-gray-600 mb-8">
            Complete your registration to start booking emergency staff.
          </p>

          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Setting Name */}
            <div>
              <label htmlFor="setting_name" className="block text-sm font-medium text-gray-700 mb-2">
                Setting Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="setting_name"
                name="setting_name"
                value={formData.setting_name || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Happy Days Nursery"
              />
              {errors.setting_name && (
                <p className="mt-1 text-sm text-red-600">{errors.setting_name}</p>
              )}
            </div>

            {/* Ofsted URN */}
            <div>
              <label htmlFor="ofsted_urn" className="block text-sm font-medium text-gray-700 mb-2">
                Ofsted URN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ofsted_urn"
                name="ofsted_urn"
                value={formData.ofsted_urn || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="EY123456"
                maxLength={8}
              />
              <p className="mt-1 text-sm text-gray-500">Format: EY followed by 6 digits</p>
              {errors.ofsted_urn && (
                <p className="mt-1 text-sm text-red-600">{errors.ofsted_urn}</p>
              )}
            </div>

            {/* Ofsted Rating */}
            <div>
              <label htmlFor="ofsted_rating" className="block text-sm font-medium text-gray-700 mb-2">
                Ofsted Rating
              </label>
              <select
                id="ofsted_rating"
                name="ofsted_rating"
                value={formData.ofsted_rating || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select rating</option>
                <option value="Outstanding">Outstanding</option>
                <option value="Good">Good</option>
                <option value="Requires Improvement">Requires Improvement</option>
                <option value="Inadequate">Inadequate</option>
              </select>
              {errors.ofsted_rating && (
                <p className="mt-1 text-sm text-red-600">{errors.ofsted_rating}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@nursery.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="020 1234 5678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Address Line 1 */}
            <div>
              <label htmlFor="address_line_1" className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address_line_1"
                name="address_line_1"
                value={formData.address_line_1 || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Main Street"
              />
              {errors.address_line_1 && (
                <p className="mt-1 text-sm text-red-600">{errors.address_line_1}</p>
              )}
            </div>

            {/* Address Line 2 */}
            <div>
              <label htmlFor="address_line_2" className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                id="address_line_2"
                name="address_line_2"
                value={formData.address_line_2 || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Suite 100"
              />
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="London"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city}</p>
              )}
            </div>

            {/* Postcode */}
            <div>
              <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">
                Postcode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                value={formData.postcode || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SW1A 1AA"
              />
              {errors.postcode && (
                <p className="mt-1 text-sm text-red-600">{errors.postcode}</p>
              )}
            </div>

            {/* Has Parking */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="has_parking"
                name="has_parking"
                checked={formData.has_parking || false}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="has_parking" className="ml-2 block text-sm text-gray-700">
                Parking available on site
              </label>
            </div>

            {/* Number of Children */}
            <div>
              <label htmlFor="number_of_children" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Children
              </label>
              <input
                type="number"
                id="number_of_children"
                name="number_of_children"
                value={formData.number_of_children || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="30"
                min="1"
              />
              {errors.number_of_children && (
                <p className="mt-1 text-sm text-red-600">{errors.number_of_children}</p>
              )}
            </div>

            {/* Team Size */}
            <div>
              <label htmlFor="team_size" className="block text-sm font-medium text-gray-700 mb-2">
                Team Size
              </label>
              <input
                type="number"
                id="team_size"
                name="team_size"
                value={formData.team_size || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5"
                min="1"
              />
              {errors.team_size && (
                <p className="mt-1 text-sm text-red-600">{errors.team_size}</p>
              )}
            </div>

            {/* Operation Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="operation_hours_start" className="block text-sm font-medium text-gray-700 mb-2">
                  Opening Time
                </label>
                <input
                  type="time"
                  id="operation_hours_start"
                  name="operation_hours_start"
                  value={formData.operation_hours_start || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="operation_hours_end" className="block text-sm font-medium text-gray-700 mb-2">
                  Closing Time
                </label>
                <input
                  type="time"
                  id="operation_hours_end"
                  name="operation_hours_end"
                  value={formData.operation_hours_end || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
