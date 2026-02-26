/**
 * Seed script for test data
 * Run with: npx tsx scripts/seed-test-data.ts
 * 
 * This creates:
 * - 3 approved settings (nurseries)
 * - 5 approved staff members
 * - 3 open job postings
 * - Some applications/booking responses
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🌱 Seeding test data...\n');

  // Create test settings (nurseries)
  const settings = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'sunshine@example.com',
      setting_name: 'Sunshine Nursery',
      ofsted_urn: 'EY123456',
      ofsted_rating: 'Outstanding',
      address_line_1: '123 Sunshine Lane',
      city: 'London',
      postcode: 'SW1A 1AA',
      phone: '020 7123 4567',
      verification_status: 'approved',
      verified_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'rainbow@example.com',
      setting_name: 'Rainbow Early Years',
      ofsted_urn: 'EY234567',
      ofsted_rating: 'Good',
      address_line_1: '45 Rainbow Road',
      city: 'Manchester',
      postcode: 'M1 1AA',
      phone: '0161 123 4567',
      verification_status: 'approved',
      verified_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'littlestars@example.com',
      setting_name: 'Little Stars Childcare',
      ofsted_urn: 'EY345678',
      ofsted_rating: 'Good',
      address_line_1: '78 Star Street',
      city: 'Birmingham',
      postcode: 'B1 1AA',
      phone: '0121 123 4567',
      verification_status: 'approved',
      verified_at: new Date().toISOString(),
    },
  ];

  // Create test staff
  const staff = [
    {
      id: '00000000-0000-0000-0000-000000000010',
      email: 'emma.staff@example.com',
      full_name: 'Emma Johnson',
      phone: '07700 900001',
      postcode: 'SW1A 2BB',
      travel_radius_miles: 10,
      transport_mode: 'car',
      years_experience: 5,
      qualification_level: 'level_3',
      qualification_name: 'CACHE Level 3 Diploma',
      dbs_update_service: true,
      verification_status: 'approved',
      verified_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000011',
      email: 'james.staff@example.com',
      full_name: 'James Smith',
      phone: '07700 900002',
      postcode: 'M2 2BB',
      travel_radius_miles: 5,
      transport_mode: 'public_transport',
      years_experience: 3,
      qualification_level: 'level_3',
      verification_status: 'approved',
      verified_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000012',
      email: 'sarah.staff@example.com',
      full_name: 'Sarah Williams',
      phone: '07700 900003',
      postcode: 'B2 2BB',
      travel_radius_miles: 15,
      transport_mode: 'car',
      years_experience: 8,
      qualification_level: 'level_4_plus',
      qualification_name: 'BA Early Childhood Studies',
      verification_status: 'approved',
      verified_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000013',
      email: 'david.staff@example.com',
      full_name: 'David Brown',
      phone: '07700 900004',
      postcode: 'SW1A 3CC',
      travel_radius_miles: 8,
      transport_mode: 'bicycle',
      years_experience: 2,
      qualification_level: 'level_2',
      verification_status: 'approved',
      verified_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000014',
      email: 'lisa.staff@example.com',
      full_name: 'Lisa Davis',
      phone: '07700 900005',
      postcode: 'M3 3CC',
      travel_radius_miles: 12,
      transport_mode: 'car',
      years_experience: 6,
      qualification_level: 'level_3',
      verification_status: 'approved',
      verified_at: new Date().toISOString(),
    },
  ];

  // Create job requests
  const jobs = [
    {
      id: '00000000-0000-0000-0000-000000000100',
      setting_id: '00000000-0000-0000-0000-000000000001',
      title: 'Room Leader Needed - Baby Room',
      description: 'We need an experienced Room Leader for our baby room (0-2 years). Must have Level 3 qualification and experience with EYFS. Lovely setting with supportive team.',
      job_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days from now
      start_time: '08:00',
      end_time: '17:00',
      role_required: 'room_leader',
      hourly_rate: 22.50,
      estimated_total: 189.00,
      postcode: 'SW1A 1AA',
      status: 'open',
    },
    {
      id: '00000000-0000-0000-0000-000000000101',
      setting_id: '00000000-0000-0000-0000-000000000001',
      title: 'Nursery Practitioner - Afternoon Shift',
      description: 'Looking for a Nursery Practitioner to cover afternoon shift. Duties include supervising children, supporting activities, and maintaining safeguarding standards.',
      job_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // 5 days from now
      start_time: '12:00',
      end_time: '18:00',
      role_required: 'nursery_practitioner',
      hourly_rate: 18.00,
      estimated_total: 108.00,
      postcode: 'SW1A 1AA',
      status: 'open',
    },
    {
      id: '00000000-0000-0000-0000-000000000102',
      setting_id: '00000000-0000-0000-0000-000000000002',
      title: 'Early Years Teacher - Full Day',
      description: 'Seeking a qualified Early Years Teacher for a full day. Must have QTS or EYTS. Experience with phonics and early maths preferred.',
      job_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
      start_time: '08:00',
      end_time: '18:00',
      role_required: 'early_years_teacher',
      hourly_rate: 25.00,
      estimated_total: 250.00,
      postcode: 'M1 1AA',
      status: 'open',
    },
    {
      id: '00000000-0000-0000-0000-000000000103',
      setting_id: '00000000-0000-0000-0000-000000000003',
      title: 'Nursery Assistant - Morning Cover',
      description: 'Morning cover needed in our toddler room. Support with breakfast, free play, and outdoor activities. Friendly team environment.',
      job_date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], // 4 days from now
      start_time: '07:30',
      end_time: '13:00',
      role_required: 'nursery_assistant',
      hourly_rate: 15.50,
      estimated_total: 82.13,
      postcode: 'B1 1AA',
      status: 'open',
    },
  ];

  // Create booking responses (applications)
  const responses = [
    {
      job_request_id: '00000000-0000-0000-0000-000000000100',
      staff_id: '00000000-0000-0000-0000-000000000010',
      status: 'pending',
      message: 'I have 3 years experience as a Room Leader and would love to join your team!',
    },
    {
      job_request_id: '00000000-0000-0000-0000-000000000100',
      staff_id: '00000000-0000-0000-0000-000000000012',
      status: 'pending',
      message: 'Very interested in this position. I have extensive experience with babies.',
    },
    {
      job_request_id: '00000000-0000-0000-0000-000000000101',
      staff_id: '00000000-0000-0000-0000-000000000010',
      status: 'pending',
    },
    {
      job_request_id: '00000000-0000-0000-0000-000000000102',
      staff_id: '00000000-0000-0000-0000-000000000012',
      status: 'pending',
      message: 'Qualified EYT with 5 years classroom experience. Available immediately.',
    },
    {
      job_request_id: '00000000-0000-0000-0000-000000000102',
      staff_id: '00000000-0000-0000-0000-000000000014',
      status: 'pending',
    },
    {
      job_request_id: '00000000-0000-0000-0000-000000000103',
      staff_id: '00000000-0000-0000-0000-000000000013',
      status: 'pending',
      message: 'Local to the area and available for regular morning shifts.',
    },
  ];

  // Insert settings
  console.log('🏢 Creating test settings...');
  for (const setting of settings) {
    const { error } = await supabase
      .from('setting_profiles')
      .upsert(setting, { onConflict: 'id' });
    if (error) console.error('Error creating setting:', error);
    else console.log(`  ✓ ${setting.setting_name}`);
  }

  // Insert staff
  console.log('\n👥 Creating test staff...');
  for (const member of staff) {
    const { error } = await supabase
      .from('staff_profiles')
      .upsert(member, { onConflict: 'id' });
    if (error) console.error('Error creating staff:', error);
    else console.log(`  ✓ ${member.full_name}`);
  }

  // Insert jobs
  console.log('\n📋 Creating test jobs...');
  for (const job of jobs) {
    const { error } = await supabase
      .from('job_requests')
      .upsert(job, { onConflict: 'id' });
    if (error) console.error('Error creating job:', error);
    else console.log(`  ✓ ${job.title}`);
  }

  // Insert responses
  console.log('\n📝 Creating test applications...');
  for (const response of responses) {
    const { error } = await supabase
      .from('booking_responses')
      .upsert(response, { onConflict: 'job_request_id,staff_id' });
    if (error) console.error('Error creating response:', error);
    else console.log(`  ✓ Application created`);
  }

  // Create some notifications
  console.log('\n🔔 Creating test notifications...');
  const notifications = [
    {
      user_id: '00000000-0000-0000-0000-000000000010',
      type: 'job_applied',
      title: 'Application submitted',
      body: 'Your application for Room Leader at Sunshine Nursery has been received.',
      data: { job_id: '00000000-0000-0000-0000-000000000100' },
    },
    {
      user_id: '00000000-0000-0000-0000-000000000001',
      type: 'new_applicant',
      title: 'New applicant!',
      body: 'Emma Johnson has applied for Room Leader Needed - Baby Room',
      data: { job_id: '00000000-0000-0000-0000-000000000100' },
    },
  ];

  for (const notif of notifications) {
    const { error } = await supabase
      .from('notifications')
      .upsert(notif);
    if (error) console.error('Error creating notification:', error);
    else console.log(`  ✓ Notification created`);
  }

  console.log('\n✅ Seed complete!\n');
  console.log('Test Login Credentials (use magic link or create passwords in Supabase):');
  console.log('  Settings:');
  console.log('    - sunshine@example.com (Sunshine Nursery)');
  console.log('    - rainbow@example.com (Rainbow Early Years)');
  console.log('    - littlestars@example.com (Little Stars Childcare)');
  console.log('  Staff:');
  console.log('    - emma.staff@example.com (Emma Johnson)');
  console.log('    - james.staff@example.com (James Smith)');
  console.log('    - sarah.staff@example.com (Sarah Williams)');
  console.log('    - david.staff@example.com (David Brown)');
  console.log('    - lisa.staff@example.com (Lisa Davis)');
}

seed().catch(console.error);
