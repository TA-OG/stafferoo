# Slice 1 Implementation - Test Guide

## Files Changed

### Database Migration
- ✅ `supabase/migrations/0002_settings.sql` - Created setting_profiles and audit_logs tables

### Configuration
- ✅ `.env.local` - Added ADMIN_EMAILS environment variable

### Library/Utilities
- ✅ `app/lib/supabase.ts` - Supabase client initialization
- ✅ `app/lib/supabase-server.ts` - Server-side Supabase client
- ✅ `app/lib/admin.ts` - Admin permission checking utilities
- ✅ `app/lib/validations/setting.ts` - Zod validation schemas

### Pages
- ✅ `app/settings/register/page.tsx` - Settings registration form (replaced placeholder)
- ✅ `app/settings/pending/page.tsx` - Pending approval status page
- ✅ `app/admin/settings/page.tsx` - Admin settings verification queue

### Components
- ✅ `app/components/SettingVerificationCard.tsx` - Setting verification card with approve/reject

### API Routes
- ✅ `app/api/settings/register/route.ts` - Settings registration endpoint
- ✅ `app/api/admin/settings/verify/route.ts` - Admin verification endpoint

### Dependencies
- ✅ `package.json` - Added @supabase/supabase-js, @supabase/ssr, zod

---

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - Server-side rendering support
- `zod` - Schema validation

### 2. Run Database Migration

1. Open Supabase dashboard: https://zkqysmbyfrijmfrrjxps.supabase.co
2. Navigate to **SQL Editor** in left sidebar
3. Click **New Query**
4. Open `supabase/migrations/0002_settings.sql`
5. Copy entire contents
6. Paste into SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Verify success message

### 3. Configure Admin Email

The `.env.local` file has been updated with:
```env
ADMIN_EMAILS=admin@rec-app.com,wodib@example.com
```

To add your email as admin, edit `.env.local` and add your email to the comma-separated list.

### 4. Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Manual Test Steps

### Test 1: Settings Registration Flow

**Objective:** Verify settings can register and see pending status

1. **Navigate to registration page**
   - Open browser: `http://localhost:3000/settings/register`

2. **Fill registration form**
   - Setting Name: "Happy Days Nursery"
   - Ofsted URN: "EY123456"
   - Ofsted Rating: "Good"
   - Email: "contact@happydaysnursery.com"
   - Phone: "020 1234 5678"
   - Address Line 1: "123 Main Street"
   - City: "London"
   - Postcode: "SW1A 1AA"
   - Check "Parking available"
   - Number of Children: 30
   - Team Size: 5
   - Opening Time: 08:00
   - Closing Time: 18:00

3. **Submit form**
   - Click "Submit Registration"
   - Should redirect to `/settings/pending`

4. **Verify pending page**
   - Should see "Registration Submitted" message
   - Should see "What happens next?" section

5. **Verify database**
   - Open Supabase dashboard
   - Navigate to **Table Editor** > `setting_profiles`
   - Verify new row exists with:
     - `verification_status` = 'pending'
     - All form data populated
     - `created_at` and `updated_at` timestamps

**Expected Result:** ✅ Setting registered successfully with pending status

---

### Test 2: Admin Verification - Approve Flow

**Objective:** Verify admin can approve pending settings

1. **Grant admin access**
   - Open Supabase dashboard
   - Navigate to **SQL Editor**
   - Run this query (replace with your email):
   ```sql
   UPDATE auth.users 
   SET raw_user_meta_data = jsonb_set(
     COALESCE(raw_user_meta_data, '{}'::jsonb),
     '{role}',
     '"admin"'
   )
   WHERE email = 'your-email@example.com';
   ```
   - **OR** use the ADMIN_EMAILS environment variable (already configured)

2. **Access admin page**
   - Navigate to: `http://localhost:3000/admin/settings`
   - Should see "Settings Verification Queue" page
   - Should see the pending setting from Test 1

3. **Review setting details**
   - Click "Show More" to expand details
   - Verify all information displayed correctly
   - Click "Show Less" to collapse

4. **Approve setting**
   - Click "Approve" button
   - Optionally add notes in textarea
   - Click "Confirm Approval"
   - Should see processing state
   - Setting should disappear from queue (page refreshes)

5. **Verify database**
   - Open Supabase **Table Editor** > `setting_profiles`
   - Verify the setting row has:
     - `verification_status` = 'approved'
     - `verified_by` = your user ID
     - `verified_at` = current timestamp
     - `verification_notes` = your notes (if added)

6. **Verify audit log**
   - Navigate to **Table Editor** > `audit_logs`
   - Verify new row exists with:
     - `action` = 'setting_approved'
     - `entity_type` = 'setting_profile'
     - `entity_id` = setting ID
     - `actor_user_id` = your user ID
     - `metadata` contains setting details

**Expected Result:** ✅ Setting approved successfully with audit trail

---

### Test 3: Admin Verification - Reject Flow

**Objective:** Verify admin can reject pending settings with notes

