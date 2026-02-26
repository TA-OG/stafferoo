/**
 * Cleanup script for test data
 * Run with: npm run cleanup
 * 
 * This removes all test data created by seed-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
  console.log('🧹 Cleaning up test data...\n');

  const testSettingIds = [
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
  ];

  const testStaffIds = [
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000014',
  ];

  const testJobIds = [
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000103',
  ];

  // Delete in order to respect foreign keys
  
  // 1. Chat messages in test bookings
  console.log('1. Deleting chat messages...');
  const { error: chatError } = await supabase
    .from('chat_messages')
    .delete()
    .in('booking_id', 
      (await supabase.from('bookings').select('id').in('job_request_id', testJobIds)).data?.map(b => b.id) || []
    );
  if (chatError) console.log('   (No chat messages to delete or error:', chatError.message + ')');
  else console.log('   ✓ Chat messages deleted');

  // 2. Bookings for test jobs
  console.log('2. Deleting bookings...');
  const { error: bookingsError } = await supabase
    .from('bookings')
    .delete()
    .in('job_request_id', testJobIds);
  if (bookingsError) console.log('   Error:', bookingsError.message);
  else console.log('   ✓ Bookings deleted');

  // 3. Booking responses (applications)
  console.log('3. Deleting applications...');
  const { error: responsesError } = await supabase
    .from('booking_responses')
    .delete()
    .in('job_request_id', testJobIds);
  if (responsesError) console.log('   Error:', responsesError.message);
  else console.log('   ✓ Applications deleted');

  // 4. Notifications for test users
  console.log('4. Deleting notifications...');
  const { error: notifError } = await supabase
    .from('notifications')
    .delete()
    .in('user_id', [...testSettingIds, ...testStaffIds]);
  if (notifError) console.log('   Error:', notifError.message);
  else console.log('   ✓ Notifications deleted');

  // 5. Job requests
  console.log('5. Deleting job postings...');
  const { error: jobsError } = await supabase
    .from('job_requests')
    .delete()
    .in('id', testJobIds);
  if (jobsError) console.log('   Error:', jobsError.message);
  else console.log('   ✓ Job postings deleted');

  // 6. Staff documents
  console.log('6. Deleting staff documents...');
  const { error: docsError } = await supabase
    .from('staff_documents')
    .delete()
    .in('staff_id', testStaffIds);
  if (docsError) console.log('   Error:', docsError.message);
  else console.log('   ✓ Staff documents deleted');

  // 7. Unavailability blocks
  console.log('7. Deleting unavailability blocks...');
  const { error: unavailError } = await supabase
    .from('unavailability_blocks')
    .delete()
    .in('staff_id', testStaffIds);
  if (unavailError) console.log('   Error:', unavailError.message);
  else console.log('   ✓ Unavailability blocks deleted');

  // 8. Notification preferences
  console.log('8. Deleting notification preferences...');
  const { error: prefsError } = await supabase
    .from('notification_preferences')
    .delete()
    .in('user_id', [...testSettingIds, ...testStaffIds]);
  if (prefsError) console.log('   Error:', prefsError.message);
  else console.log('   ✓ Notification preferences deleted');

  // 9. Staff profiles
  console.log('9. Deleting staff profiles...');
  const { error: staffError } = await supabase
    .from('staff_profiles')
    .delete()
    .in('id', testStaffIds);
  if (staffError) console.log('   Error:', staffError.message);
  else console.log('   ✓ Staff profiles deleted');

  // 10. Setting profiles
  console.log('10. Deleting setting profiles...');
  const { error: settingsError } = await supabase
    .from('setting_profiles')
    .delete()
    .in('id', testSettingIds);
  if (settingsError) console.log('   Error:', settingsError.message);
  else console.log('   ✓ Setting profiles deleted');

  console.log('\n✅ Cleanup complete!');
  console.log('\nTest data has been removed. You can re-seed anytime with:');
  console.log('  npm run seed    (requires SERVICE_ROLE_KEY)');
  console.log('  OR run supabase/seed.sql in SQL Editor');
}

cleanup().catch((err) => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
