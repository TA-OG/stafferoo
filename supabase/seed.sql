-- Seed data for testing
-- Run this in Supabase SQL Editor
-- 
-- TO CLEAN UP TEST DATA:
-- Run the cleanup script: supabase/seed-cleanup.sql
-- Or manually delete using the IDs prefixed with 00000000-0000-0000-0000-00000000

-- Test Settings (Nurseries)
INSERT INTO setting_profiles (id, email, setting_name, ofsted_urn, ofsted_rating, address_line_1, city, postcode, phone, verification_status, verified_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'sunshine@example.com', 'Sunshine Nursery', 'EY123456', 'Outstanding', '123 Sunshine Lane', 'London', 'SW1A 1AA', '020 7123 4567', 'approved', now()),
  ('00000000-0000-0000-0000-000000000002', 'rainbow@example.com', 'Rainbow Early Years', 'EY234567', 'Good', '45 Rainbow Road', 'Manchester', 'M1 1AA', '0161 123 4567', 'approved', now()),
  ('00000000-0000-0000-0000-000000000003', 'littlestars@example.com', 'Little Stars Childcare', 'EY345678', 'Good', '78 Star Street', 'Birmingham', 'B1 1AA', '0121 123 4567', 'approved', now())
ON CONFLICT (id) DO NOTHING;

-- Test Staff
INSERT INTO staff_profiles (id, email, full_name, phone, postcode, travel_radius_miles, transport_mode, years_experience, qualification_level, qualification_name, dbs_update_service, verification_status, verified_at) VALUES
  ('00000000-0000-0000-0000-000000000010', 'emma.staff@example.com', 'Emma Johnson', '07700 900001', 'SW1A 2BB', 10, 'car', 5, 'level_3', 'CACHE Level 3 Diploma', true, 'approved', now()),
  ('00000000-0000-0000-0000-000000000011', 'james.staff@example.com', 'James Smith', '07700 900002', 'M2 2BB', 5, 'public_transport', 3, 'level_3', null, true, 'approved', now()),
  ('00000000-0000-0000-0000-000000000012', 'sarah.staff@example.com', 'Sarah Williams', '07700 900003', 'B2 2BB', 15, 'car', 8, 'level_4_plus', 'BA Early Childhood Studies', true, 'approved', now()),
  ('00000000-0000-0000-0000-000000000013', 'david.staff@example.com', 'David Brown', '07700 900004', 'SW1A 3CC', 8, 'bicycle', 2, 'level_2', null, true, 'approved', now()),
  ('00000000-0000-0000-0000-000000000014', 'lisa.staff@example.com', 'Lisa Davis', '07700 900005', 'M3 3CC', 12, 'car', 6, 'level_3', null, true, 'approved', now())
ON CONFLICT (id) DO NOTHING;

-- Test Jobs
-- Note: Staff see £15.50/hour flat rate. Settings pay £23/hour (platform margin is £7.50/hour)
INSERT INTO job_requests (id, setting_id, title, description, job_date, start_time, end_time, role_required, hourly_rate, estimated_total, postcode, status) VALUES
  -- 9 hours × £15.50 = £139.50
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'Room Leader Needed - Baby Room', 'We need an experienced Room Leader for our baby room (0-2 years). Must have Level 3 qualification and experience with EYFS. Lovely setting with supportive team.', (now() + interval '3 days')::date, '08:00', '17:00', 'room_leader', 15.50, 139.50, 'SW1A 1AA', 'open'),
  -- 6 hours × £15.50 = £93.00
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Nursery Practitioner - Afternoon Shift', 'Looking for a Nursery Practitioner to cover afternoon shift. Duties include supervising children, supporting activities, and maintaining safeguarding standards.', (now() + interval '5 days')::date, '12:00', '18:00', 'nursery_practitioner', 15.50, 93.00, 'SW1A 1AA', 'open'),
  -- 10 hours × £15.50 = £155.00
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000002', 'Early Years Teacher - Full Day', 'Seeking a qualified Early Years Teacher for a full day. Must have QTS or EYTS. Experience with phonics and early maths preferred.', (now() + interval '2 days')::date, '08:00', '18:00', 'early_years_teacher', 15.50, 155.00, 'M1 1AA', 'open'),
  -- 5.5 hours × £15.50 = £85.25
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000003', 'Nursery Assistant - Morning Cover', 'Morning cover needed in our toddler room. Support with breakfast, free play, and outdoor activities. Friendly team environment.', (now() + interval '4 days')::date, '07:30', '13:00', 'nursery_assistant', 15.50, 85.25, 'B1 1AA', 'open')
ON CONFLICT (id) DO NOTHING;

-- Test Applications (Booking Responses)
INSERT INTO booking_responses (job_request_id, staff_id, status, message) VALUES
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000010', 'pending', 'I have 3 years experience as a Room Leader and would love to join your team!'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000012', 'pending', 'Very interested in this position. I have extensive experience with babies.'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010', 'pending', null),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000012', 'pending', 'Qualified EYT with 5 years classroom experience. Available immediately.'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000014', 'pending', null),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000013', 'pending', 'Local to the area and available for regular morning shifts.')
ON CONFLICT (job_request_id, staff_id) DO NOTHING;

-- Test Notifications
INSERT INTO notifications (user_id, type, title, body, data) VALUES
  ('00000000-0000-0000-0000-000000000010', 'job_applied', 'Application submitted', 'Your application for Room Leader at Sunshine Nursery has been received.', '{"job_id": "00000000-0000-0000-0000-000000000100"}'),
  ('00000000-0000-0000-0000-000000000001', 'new_applicant', 'New applicant!', 'Emma Johnson has applied for Room Leader Needed - Baby Room', '{"job_id": "00000000-0000-0000-000000000100"}')
ON CONFLICT DO NOTHING;

-- Test Documents for Staff (valid status)
INSERT INTO staff_documents (staff_id, doc_type, status, expiry_date) VALUES
  ('00000000-0000-0000-0000-000000000010', 'dbs_certificate', 'valid', (now() + interval '2 years')::date),
  ('00000000-0000-0000-0000-000000000010', 'safeguarding_certificate', 'valid', (now() + interval '1 year')::date),
  ('00000000-0000-0000-0000-000000000010', 'paediatric_first_aid', 'valid', (now() + interval '2 years')::date),
  ('00000000-0000-0000-0000-000000000010', 'right_to_work', 'valid', null),
  ('00000000-0000-0000-0000-000000000012', 'dbs_certificate', 'valid', (now() + interval '1 year')::date),
  ('00000000-0000-0000-0000-000000000012', 'safeguarding_certificate', 'valid', (now() + interval '6 months')::date),
  ('00000000-0000-0000-0000-000000000012', 'paediatric_first_aid', 'valid', (now() + interval '1 year')::date),
  ('00000000-0000-0000-0000-000000000012', 'right_to_work', 'valid', null)
ON CONFLICT DO NOTHING;
