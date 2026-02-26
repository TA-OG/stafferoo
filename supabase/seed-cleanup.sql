-- Cleanup script for test data
-- Run this in Supabase SQL Editor to remove all test data

-- Delete in order to respect foreign key constraints

-- 1. Delete chat messages (if any were created)
DELETE FROM chat_messages 
WHERE booking_id IN (
  SELECT id FROM bookings 
  WHERE job_request_id LIKE '00000000-0000-0000-0000-0000000001%'
);

-- 2. Delete bookings
DELETE FROM bookings 
WHERE job_request_id LIKE '00000000-0000-0000-0000-0000000001%';

-- 3. Delete booking responses (applications)
DELETE FROM booking_responses 
WHERE job_request_id LIKE '00000000-0000-0000-0000-0000000001%'
   OR staff_id LIKE '00000000-0000-0000-0000-0000000000%';

-- 4. Delete notifications
DELETE FROM notifications 
WHERE user_id LIKE '00000000-0000-0000-0000-0000000000%';

-- 5. Delete job requests
DELETE FROM job_requests 
WHERE id LIKE '00000000-0000-0000-0000-0000000001%';

-- 6. Delete staff documents
DELETE FROM staff_documents 
WHERE staff_id LIKE '00000000-0000-0000-0000-0000000000%';

-- 7. Delete unavailability blocks
DELETE FROM unavailability_blocks 
WHERE staff_id LIKE '00000000-0000-0000-0000-0000000000%';

-- 8. Delete notification preferences
DELETE FROM notification_preferences 
WHERE user_id LIKE '00000000-0000-0000-0000-0000000000%';

-- 9. Delete staff profiles
DELETE FROM staff_profiles 
WHERE id LIKE '00000000-0000-0000-0000-0000000000%';

-- 10. Delete setting profiles
DELETE FROM setting_profiles 
WHERE id LIKE '00000000-0000-0000-0000-0000000000%';

-- 11. Clean up any orphaned records
DELETE FROM staff_documents WHERE staff_id NOT IN (SELECT id FROM staff_profiles);
DELETE FROM unavailability_blocks WHERE staff_id NOT IN (SELECT id FROM staff_profiles);
DELETE FROM booking_responses WHERE staff_id NOT IN (SELECT id FROM staff_profiles);
DELETE FROM booking_responses WHERE job_request_id NOT IN (SELECT id FROM job_requests);
DELETE FROM bookings WHERE job_request_id NOT IN (SELECT id FROM job_requests);
DELETE FROM chat_messages WHERE booking_id NOT IN (SELECT id FROM bookings);

-- Verify cleanup
SELECT 'Settings remaining:' as check_name, COUNT(*) as count FROM setting_profiles WHERE id LIKE '00000000-0000-0000-0000-0000000000%'
UNION ALL
SELECT 'Staff remaining:', COUNT(*) FROM staff_profiles WHERE id LIKE '00000000-0000-0000-0000-0000000000%'
UNION ALL
SELECT 'Jobs remaining:', COUNT(*) FROM job_requests WHERE id LIKE '00000000-0000-0000-0000-0000000001%'
UNION ALL
SELECT 'Applications remaining:', COUNT(*) FROM booking_responses WHERE job_request_id LIKE '00000000-0000-0000-0000-0000000001%'
UNION ALL
SELECT 'Notifications remaining:', COUNT(*) FROM notifications WHERE user_id LIKE '00000000-0000-0000-0000-0000000000%';
