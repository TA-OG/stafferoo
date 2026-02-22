# Manual Testing Guide - Staff Onboarding & Admin Verification

## Prerequisites

1. ✅ Migration 0005 applied in Supabase
2. ✅ `.env.local` configured with service role key and admin allowlist
3. ✅ `npm run dev` running on http://localhost:3000
4. ✅ At least one test user account created in Supabase Auth

## Test Scenario 1: Staff Profile Creation

### Steps

1. **Sign in as staff member**
   - Navigate to http://localhost:3000/auth
   - Sign in or create account
   - Should redirect to home page

2. **Create staff profile via API**
   - Open browser DevTools Console
   - Run:
   ```javascript
   fetch('/api/staff/profile', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       full_name: 'Jane Smith',
       phone: '07700900123',
       postcode: 'SW1A 1AA',
       address_line_1: '10 Downing Street',
       city: 'London',
       date_of_birth: '1990-05-15',
       travel_radius_miles: 15,
       transport_mode: 'public_transport',
       years_experience: 5,
       qualification_level: 'level_3',
       criminal_conviction_declared: false
     })
   }).then(r => r.json()).then(console.log)
   ```

3. **Verify response**
   - Should return `{ ok: true, data: {...} }`
   - Check Supabase Table Editor: `staff_profiles` should have new row

### Expected Results

✅ Profile created successfully
✅ Response includes all submitted fields
✅ Database row exists with correct user ID

## Test Scenario 2: Document Metadata Creation

### Steps

1. **Still signed in as staff member**
2. **Create document record**
   ```javascript
   fetch('/api/staff/documents', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       doc_type: 'dbs_certificate',
       storage_path: '/documents/dbs_12345.pdf',
       original_filename: 'my_dbs_certificate.pdf'
     })
   }).then(r => r.json()).then(console.log)
   ```

3. **Fetch documents**
   ```javascript
   fetch('/api/staff/documents')
     .then(r => r.json())
     .then(console.log)
   ```

### Expected Results

✅ Document record created with status 'pending'
✅ GET returns array with the document
✅ Document linked to current user's staff_id

## Test Scenario 3: Verification Status Check

### Steps

1. **Check verification status**
   ```javascript
   fetch('/api/staff/verification')
     .then(r => r.json())
     .then(console.log)
   ```

### Expected Results

✅ Returns `{ ok: true, data: { status: 'incomplete' } }` (or actual status if record exists)

## Test Scenario 4: Admin Access Control

### Steps

1. **Sign out current user**
   - Clear browser cookies or use incognito window

2. **Sign in with non-admin email**
   - Use email NOT in `ADMIN_EMAIL_ALLOWLIST`

3. **Try to access admin API**
   ```javascript
   fetch('/api/admin/staff')
     .then(r => r.json())
     .then(console.log)
   ```

### Expected Results

✅ Returns `{ ok: false, error: { code: 'FORBIDDEN', ... } }`
✅ Status code 403

## Test Scenario 5: Admin Staff List

### Steps

1. **Sign in with admin email**
   - Use email from `ADMIN_EMAIL_ALLOWLIST`

2. **Fetch staff list**
   ```javascript
   fetch('/api/admin/staff')
     .then(r => r.json())
     .then(console.log)
   ```

3. **Filter by status**
   ```javascript
   fetch('/api/admin/staff?status=pending')
     .then(r => r.json())
     .then(console.log)
   ```

### Expected Results

✅ Returns list of staff with documents and verification status
✅ Filter works correctly
✅ Only pending staff shown when filtered

## Test Scenario 6: Admin Staff Detail

### Steps

1. **Get staff ID from previous test**
   - Copy the `id` field from a staff member

2. **Fetch staff details**
   ```javascript
   const staffId = 'paste-uuid-here';
   fetch(`/api/admin/staff/${staffId}`)
     .then(r => r.json())
     .then(console.log)
   ```

3. **Navigate to admin UI**
   - Go to http://localhost:3000/admin/staff/[paste-uuid-here]

### Expected Results

✅ API returns full staff details with documents and verification
✅ UI page loads with staff information displayed
✅ Three action buttons visible: Verify, Request Changes, Reject

## Test Scenario 7: Admin Verification Actions

### Steps

1. **On admin staff detail page**

2. **Test Verify action**
   - Click "Verify & Approve"
   - Optionally add notes
   - Click "Confirm Verification"
   - Should redirect to `/admin/staff`

3. **Check database**
   - Supabase Table Editor → `staff_profiles`
   - Find the staff record
   - `verification_status` should be 'approved'
   - Supabase Table Editor → `staff_verifications`
   - Should have record with status 'verified'
   - Supabase Table Editor → `audit_logs`
   - Should have entry with action 'staff_verify'

### Expected Results

✅ Staff status updated to approved/verified
✅ Audit log created
✅ Redirect works
✅ Success message or confirmation