1. **Create another test setting**
   - Register a second setting (use different URN: "EY654321")

2. **Access admin page**
   - Navigate to: `http://localhost:3000/admin/settings`
   - Should see the new pending setting

3. **Reject setting**
   - Click "Reject" button
   - Add rejection notes: "Ofsted URN could not be verified"
   - Click "Confirm Rejection"
   - Should see processing state
   - Setting should disappear from queue

4. **Verify database**
   - Open Supabase **Table Editor** > `setting_profiles`
   - Verify the setting row has:
     - `verification_status` = 'rejected'
     - `verified_by` = your user ID
     - `verified_at` = current timestamp
     - `verification_notes` = "Ofsted URN could not be verified"

5. **Verify audit log**
   - Navigate to **Table Editor** > `audit_logs`
   - Verify new row with `action` = 'setting_rejected'

**Expected Result:** ✅ Setting rejected successfully with notes and audit trail

---

### Test 4: Validation Tests

**Objective:** Verify form validation works correctly

1. **Test invalid Ofsted URN**
   - Navigate to `/settings/register`
   - Enter URN: "123456" (missing EY prefix)
   - Submit form
   - Should see error: "Ofsted URN must be in format EY123456"

2. **Test duplicate URN**
   - Enter URN: "EY123456" (already used in Test 1)
   - Fill other fields
   - Submit form
   - Should see error: "This Ofsted URN is already registered"

3. **Test required fields**
   - Leave Setting Name empty
   - Submit form
   - Should see error: "Setting name must be at least 2 characters"

4. **Test email validation**
   - Enter email: "invalid-email"
   - Submit form
   - Should see error: "Invalid email address"

**Expected Result:** ✅ All validation rules enforced

---

### Test 5: Access Control

**Objective:** Verify non-admin users cannot access admin pages

1. **Test without admin access**
   - Log out or use incognito window
   - Navigate to: `http://localhost:3000/admin/settings`
   - Should redirect to home page (/)

2. **Test with admin email**
   - Ensure your email is in ADMIN_EMAILS
   - Navigate to: `http://localhost:3000/admin/settings`
   - Should see admin page

**Expected Result:** ✅ Admin pages protected correctly

---

### Test 6: RLS Policies

**Objective:** Verify Row Level Security policies work

1. **Test setting can view own profile**
   - Log in as setting user
   - Query via API or Supabase client
   - Should see own profile only

2. **Test admin can view all profiles**
   - Log in as admin
   - Navigate to `/admin/settings`
   - Should see all pending settings

3. **Test setting cannot update verification status**
   - Try to update `verification_status` via API as setting user
   - Should fail (RLS policy blocks)

**Expected Result:** ✅ RLS policies enforce correct access control

---

## Verification Checklist

- [ ] Dependencies installed without errors
- [ ] Database migration runs successfully
- [ ] Settings can register with valid data
- [ ] Registration form validates all fields
- [ ] Duplicate URN detection works
- [ ] Settings see pending status after registration
- [ ] Admin can access `/admin/settings`
- [ ] Non-admin redirected from admin pages
- [ ] Admin can see pending settings list
- [ ] Admin can expand/collapse setting details
- [ ] Admin can approve settings
- [ ] Admin can reject settings with notes
- [ ] Approval updates database correctly
- [ ] Rejection updates database correctly
- [ ] Audit logs created for approve/reject
- [ ] Approved settings removed from pending queue
- [ ] Rejected settings removed from pending queue
- [ ] `npm run lint` passes
- [ ] `npm run build` passes

---

## Troubleshooting

### Issue: "Module not found: @supabase/supabase-js"
**Solution:** Run `npm install`

### Issue: "relation 'setting_profiles' does not exist"
**Solution:** Run the migration in Supabase SQL Editor

### Issue: "Unauthorized" when accessing admin page
**Solution:** 
1. Check your email is in ADMIN_EMAILS in `.env.local`
2. OR grant admin role in database:
   ```sql
   UPDATE auth.users 
   SET raw_user_meta_data = '{"role":"admin"}'::jsonb 
   WHERE email = 'your@email.com';
   ```

### Issue: "Cannot find module './supabase-server'"
**Solution:** Restart dev server after creating new files

### Issue: Form submission fails
**Solution:** 
1. Check browser console for errors
2. Check terminal for API errors
3. Verify Supabase connection in `.env.local`

---

## Success Criteria

✅ **All tests pass**  
✅ **No TypeScript errors**  
✅ **No linting errors**  
✅ **Build completes successfully**  
✅ **Audit logs created for all admin actions**  
✅ **RLS policies enforce correct access**

---

## Next Steps

After Slice 1 is complete and tested:
1. Implement Slice 2: Complete Staff Onboarding
2. Implement Slice 3: Admin Staff Verification
3. Implement Slice 4: Reference System
4. Implement Slice 5: Job Marketplace

---

**Implementation Date:** 2026-02-17  
**Status:** Ready for Testing
