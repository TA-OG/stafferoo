import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase-server';
import { isCurrentUserAdmin } from '@/app/lib/admin';
import StaffVerificationCard from '@/app/components/StaffVerificationCard';

export default async function AdminStaff() {
  const isAdmin = await isCurrentUserAdmin();
  
  if (!isAdmin) {
    redirect('/');
  }

  const supabase = await createClient();
  const { data: pendingStaff, error } = await supabase
    .from('staff_profiles')
    .select('*, staff_documents(id, doc_type, status)')
    .eq('verification_status', 'pending')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching staff:', error);
  }

  return (
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
            Review and approve pending staff applications
          </p>
        </div>

        {!pendingStaff || pendingStaff.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No pending staff applications to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingStaff.map((staff) => (
              <StaffVerificationCard key={staff.id} staff={staff} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
