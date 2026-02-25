import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase-server';
import { isCurrentUserAdmin } from '@/app/lib/admin';
import SettingVerificationCard from '@/app/components/SettingVerificationCard';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export default async function AdminSettings() {
  // Check admin access
  const isAdmin = await isCurrentUserAdmin();
  
  if (!isAdmin) {
    redirect('/');
  }

  // Fetch pending settings
  const supabase = await createClient();
  const { data: pendingSettings, error } = await supabase
    .from('setting_profiles')
    .select('*')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching settings:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Business Queue' }]} />

        {/* Admin navigation */}
        <nav className="flex gap-6 mb-6 text-sm">
          <Link href="/admin/staff" className="text-blue-600 hover:text-blue-700 font-medium">
            Staff Queue
          </Link>
          <Link href="/admin/settings" className="text-gray-900 font-semibold border-b-2 border-gray-900 pb-0.5">
            Business Queue
          </Link>
          <Link href="/admin/postcodes" className="text-blue-600 hover:text-blue-700 font-medium">
            Postcode Density
          </Link>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Business Verification Queue
          </h1>
          <p className="text-gray-600">
            Review and approve pending Early Years Childcare Business registrations
          </p>
        </div>

        {!pendingSettings || pendingSettings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No pending businesses to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingSettings.map((setting) => (
              <SettingVerificationCard key={setting.id} setting={setting} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