## Test Scenario 8: Reject with Reason

### Steps

1. **Find another pending staff member**
   - Navigate to `/admin/staff`
   - Click on a staff member with pending status

2. **Test Reject action**
   - Click "Reject"
   - Try to submit without reason → Should show error
   - Add reason: "DBS certificate expired"
   - Click "Confirm Rejection"

3. **Verify in database**
   - `staff_profiles.verification_status` = 'rejected'
   - `staff_verifications.status` = 'rejected'
   - `staff_verifications.rejection_reason` = "DBS certificate expired"
   - `audit_logs` has entry with action 'staff_reject'

### Expected Results

✅ Cannot reject without reason
✅ Rejection reason saved
✅ Status updated correctly
✅ Audit trail created

## Test Scenario 9: Request Changes

### Steps

1. **Find pending staff member**

2. **Test Request Changes action**
   - Click "Request Changes"
   - Add notes: "Please upload safeguarding certificate"
   - Click "Request Changes"

3. **Verify in database**
   - `staff_profiles.verification_status` = 'draft'
   - `staff_verifications.status` = 'pending_review'
   - `staff_verifications.rejection_reason` contains notes
   - `audit_logs` has entry

### Expected Results

✅ Status changed to pending_review
✅ Notes saved
✅ Staff can see they need to make changes

## Test Scenario 10: Validation Errors

### Steps

1. **Test invalid postcode**
   ```javascript
   fetch('/api/staff/profile', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       full_name: 'Test User',
       postcode: 'INVALID',
       // ... other required fields
     })
   }).then(r => r.json()).then(console.log)
   ```

2. **Test invalid doc_type**
   ```javascript
   fetch('/api/staff/documents', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       doc_type: 'invalid_type',
       storage_path: '/test.pdf',
       original_filename: 'test.pdf'
     })
   }).then(r => r.json()).then(console.log)
   ```

### Expected Results

✅ Returns 400 status code
✅ Error response includes validation details
✅ Zod error messages are clear and helpful

## Test Scenario 11: Unauthorized Access

### Steps

1. **Sign out completely**
2. **Try to access staff API**
   ```javascript
   fetch('/api/staff/profile')
     .then(r => r.json())
     .then(console.log)
   ```

3. **Try to access admin API**
   ```javascript
   fetch('/api/admin/staff')
     .then(r => r.json())
     .then(console.log)
   ```

### Expected Results

✅ Both return 401 Unauthorized
✅ Error message: "You must be signed in"

## Test Scenario 12: Cross-User Data Access

### Steps

1. **Sign in as User A**
2. **Create profile for User A**
3. **Note the staff_id**
4. **Sign out and sign in as User B**
5. **Try to fetch User A's profile**
   ```javascript
   const userAId = 'paste-user-a-uuid';
   fetch(`/api/admin/staff/${userAId}`)
     .then(r => r.json())
     .then(console.log)
   ```

### Expected Results

✅ User B (non-admin) cannot access User A's data
✅ Returns 403 Forbidden
✅ RLS policies working correctly

## Checklist Summary

Use this checklist to verify all functionality:

- [ ] Staff can create profile via API
- [ ] Staff can create document metadata
- [ ] Staff can check verification status
- [ ] Non-admin cannot access admin routes
- [ ] Admin can list all staff
- [ ] Admin can filter staff by status
- [ ] Admin can view staff details
- [ ] Admin can verify staff
- [ ] Admin can reject staff (requires reason)
- [ ] Admin can request changes
- [ ] Validation errors are clear
- [ ] Unauthorized access is blocked
- [ ] RLS prevents cross-user data access
- [ ] Audit logs are created for all actions
- [ ] Request IDs appear in error responses

## Common Issues & Solutions

### Issue: "Service role key not found"
**Solution:** Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and restart dev server

### Issue: "Forbidden: Admin access required"
**Solution:** Add your email to `ADMIN_EMAIL_ALLOWLIST` in `.env.local`

### Issue: "Staff not found" in admin UI
**Solution:** Ensure staff profile has been created via API first

### Issue: Validation errors on profile creation
**Solution:** Check all required fields match schema (postcode format, date_of_birth age, etc.)

### Issue: Cannot see staff in admin list
**Solution:** Check `verification_status` in database - may need to filter by 'draft' or 'pending'

## Notes

- All API routes return consistent JSON format: `{ ok: boolean, data?: any, error?: {...} }`
- Request IDs are included in all error responses for debugging
- Admin actions are logged to `audit_logs` table
- RLS policies are enforced - admin routes use service role key to bypass
- Document storage is metadata-only for now (storage_path is just a string)

## Next Steps After Testing

Once manual testing is complete:
1. ✅ Verify all checklist items
2. ✅ Check audit_logs table for all admin actions
3. ✅ Confirm RLS policies work as expected
4. ✅ Test with multiple users and admins
5. ✅ Ready for integration with staff onboarding UI
