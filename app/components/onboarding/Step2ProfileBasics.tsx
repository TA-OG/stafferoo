'use client';

import { useState } from 'react';
import { StaffProfileBasicsInput } from '@/app/lib/validations/staff';

interface Step2ProfileBasicsProps {
  initialData?: Partial<StaffProfileBasicsInput>;
  onNext: (data: StaffProfileBasicsInput) => void;
  onBack: () => void;
}

export default function Step2ProfileBasics({ initialData, onNext, onBack }: Step2ProfileBasicsProps) {
  const [formData, setFormData] = useState<Partial<StaffProfileBasicsInput>>({
    full_name: initialData?.full_name || '',
    national_insurance_number: initialData?.national_insurance_number || '',
    date_of_birth: initialData?.date_of_birth || '',
    phone: initialData?.phone || '',
    address_line_1: initialData?.address_line_1 || '',
    address_line_2: initialData?.address_line_2 || '',
    city: initialData?.city || '',
    postcode: initialData?.postcode || '',
    travel_radius_miles: initialData?.travel_radius_miles || 10,
    transport_mode: initialData?.transport_mode || 'public_transport',
    years_experience: initialData?.years_experience || 0,
    qualification_level: initialData?.qualification_level || 'level_2',
    criminal_conviction_declared: initialData?.criminal_conviction_declared || false,
    criminal_conviction_details: initialData?.criminal_conviction_details || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      onNext(formData as StaffProfileBasicsInput);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Basics</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              National Insurance Number
            </label>
            <input
              type="text"
              value={formData.national_insurance_number}
              onChange={(e) => setFormData({ ...formData, national_insurance_number: e.target.value.toUpperCase() })}
              placeholder="AB123456C"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth *
            </label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address Line 1 *
          </label>
          <input
            type="text"
            value={formData.address_line_1}
            onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address Line 2
          </label>
          <input
            type="text"
            value={formData.address_line_2}
            onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postcode *
            </label>
            <input
              type="text"
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value.toUpperCase() })}
              placeholder="SW1A 1AA"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Travel Radius (miles) *
            </label>
            <input
              type="number"
              value={formData.travel_radius_miles}
              onChange={(e) => setFormData({ ...formData, travel_radius_miles: parseInt(e.target.value) })}
              min="1"
              max="50"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transport Mode *
            </label>
            <select
              value={formData.transport_mode}
              onChange={(e) => setFormData({ ...formData, transport_mode: e.target.value as 'car' | 'public_transport' | 'bicycle' | 'walking' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="car">Car</option>
              <option value="public_transport">Public Transport</option>
              <option value="bicycle">Bicycle</option>
              <option value="walking">Walking</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience *
            </label>
            <input
              type="number"
              value={formData.years_experience}
              onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) })}
              min="0"
              max="50"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qualification Level *
            </label>
            <select
              value={formData.qualification_level}
              onChange={(e) => setFormData({ ...formData, qualification_level: e.target.value as 'level_2' | 'level_3' | 'level_4_plus' | 'unqualified' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="level_2">Level 2</option>
              <option value="level_3">Level 3</option>
              <option value="level_4_plus">Level 4+</option>
              <option value="unqualified">Unqualified</option>
            </select>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={formData.criminal_conviction_declared}
              onChange={(e) => setFormData({ ...formData, criminal_conviction_declared: e.target.checked })}
              className="mt-1 mr-3"
            />
            <span className="text-sm text-gray-700">
              I have a criminal conviction that I need to declare
            </span>
          </label>

          {formData.criminal_conviction_declared && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please provide details *
              </label>
              <textarea
                value={formData.criminal_conviction_details}
                onChange={(e) => setFormData({ ...formData, criminal_conviction_details: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={formData.criminal_conviction_declared}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </form>
  );
}
