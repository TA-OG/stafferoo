# Slice 1 - Quick Start Guide

## Step 1: Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install:
- `@supabase/supabase-js@^2.39.0`
- `@supabase/ssr@^0.0.10`
- `zod@^3.22.4`

---

## Step 2: Run Database Migration

1. Open Supabase dashboard: https://zkqysmbyfrijmfrrjxps.supabase.co
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Open file: `supabase/migrations/0002_settings.sql`
5. Copy entire contents
6. Paste into SQL Editor
7. Click **Run** (or Ctrl+Enter)
8. Verify "Success. No rows returned" message

---

## Step 3: Configure Admin Access

Your email is already configured as admin in `.env.local`:

```env
ADMIN_EMAILS=admin@rec-app.com,wodib@example.com
```

To add more admin emails, edit `.env.local` and add to the comma-separated list.

---

## Step 4: Restart Dev Server

```bash
# Stop current server (Ctrl+C in terminal)
npm run dev
```

---

## Step 5: Test Settings Registration

1. Open browser: `http://localhost:3000/settings/register`
2. Fill form with test data:
   - Setting Name: **Happy Days Nursery**
   - Ofsted URN: **EY123456**
   - Ofsted Rating: **Good**
   - Email: **contact@happydaysnursery.com**
   - Phone: **020 1234 5678**
   - Address Line 1: **123 Main Street**
   - City: **London**
   - Postcode: **SW1A 1AA**
   - Check **Parking available**
   - Number of Children: **30**
   - Team Size: **5**
   - Opening Time: **08:00**
   - Closing Time: **18:00**
3. Click **Submit Registration**
4. Should redirect to `/settings/pending`
5. Verify "Registration Submitted" message

---

## Step 6: Verify in Database

1. Open Supabase dashboard
2. Click **Table Editor** in left sidebar
3. Select **setting_profiles** table
4. Verify new row exists with:
   - `verification_status` = **pending**
   - All form data populated

---

## Step 7: Test Admin Approval

1. Open browser: `http://localhost:3000/admin/settings`
2. Should see "Settings Verification Queue" page
3. Should see the pending setting from Step 5
4. Click **Show More** to expand details
5. Click **Approve** button
6. Optionally add notes
7. Click **Confirm Approval**
8. Setting should disappear from queue

---

## Step 8: Verify Approval in Database

1. Open Supabase **Table Editor**
2. Select **setting_profiles** table
3. Verify the setting row has:
   - `verification_status` = **approved**
   - `verified_by` = your user ID
   - `verified_at` = current timestamp

---

## Step 9: Verify Audit Log

1. In Supabase **Table Editor**
2. Select **audit_logs** table
3. Verify new row exists with:
   - `action` = **setting_approved**
   - `entity_type` = **setting_profile**
   - `actor_user_id` = your user ID

---

## Step 10: Run Linting and Build

```bash
# Check for linting errors
npm run lint

# Test production build
npm run build
```

Both should complete without errors.

---

## Troubleshooting

### "Module not found: @supabase/supabase-js"
```bash
npm install
```

### "relation 'setting_profiles' does not exist"
Run the migration in Supabase SQL Editor (Step 2)

### "Unauthorized" on admin page
Check your email is in `ADMIN_EMAILS` in `.env.local`

### Dev server not updating
```bash
# Restart dev server
# Ctrl+C to stop
npm run dev
```

---

## Success Checklist

- [ ] Dependencies installed
- [ ] Migration runs successfully
- [ ] Settings can register
- [ ] Pending status shown
- [ ] Admin can access `/admin/settings`
- [ ] Admin can approve settings
- [ ] Database updated correctly
- [ ] Audit log created
- [ ] `npm run lint` passes
- [ ] `npm run build` passes

---

## What's Next?

After Slice 1 is complete:
- **Slice 2:** Complete staff onboarding (Steps 2-5)
- **Slice 3:** Admin staff verification
- **Slice 4:** Reference system
- **Slice 5:** Job marketplace

---

**Ready to test!** 🚀
