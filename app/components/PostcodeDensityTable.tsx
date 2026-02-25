'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export interface PostcodeRow {
  postcode:       string;
  staff_count:    number;
  settings_count: number;
  enabled:        boolean | null; // null = not in enabled_postcodes table
  notes:          string | null;
}

type SortKey = 'postcode' | 'staff_count' | 'settings_count';

interface Props {
  rows:        PostcodeRow[];
  currentSort: string;
  currentDir:  string;
}

export default function PostcodeDensityTable({ rows, currentSort, currentDir }: Props) {
  const router   = useRouter();
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (postcode: string, currentEnabled: boolean | null) => {
    setToggling(postcode);
    try {
      const res = await fetch('/api/admin/postcodes/toggle', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          postcode,
          enabled: !(currentEnabled ?? false), // null → treat as disabled, so toggle to enabled
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? 'Toggle failed');
      }
      router.refresh(); // re-runs the server component to pull fresh data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Toggle failed';
      alert(message);
    } finally {
      setToggling(null);
    }
  };

  // Build href for a column sort link — flips direction if already sorted by that column.
  const sortHref = (col: SortKey): string => {
    const newDir = currentSort === col && currentDir === 'asc' ? 'desc' : 'asc';
    return `?sort=${col}&dir=${newDir}`;
  };

  const sortIndicator = (col: SortKey): string =>
    currentSort === col ? (currentDir === 'asc' ? ' ↑' : ' ↓') : '';

  const thClass =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const tdClass = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className={thClass}>
              <Link href={sortHref('postcode')} className="hover:text-gray-700">
                Postcode{sortIndicator('postcode')}
              </Link>
            </th>
            <th className={thClass}>
              <Link href={sortHref('staff_count')} className="hover:text-gray-700">
                Approved Staff{sortIndicator('staff_count')}
              </Link>
            </th>
            <th className={thClass}>
              <Link href={sortHref('settings_count')} className="hover:text-gray-700">
                Approved Businesses{sortIndicator('settings_count')}
              </Link>
            </th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Notes</th>
            <th className={thClass}>Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row) => {
            const isEnabled    = row.enabled === true;
            const isNotListed  = row.enabled === null;
            const isProcessing = toggling === row.postcode;

            return (
              <tr key={row.postcode} className="hover:bg-gray-50">
                <td className={`${tdClass} font-mono font-semibold`}>
                  {row.postcode}
                </td>
                <td className={`${tdClass} text-center`}>
                  {row.staff_count}
                </td>
                <td className={`${tdClass} text-center`}>
                  {row.settings_count}
                </td>
                <td className={tdClass}>
                  {isNotListed ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                      Not Listed
                    </span>
                  ) : isEnabled ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Enabled
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Disabled
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {row.notes ?? '—'}
                </td>
                <td className={tdClass}>
                  <button
                    onClick={() => handleToggle(row.postcode, row.enabled)}
                    disabled={isProcessing}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isEnabled
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {isProcessing ? 'Saving…' : isEnabled ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
