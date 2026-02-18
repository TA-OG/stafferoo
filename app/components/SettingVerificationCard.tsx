'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Setting {
  id: string;
  setting_name: string;
  ofsted_urn: string;
  ofsted_rating?: string;
  email: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postcode: string;
  has_parking: boolean;
  number_of_children?: number;
  team_size?: number;
  operation_hours_start?: string;
  operation_hours_end?: string;
  created_at: string;
}

interface Props {
  setting: Setting;
}

export default function SettingVerificationCard({ setting }: Props) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState<'approve' | 'reject' | null>(null);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !notes.trim()) {
      alert('Please provide rejection notes');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/admin/settings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setting_id: setting.id,
          action,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Action failed');
      }

      // Refresh the page to update the list
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Action failed';
      alert(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {setting.setting_name}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Ofsted URN:</span>
                <span className="ml-2 font-medium">{setting.ofsted_urn}</span>
              </div>
              {setting.ofsted_rating && (
                <div>
                  <span className="text-gray-500">Rating:</span>
                  <span className="ml-2 font-medium">{setting.ofsted_rating}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 font-medium">{setting.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <span className="ml-2 font-medium">{setting.phone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Address:</span>
                <span className="ml-2 font-medium">
                  {setting.address_line_1}
                  {setting.address_line_2 && `, ${setting.address_line_2}`}
                  , {setting.city}, {setting.postcode}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Registered:</span>
                <span className="ml-2 font-medium">{formatDate(setting.created_at)}</span>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Parking:</span>
                    <span className="ml-2 font-medium">
                      {setting.has_parking ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {setting.number_of_children && (
                    <div>
                      <span className="text-gray-500">Children:</span>
                      <span className="ml-2 font-medium">{setting.number_of_children}</span>
                    </div>
                  )}
                  {setting.team_size && (
                    <div>
                      <span className="text-gray-500">Team Size:</span>
                      <span className="ml-2 font-medium">{setting.team_size}</span>
                    </div>
                  )}
                  {setting.operation_hours_start && setting.operation_hours_end && (
                    <div>
                      <span className="text-gray-500">Hours:</span>
                      <span className="ml-2 font-medium">
                        {setting.operation_hours_start} - {setting.operation_hours_end}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        </div>

        {showNotesInput && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {showNotesInput === 'reject' ? 'Rejection Reason (Required)' : 'Notes (Optional)'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder={showNotesInput === 'reject' ? 'Please provide a reason for rejection' : 'Add any notes...'}
            />
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {showNotesInput === 'approve' ? (
            <>
              <button
                onClick={() => handleAction('approve')}
                disabled={isProcessing}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Confirm Approval'}
              </button>
              <button
                onClick={() => {
                  setShowNotesInput(null);
                  setNotes('');
                }}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : showNotesInput === 'reject' ? (
            <>
              <button
                onClick={() => handleAction('reject')}
                disabled={isProcessing || !notes.trim()}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowNotesInput(null);
                  setNotes('');
                }}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowNotesInput('approve')}
                disabled={isProcessing}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => setShowNotesInput('reject')}
                disabled={isProcessing}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
