import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase-server';
import { isCurrentUserAdmin } from '@/app/lib/admin';
import SettingVerificationCard from '@/app/components/SettingVerificationCard';

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Settings Verification Queue
          </h1>
          <p className="text-gray-600">
            Review and approve pending childcare setting registrations
          </p>
        </div>

        {!pendingSettings || pendingSettings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No pending settings to review</p>
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
