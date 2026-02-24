import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/app/lib/supabase-server';
import { isCurrentUserAdmin } from '@/app/lib/admin';
import StaffDetailVerification from '@/app/components/StaffDetailVerification';
import PageHeader from '@/app/components/PageHeader';

export default async function AdminStaffDetail({ params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect('/');
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: staff, error } = await supabase
    .from('staff_profiles')
    .select('*, staff_documents(*), staff_verifications(*)')
    .eq('id', id)
    .single();

  if (error || !staff) {
    return (
      <>
        <PageHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Staff Not Found</h2>
            <p className="text-gray-600 mb-6">The requested staff member could not be found.</p>
            <Link
              href="/admin/staff"
              className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Staff List
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <Link
              href="/admin/staff"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              ← Back to Staff List
            </Link>
          </div>

          <StaffDetailVerification staff={staff} />
        </div>
      </div>
    </>
  );
}
