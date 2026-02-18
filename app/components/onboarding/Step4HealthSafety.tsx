'use client';

import { useState } from 'react';
import { StaffHealthSafetyInput } from '@/app/lib/validations/staff';

interface Step4HealthSafetyProps {
  initialData?: Partial<StaffHealthSafetyInput>;
  onNext: (data: StaffHealthSafetyInput) => void;
  onBack: () => void;
}

const HEALTH_CONDITIONS = [
  'Epilepsy',
  'Diabetes',
  'Asthma',
  'Heart condition',
  'Back problems',
  'Mental health condition',
  'Allergies',
  'Hearing impairment',
  'Visual impairment',
  'Mobility issues',
  'Skin condition',
  'Infectious disease',
  'Pregnancy',
  'Other',
];

export default function Step4HealthSafety({ initialData, onNext, onBack }: Step4HealthSafetyProps) {
  const [formData, setFormData] = useState<Partial<StaffHealthSafetyInput>>({
    emergency_contact_1_name: initialData?.emergency_contact_1_name || '',
    emergency_contact_1_phone: initialData?.emergency_contact_1_phone || '',
    emergency_contact_1_relationship: initialData?.emergency_contact_1_relationship || '',
    emergency_contact_2_name: initialData?.emergency_contact_2_name || '',
    emergency_contact_2_phone: initialData?.emergency_contact_2_phone || '',
    emergency_contact_2_relationship: initialData?.emergency_contact_2_relationship || '',
    gp_name: initialData?.gp_name || '',
    gp_address: initialData?.gp_address || '',
    health_declaration: initialData?.health_declaration || { conditions: [], notes: '' },
    smoking_declaration: initialData?.smoking_declaration || 'non_smoker',
    drugs_alcohol_declaration: initialData?.drugs_alcohol_declaration || '',
    disqualified_person_declaration: initialData?.disqualified_person_declaration || false,
  });

  const handleHealthConditionToggle = (condition: string) => {
    const currentConditions = formData.health_declaration?.conditions || [];
    const newConditions = currentConditions.includes(condition)
      ? currentConditions.filter(c => c !== condition)
      : [...currentConditions, condition];

    setFormData({
      ...formData,
      health_declaration: {
        ...formData.health_declaration,
        conditions: newConditions,
        notes: formData.health_declaration?.notes || '',
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.disqualified_person_declaration === true) {
      alert('You must not be disqualified from working with children to continue');
      return;
    }

    onNext(formData as StaffHealthSafetyInput);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Health and Safety</h2>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Emergency Contact 1 *</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.emergency_contact_1_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_1_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact_1_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_1_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship *
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_1_relationship}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_1_relationship: e.target.value })}
                  placeholder="e.g., Spouse, Parent"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Emergency Contact 2 (Optional)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.emergency_contact_2_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_2_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact_2_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_2_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_2_relationship}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_2_relationship: e.target.value })}
                  placeholder="e.g., Sibling, Friend"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">GP Details *</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GP Name *
              </label>
              <input
                type="text"
                value={formData.gp_name}
                onChange={(e) => setFormData({ ...formData, gp_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GP Address *
              </label>
              <textarea
                value={formData.gp_address}
                onChange={(e) => setFormData({ ...formData, gp_address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Health Declaration *</h3>
          <p className="text-sm text-gray-600 mb-4">
            Please select any conditions that apply to you. This information is confidential and helps us ensure your safety and the safety of children.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {HEALTH_CONDITIONS.map((condition) => (
              <label key={condition} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.health_declaration?.conditions.includes(condition)}
                  onChange={() => handleHealthConditionToggle(condition)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{condition}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.health_declaration?.notes}
              onChange={(e) => setFormData({
                ...formData,
                health_declaration: {
                  ...formData.health_declaration!,
                  notes: e.target.value,
                },
              })}
              rows={3}
              placeholder="Please provide any additional details about your health conditions"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Lifestyle Declarations *</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Smoking Status *
              </label>
            <select
              value={formData.smoking_declaration}
              onChange={(e) => setFormData({ ...formData, smoking_declaration: e.target.value as 'non_smoker' | 'smoker' | 'ex_smoker' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
                <option value="non_smoker">Non-smoker</option>
                <option value="smoker">Smoker</option>
                <option value="ex_smoker">Ex-smoker</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drugs and Alcohol Declaration *
              </label>
              <textarea
                value={formData.drugs_alcohol_declaration}
                onChange={(e) => setFormData({ ...formData, drugs_alcohol_declaration: e.target.value })}
                rows={3}
                placeholder="Please declare any current or past issues with drugs or alcohol"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={formData.disqualified_person_declaration}
              onChange={(e) => setFormData({ ...formData, disqualified_person_declaration: e.target.checked })}
              className="mt-1 mr-3"
            />
            <span className="text-sm text-gray-700">
              I am disqualified from working with children under the Childcare Disqualification Regulations 2018
            </span>
          </label>
          <p className="text-xs text-gray-600 mt-2 ml-6">
            This box should remain unchecked. If you are disqualified, you cannot proceed with this application.
          </p>
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
