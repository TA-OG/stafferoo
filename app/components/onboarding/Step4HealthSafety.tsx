'use client';

import { useState } from 'react';
import { StaffHealthSafetyInput } from '@/app/lib/validations/staff';
import SaveProgressButton, { SaveStatus } from './SaveProgressButton';

interface Step4HealthSafetyProps {
  initialData?: Partial<StaffHealthSafetyInput>;
  onNext: (data: StaffHealthSafetyInput) => void;
  onSave: (data: Partial<StaffHealthSafetyInput>) => void;
  saveStatus: SaveStatus;
  onBack: () => void;
}

/** Reusable Yes/No radio pair */
function YesNoField({
  name,
  question,
  value,
  onChange,
}: {
  name: string;
  question: string;
  value: boolean | undefined;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-800">{question}</p>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === false}
            onChange={() => onChange(false)}
            required
            className="shrink-0"
          />
          <span className="text-sm text-gray-700">No</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === true}
            onChange={() => onChange(true)}
            className="shrink-0"
          />
          <span className="text-sm text-gray-700">Yes</span>
        </label>
      </div>
    </div>
  );
}

export default function Step4HealthSafety({
  initialData,
  onNext,
  onSave,
  saveStatus,
  onBack,
}: Step4HealthSafetyProps) {
  const [formData, setFormData] = useState<Partial<StaffHealthSafetyInput>>({
    emergency_contact_1_name:         initialData?.emergency_contact_1_name ?? '',
    emergency_contact_1_phone:        initialData?.emergency_contact_1_phone ?? '',
    emergency_contact_1_relationship: initialData?.emergency_contact_1_relationship ?? '',
    emergency_contact_2_name:         initialData?.emergency_contact_2_name ?? '',
    emergency_contact_2_phone:        initialData?.emergency_contact_2_phone ?? '',
    emergency_contact_2_relationship: initialData?.emergency_contact_2_relationship ?? '',
    gp_name:                          initialData?.gp_name ?? '',
    gp_address:                       initialData?.gp_address ?? '',
    health_declaration: initialData?.health_declaration ?? {
      has_disability:      false,
      needs_adjustments:   false,
      has_health_concerns: false,
      notes:               '',
    },
    smoking_declaration:             initialData?.smoking_declaration ?? 'non_smoker',
    drugs_alcohol_declaration:       initialData?.drugs_alcohol_declaration ?? false,
    disqualified_person_declaration: initialData?.disqualified_person_declaration ?? false,
  });

  const [formError, setFormError] = useState<string | null>(null);

  const healthDecl = formData.health_declaration ?? {
    has_disability:      false,
    needs_adjustments:   false,
    has_health_concerns: false,
    notes:               '',
  };

  const setHealthField = (field: string, val: boolean | string) => {
    setFormData({
      ...formData,
      health_declaration: { ...healthDecl, [field]: val },
    });
  };

  const showHealthNotes =
    healthDecl.has_disability ||
    healthDecl.needs_adjustments ||
    healthDecl.has_health_concerns;

  const isBlocked =
    formData.disqualified_person_declaration === true ||
    formData.drugs_alcohol_declaration === true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Hard stops — belt-and-braces (button is also disabled)
    if (formData.disqualified_person_declaration === true) {
      setFormError(
        'You must not be disqualified from working with children to continue. ' +
        'If you answered in error, please select No.'
      );
      return;
    }
    if (formData.drugs_alcohol_declaration === true) {
      setFormError(
        'Unfortunately you cannot proceed if you have current or past issues with drugs or alcohol. ' +
        'Please contact support@stafferoo.app if you need assistance.'
      );
      return;
    }

    onNext(formData as StaffHealthSafetyInput);
  };

  const inputClass =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c653a0] focus:border-transparent';

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Health and Safety</h2>

      {formError && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Cannot continue:</p>
          <p className="text-sm text-red-700 mt-1">{formError}</p>
        </div>
      )}

      <div className="space-y-6">

        {/* Emergency Contact 1 */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Emergency Contact 1 *</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.emergency_contact_1_name}
                onChange={(e) =>
                  setFormData({ ...formData, emergency_contact_1_name: e.target.value })
                }
                className={inputClass}
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
                  onChange={(e) =>
                    setFormData({ ...formData, emergency_contact_1_phone: e.target.value })
                  }
                  className={inputClass}
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
                  onChange={(e) =>
                    setFormData({ ...formData, emergency_contact_1_relationship: e.target.value })
                  }
                  placeholder="e.g. Spouse, Parent"
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact 2 */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Emergency Contact 2 (Optional)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.emergency_contact_2_name}
                onChange={(e) =>
                  setFormData({ ...formData, emergency_contact_2_name: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.emergency_contact_2_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, emergency_contact_2_phone: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                <input
                  type="text"
                  value={formData.emergency_contact_2_relationship}
                  onChange={(e) =>
                    setFormData({ ...formData, emergency_contact_2_relationship: e.target.value })
                  }
                  placeholder="e.g. Sibling, Friend"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* GP Details */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">GP Details *</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GP Name *</label>
              <input
                type="text"
                value={formData.gp_name}
                onChange={(e) => setFormData({ ...formData, gp_name: e.target.value })}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GP Address *</label>
              <textarea
                value={formData.gp_address}
                onChange={(e) => setFormData({ ...formData, gp_address: e.target.value })}
                rows={3}
                className={inputClass}
                required
              />
            </div>
          </div>
        </div>

        {/* Health Declaration */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-2">Health Declaration *</h3>
          <p className="text-sm text-gray-600 mb-5">
            This information is confidential and used solely to ensure your safety and the safety
            of the children in your care.
          </p>

          <div className="border border-gray-200 rounded-lg p-5 space-y-6">
            <YesNoField
              name="has_disability"
              question="Do you have any disabilities?"
              value={healthDecl.has_disability}
              onChange={(val) => setHealthField('has_disability', val)}
            />

            <div className="border-t border-gray-100 pt-5">
              <YesNoField
                name="needs_adjustments"
                question="Do you need any support or adjustments to complete your job?"
                value={healthDecl.needs_adjustments}
                onChange={(val) => setHealthField('needs_adjustments', val)}
              />
            </div>

            <div className="border-t border-gray-100 pt-5">
              <YesNoField
                name="has_health_concerns"
                question="Do you have any health concerns or implications we should be aware of?"
                value={healthDecl.has_health_concerns}
                onChange={(val) => setHealthField('has_health_concerns', val)}
              />
            </div>

            {/* Additional notes — only shown when at least one answer is Yes */}
            {showHealthNotes && (
              <div className="border-t border-gray-100 pt-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please provide further details
                </label>
                <textarea
                  value={healthDecl.notes ?? ''}
                  onChange={(e) => setHealthField('notes', e.target.value)}
                  rows={4}
                  placeholder="Please provide any relevant details to help us support you"
                  className={inputClass}
                />
              </div>
            )}
          </div>
        </div>

        {/* Lifestyle Declarations */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Lifestyle Declarations *</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Smoking Status *
              </label>
              <select
                value={formData.smoking_declaration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smoking_declaration: e.target.value as 'non_smoker' | 'smoker' | 'ex_smoker',
                  })
                }
                className={inputClass}
                required
              >
                <option value="non_smoker">Non-smoker</option>
                <option value="smoker">Smoker</option>
                <option value="ex_smoker">Ex-smoker</option>
              </select>
            </div>

            {/* Drugs/alcohol — hard stop if Yes */}
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-5">
              <YesNoField
                name="drugs_alcohol"
                question="Do you have any current or past issues with drugs or alcohol?"
                value={formData.drugs_alcohol_declaration}
                onChange={(val) =>
                  setFormData({ ...formData, drugs_alcohol_declaration: val })
                }
              />

              {formData.drugs_alcohol_declaration === true && (
                <div className="mt-4 rounded-lg bg-red-100 border border-red-300 p-4">
                  <p className="text-sm font-semibold text-red-800 mb-1">
                    ⚠️ Application Cannot Proceed
                  </p>
                  <p className="text-sm text-red-700">
                    Unfortunately, if you have current or past issues with drugs or alcohol, you
                    cannot proceed with this application at this time. Please reach out to us at{' '}
                    <a href="mailto:support@stafferoo.app" className="underline font-medium">
                      support@stafferoo.app
                    </a>{' '}
                    if you need assistance.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Disqualification — hard stop if Yes */}
        <div className="rounded-lg bg-red-50 border border-red-200 p-5">
          <YesNoField
            name="disqualified"
            question="Are you disqualified from working with children under the Childcare Disqualification Regulations 2018?"
            value={formData.disqualified_person_declaration}
            onChange={(val) =>
              setFormData({ ...formData, disqualified_person_declaration: val })
            }
          />

          {formData.disqualified_person_declaration === true && (
            <div className="mt-4 rounded-lg bg-red-100 border border-red-300 p-4">
              <p className="text-sm font-semibold text-red-800 mb-1">
                ⚠️ Application Cannot Proceed
              </p>
              <p className="text-sm text-red-700">
                If you are disqualified from working with children under the Childcare
                Disqualification Regulations 2018, you cannot proceed with this application.
                Please contact{' '}
                <a href="mailto:support@stafferoo.app" className="underline font-medium">
                  support@stafferoo.app
                </a>{' '}
                if you believe this is an error.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Action row */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          <SaveProgressButton
            status={saveStatus}
            onClick={() => onSave(formData)}
          />
          <button
            type="submit"
            disabled={isBlocked}
            className="bg-[#c653a0] text-white py-2 px-8 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        </div>
      </div>
    </form>
  );
}
