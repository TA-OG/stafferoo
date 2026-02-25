'use client';

import { useState } from 'react';
import { StaffProfileBasicsInput } from '@/app/lib/validations/staff';
import SaveProgressButton, { SaveStatus } from './SaveProgressButton';

interface Step2ProfileBasicsProps {
  initialData?: Partial<StaffProfileBasicsInput>;
  onNext: (data: StaffProfileBasicsInput) => void;
  onSave: (data: Partial<StaffProfileBasicsInput>) => void;
  saveStatus: SaveStatus;
  onBack: () => void;
}

const QUALIFICATION_LEVELS = [
  { value: 'level_2',      label: 'Level 2 Early Years' },
  { value: 'level_3',      label: 'Level 3 Early Years' },
  { value: 'level_4_plus', label: 'Level 4 or above' },
  { value: 'unqualified',  label: 'No formal qualification' },
] as const;

export default function Step2ProfileBasics({
  initialData,
  onNext,
  onSave,
  saveStatus,
  onBack,
}: Step2ProfileBasicsProps) {
  const [formData, setFormData] = useState<Partial<StaffProfileBasicsInput>>({
    full_name:                    initialData?.full_name ?? '',
    national_insurance_number:    initialData?.national_insurance_number ?? '',
    date_of_birth:                initialData?.date_of_birth ?? '',
    phone:                        initialData?.phone ?? '',
    address_line_1:               initialData?.address_line_1 ?? '',
    address_line_2:               initialData?.address_line_2 ?? '',
    city:                         initialData?.city ?? '',
    postcode:                     initialData?.postcode ?? '',
    travel_radius_miles:          initialData?.travel_radius_miles ?? 10,
    transport_mode:               initialData?.transport_mode ?? 'public_transport',
    years_experience:             initialData?.years_experience ?? 0,
    qualification_level:          initialData?.qualification_level ?? 'level_2',
    qualification_name:           initialData?.qualification_name ?? '',
    criminal_conviction_declared: initialData?.criminal_conviction_declared,
    criminal_conviction_details:  initialData?.criminal_conviction_details ?? '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  const isUnqualified = formData.qualification_level === 'unqualified';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Hard stop enforced here in addition to disabled button
    if (isUnqualified) return;

    if (!formData.qualification_name?.trim()) {
      setFormError('Please enter the name of your qualification before continuing.');
      return;
    }

    if (formData.criminal_conviction_declared === undefined) {
      setFormError('Please answer the criminal convictions question before continuing.');
      return;
    }

    if (formData.criminal_conviction_declared && !formData.criminal_conviction_details?.trim()) {
      setFormError('Please provide details of your convictions before continuing.');
      return;
    }

    onNext(formData as StaffProfileBasicsInput);
  };

  const inputClass =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c653a0] focus:border-transparent';

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Basics</h2>

      {formError && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Cannot continue:</p>
          <p className="text-sm text-red-700 mt-1">{formError}</p>
        </div>
      )}

      <div className="space-y-6">

        {/* Personal details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className={inputClass}
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
              onChange={(e) =>
                setFormData({ ...formData, national_insurance_number: e.target.value.toUpperCase() })
              }
              placeholder="AB123456C"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
          <input
            type="text"
            value={formData.address_line_1}
            onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
          <input
            type="text"
            value={formData.address_line_2}
            onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postcode *</label>
            <input
              type="text"
              value={formData.postcode}
              onChange={(e) =>
                setFormData({ ...formData, postcode: e.target.value.toUpperCase() })
              }
              placeholder="SW1A 1AA"
              className={inputClass}
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
              onChange={(e) =>
                setFormData({ ...formData, travel_radius_miles: parseInt(e.target.value) })
              }
              min="1"
              max="50"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transport Mode *</label>
            <select
              value={formData.transport_mode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  transport_mode: e.target.value as 'car' | 'public_transport' | 'bicycle' | 'walking',
                })
              }
              className={inputClass}
              required
            >
              <option value="car">Car</option>
              <option value="public_transport">Public Transport</option>
              <option value="bicycle">Bicycle</option>
              <option value="walking">Walking</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience *
          </label>
          <input
            type="number"
            value={formData.years_experience}
            onChange={(e) =>
              setFormData({ ...formData, years_experience: parseInt(e.target.value) })
            }
            min="0"
            max="50"
            className={inputClass}
            required
          />
        </div>

        {/* Qualification */}
        <div className="border border-gray-200 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">
            What full and relevant childcare qualifications do you have? *
          </h3>

          <div className="space-y-3">
            {QUALIFICATION_LEVELS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="qualification_level"
                  value={value}
                  checked={formData.qualification_level === value}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      qualification_level: value,
                      // Clear name when switching to unqualified
                      qualification_name: value === 'unqualified' ? '' : formData.qualification_name,
                    })
                  }
                  className="shrink-0"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          {/* Hard stop for unqualified — MVP phase */}
          {isUnqualified && (
            <div className="rounded-lg bg-amber-50 border border-amber-300 p-4">
              <p className="text-sm font-semibold text-amber-900 mb-1">
                Qualifications required for this phase
              </p>
              <p className="text-sm text-amber-800">
                We currently require a Level 2 or above childcare qualification to join Stafferoo.
                We&apos;re working to open this up to more experience levels &mdash; if you&apos;d
                like us to keep your details on file for when that changes, please reach out to us at{' '}
                <a
                  href="mailto:support@stafferoo.app"
                  className="underline font-medium"
                >
                  support@stafferoo.app
                </a>
                .
              </p>
            </div>
          )}

          {/* Qualification name — required for all qualified levels */}
          {!isUnqualified && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name of qualification *
              </label>
              <input
                type="text"
                value={formData.qualification_name}
                onChange={(e) =>
                  setFormData({ ...formData, qualification_name: e.target.value })
                }
                placeholder="e.g. CACHE Level 3 Diploma in Early Years Education"
                className={inputClass}
                required={!isUnqualified}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the full name as it appears on your certificate.
              </p>
            </div>
          )}
        </div>

        {/* Criminal conviction declaration */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
          <p className="text-sm font-semibold text-gray-800 mb-1">Criminal Convictions *</p>
          <p className="text-xs text-gray-600 mb-4">
            Do you have any spent or unspent criminal convictions, cautions, reprimands, or final
            warnings that you are required to disclose?
          </p>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="criminal_conviction_declared"
                checked={formData.criminal_conviction_declared === false}
                onChange={() =>
                  setFormData({ ...formData, criminal_conviction_declared: false, criminal_conviction_details: '' })
                }
                className="shrink-0"
              />
              <span className="text-sm font-medium text-gray-700">No</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="criminal_conviction_declared"
                checked={formData.criminal_conviction_declared === true}
                onChange={() =>
                  setFormData({ ...formData, criminal_conviction_declared: true })
                }
                className="shrink-0"
              />
              <span className="text-sm font-medium text-gray-700">Yes</span>
            </label>
          </div>

          {formData.criminal_conviction_declared === true && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-600">
                Please provide details including offence type and dates. All disclosures are treated
                in strict confidence and assessed on a case-by-case basis.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conviction details and dates *
                </label>
                <textarea
                  value={formData.criminal_conviction_details}
                  onChange={(e) =>
                    setFormData({ ...formData, criminal_conviction_details: e.target.value })
                  }
                  rows={4}
                  placeholder="Please include offence type, date(s), and any relevant context"
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Action row */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium self-start sm:self-auto"
        >
          ← Back
        </button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <SaveProgressButton
            status={saveStatus}
            onClick={() => onSave(formData)}
            className="justify-center"
          />
          <button
            type="submit"
            disabled={isUnqualified}
            className="w-full sm:w-auto bg-[#c653a0] text-white py-2 px-8 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        </div>
      </div>
    </form>
  );
}
