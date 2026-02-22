# Quick Start - Staff Onboarding & Admin Verification

Get the staff onboarding and admin verification system running in 5 minutes.

## Prerequisites

- ✅ Node.js installed
- ✅ Supabase project created
- ✅ Repository cloned
- ✅ Dependencies installed (`npm install`)

## Step 1: Apply Database Migration (2 minutes)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in sidebar
4. Click **New query**
5. Copy the entire contents of `supabase/migrations/0005_staff_system_simplified.sql`
6. Paste into the editor
7. Click **Run** (or Ctrl+Enter)
8. Wait for "Success" message

**Verify:** Go to **Table Editor** → should see `staff_verifications` table

## Step 2: Get Service Role Key (1 minute)

1. In Supabase Dashboard, click **Settings** → **API**
2. Scroll to **Project API keys**
3. Copy the **service_role** key (starts with `eyJ...`)
4. ⚠️ **IMPORTANT:** This key bypasses RLS - never expose to client!

## Step 3: Update Environment Variables (1 minute)

Edit `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (your anon key)

# Add these two lines:
SUPABASE_SERVICE_ROLE_KEY=eyJ... (paste service role key here)
ADMIN_EMAIL_ALLOWLIST=your-email@example.com
```

**Note:** Replace `your-email@example.com` with the email you'll use to sign in as admin.

## Step 4: Start Development Server (1 minute)

```bash
npm run dev
```

Wait for "Ready" message, then open http://localhost:3000

## Step 5: Test It Works (1 minute)

### Test 1: Create Staff Profile

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Navigate to http://localhost:3000/auth
4. Sign in or create an account
5. After sign in, paste this in console:

```javascript
fetch('/api/staff/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    full_name: 'Test Staff',
    phone: '07700900123',
    postcode: 'SW1A 1AA',
    address_line_1: '123 Test Street',
    city: 'London',
    date_of_birth: '1990-01-15',
    travel_radius_miles: 10,
    transport_mode: 'public_transport',
    years_experience: 5,
    qualification_level: 'level_3',
    criminal_conviction_declared: false
  })
}).then(r => r.json()).then(console.log)
```

**Expected:** `{ ok: true, data: {...} }`

### Test 2: Access Admin UI

1. Make sure you're signed in with the email from `ADMIN_EMAIL_ALLOWLIST`
2. Navigate to http://localhost:3000/admin/staff
3. You should see the staff list (may be empty if no pending staff)

**Expected:** Page loads without 403 error

### Test 3: View Staff Detail

1. Get a staff ID from the previous profile creation (check console output)
2. Navigate to http://localhost:3000/admin/staff/[paste-id-here]
3. You should see staff details with three action buttons

**Expected:** Staff details displayed with Verify, Request Changes, Reject buttons

## ✅ You're Done!

The system is now running. You can:

- Staff can create profiles via API
- Admins can view and verify staff
- All validation and security working

## Next Steps

- **Full Testing:** Follow `MANUAL_TEST_GUIDE.md`
- **Understanding:** Read `IMPLEMENTATION_SUMMARY.md`
- **Deployment:** Check `DELIVERY_CHECKLIST.md`

## Common Issues

### "Forbidden: Admin access required"
**Fix:** Add your email to `ADMIN_EMAIL_ALLOWLIST` in `.env.local` and restart server

### "Service role key not found"
**Fix:** Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local` (no quotes needed)

### "Staff not found" in admin UI
**Fix:** Create a staff profile first using the Test 1 code above

### Migration fails
**Fix:** Check if tables already exist. If so, migration may have been applied already.

### Cannot sign in
**Fix:** Ensure Supabase Auth is enabled and email confirmations are turned off for development

## Quick Commands

```bash
# Run all checks
npm run gate

# Just lint
npm run lint

# Just build
npm run build

# Just tests
npm run test

# Start dev server
npm run dev
```

## API Endpoints Reference

### Staff (Authenticated)
- `GET /api/staff/profile` - Get own profile
- `POST /api/staff/profile` - Create/update profile
- `GET /api/staff/documents` - List documents
- `POST /api/staff/documents` - Create document
- `GET /api/staff/verification` - Check status

### Admin (Admin Only)
- `GET /api/admin/staff` - List staff
- `GET /api/admin/staff/[id]` - Get details
- `POST /api/admin/staff/[id]/verification` - Verify/reject

## Environment Variables Summary

```env
# Required (already set)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# New (must add)
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_EMAIL_ALLOWLIST=email1@example.com,email2@example.com

# Optional (already set)
DIDIT_API_KEY=...
DIDIT_WEBHOOK_SECRET=...
```

## Database Tables

After migration, you should have:

- ✅ `staff_profiles` - Staff personal info
- ✅ `staff_documents` - Document metadata
- ✅ `staff_verifications` - Verification status tracking
- ✅ `audit_logs` - Admin action history
- ✅ `setting_profiles` - Settings (childcare facilities)

## Security Notes

- 🔒 Service role key bypasses RLS - only use server-side
- 🔒 Admin routes check email allowlist
- 🔒 RLS policies prevent cross-user data access
- 🔒 All inputs validated with Zod
- 🔒 Request IDs for tracing errors

## Support

If something doesn't work:

1. Check `.env.local` has all required variables
2. Restart dev server after changing `.env.local`
3. Check browser console for errors
4. Check terminal for server errors
5. Verify migration was applied in Supabase

---

**Ready to go!** 🚀

For detailed testing: `MANUAL_TEST_GUIDE.md`
For architecture details: `IMPLEMENTATION_SUMMARY.md`
