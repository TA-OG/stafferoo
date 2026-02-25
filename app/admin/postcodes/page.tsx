import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/app/lib/supabase-server';
import { isCurrentUserAdmin } from '@/app/lib/admin';
import PostcodeDensityTable, { type PostcodeRow } from '@/app/components/PostcodeDensityTable';

type SortKey = 'postcode' | 'staff_count' | 'settings_count';
const VALID_SORT_KEYS: SortKey[] = ['postcode', 'staff_count', 'settings_count'];

export default async function AdminPostcodesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect('/');
  }

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase.rpc('get_postcode_density');

  if (error) {
    console.error('[/admin/postcodes] get_postcode_density failed:', error.message);
  }

  const { sort: rawSort = 'postcode', dir: rawDir = 'asc' } = await searchParams;

  // Validate sort params to keep TypeScript strict happy and prevent injection.
  const sortKey: SortKey = VALID_SORT_KEYS.includes(rawSort as SortKey)
    ? (rawSort as SortKey)
    : 'postcode';
  const sortDir = rawDir === 'desc' ? 'desc' : 'asc';

  const sorted = [...((rows as PostcodeRow[]) ?? [])].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc'
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Admin navigation */}
        <nav className="flex gap-6 mb-6 text-sm">
          <Link href="/admin/staff" className="text-blue-600 hover:text-blue-700 font-medium">
            Staff Queue
          </Link>
          <Link href="/admin/settings" className="text-blue-600 hover:text-blue-700 font-medium">
            Business Queue
          </Link>
          <Link href="/admin/postcodes" className="text-gray-900 font-semibold border-b-2 border-gray-900 pb-0.5">
            Postcode Density
          </Link>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Postcode Density
          </h1>
          <p className="text-gray-600">
            Approved staff and businesses by postcode. Enable or disable postcode access for business registration.
          </p>
        </div>

        {sorted.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No postcode data yet — staff and businesses will appear here once approved.</p>
          </div>
        ) : (
          <PostcodeDensityTable
            rows={sorted}
            currentSort={sortKey}
            currentDir={sortDir}
          />
        )}
      </div>
    </div>
  );
}
