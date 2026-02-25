import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase-server';
import { isCurrentUserAdmin } from '@/app/lib/admin';
import StaffVerificationCard from '@/app/components/StaffVerificationCard';
import PageHeader from '@/app/components/PageHeader';

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminStaff({ searchParams }: PageProps) {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect('/');
  }

  const params = await searchParams;
  const statusFilter = params.status || 'pending';

  const supabase = await createClient();
  
  // Build query based on filter
  let query = supabase
    .from('staff_profiles')
    .select('*, staff_documents(id, doc_type, status)')
    .order('created_at', { ascending: false });

  if (statusFilter === 'incomplete') {
    // incomplete = null or 'incomplete' status
    query = query.or('verification_status.is.null,verification_status.eq.incomplete');
  } else if (statusFilter !== 'all') {
    query = query.eq('verification_status', statusFilter);
  }

  const { data: staffList, error } = await query;

  if (error) {
    console.error('Error fetching staff:', error);
  }

  // Get counts for each status
  const { data: allStaff } = await supabase
    .from('staff_profiles')
    .select('verification_status');

  const counts = allStaff?.reduce((acc, s) => {
    const status = s.verification_status || 'incomplete';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const pendingCount = counts['pending'] || 0;
  const approvedCount = counts['approved'] || 0;
  const rejectedCount = counts['rejected'] || 0;
  const incompleteCount = counts['incomplete'] || 0;
  const totalCount = allStaff?.length || 0;

  const filterLabels: Record<string, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    incomplete: 'Incomplete',
    all: 'All Staff',
  };

  return (
    <>
      <PageHeader />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Admin navigation */}
          <nav className="flex gap-6 mb-6 text-sm">
            <Link href="/admin/staff" className="text-gray-900 font-semibold border-b-2 border-gray-900 pb-0.5">
              Staff Queue
            </Link>
            <Link href="/admin/settings" className="text-blue-600 hover:text-blue-700 font-medium">
              Settings Queue
            </Link>
            <Link href="/admin/postcodes" className="text-blue-600 hover:text-blue-700 font-medium">
              Postcode Density
            </Link>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Staff Verification Queue
            </h1>
            <p className="text-gray-600">
              Review and manage staff applications
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-wrap border-b border-gray-200">
              <Link
                href="/admin/staff?status=pending"
                className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending ({pendingCount})
              </Link>
              <Link
                href="/admin/staff?status=incomplete"
                className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === 'incomplete'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Incomplete ({incompleteCount})
              </Link>
              <Link
                href="/admin/staff?status=approved"
                className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === 'approved'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Approved ({approvedCount})
              </Link>
              <Link
                href="/admin/staff?status=rejected"
                className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === 'rejected'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Rejected ({rejectedCount})
              </Link>
              <Link
                href="/admin/staff?status=all"
                className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === 'all'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All ({totalCount})
              </Link>
            </div>
          </div>

          {/* Results */}
          {!staffList || staffList.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 mb-2">
                No {filterLabels[statusFilter]?.toLowerCase()} staff applications found
              </p>
              {statusFilter === 'pending' && (
                <p className="text-sm text-gray-400">
                  When staff complete onboarding and submit their application, they will appear here.
                </p>
              )}
              {statusFilter === 'incomplete' && (
                <p className="text-sm text-gray-400">
                  Staff who started but haven&apos;t submitted their application will appear here.
                </p>
              )}
              {statusFilter === 'all' && totalCount === 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  No staff have registered yet. Staff will appear here after they sign up and complete onboarding.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {staffList.map((staff) => (
                <StaffVerificationCard key={staff.id} staff={staff} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
