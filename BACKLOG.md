# Build status

## Slice 0, stabilise, DONE
- Gates added: lint, build, test, gate
- Vitest installed
- Smoke test added
- CLAUDE.md added
- Working tree clean

## Next slice, Slice 1, postcode gating, READY
Goal
- Settings can register but are not live until admin enables their postcode

Acceptance criteria
- Setting register creates setting with status = pending and postcode
- API and UI enforce cannot create live bookings when pending
- Admin can enable a postcode, which flips all settings in that postcode to live, or allows per setting enable
- Feature flag: POSTCODE_GATING enabled by default

Tests
- Unit test for gating rule
- API route test for setting register validation
# REC-APP Development Backlog
**Generated:** 2026-02-17  
**Methodology:** Small slices with clear acceptance criteria

---

## BACKLOG STRUCTURE

Each slice follows this format:
- **Slice ID:** Unique identifier
- **Title:** What gets built
- **Why:** Business/technical justification
- **Dependencies:** What must exist first
- **Estimated Effort:** Hours/days
- **Files to Create/Modify:** Exact file paths
- **Acceptance Criteria:** How to verify it works
- **Test Steps:** Manual testing instructions

---

## PHASE 1: FOUNDATION (Critical Infrastructure)

### SLICE 1.1: Install Core Dependencies & Supabase Client
**Priority:** P0 - BLOCKING EVERYTHING  
**Estimated Effort:** 1 hour

**Why:** Cannot interact with database without Supabase client. All features blocked.

**Dependencies:** None

**Tasks:**
1. Install packages:
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   npm install zod react-hook-form @hookform/resolvers
   npm install @tanstack/react-query
   npm install date-fns
   ```

2. Create `app/lib/supabase.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   
   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

3. Create `app/lib/supabase-server.ts`:
   ```typescript
   import { createServerClient } from '@supabase/auth-helpers-nextjs'
   import { cookies } from 'next/headers'
   
   export function createClient() {
     const cookieStore = cookies()
     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       { cookies: () => cookieStore }
     )
   }
   ```

**Acceptance Criteria:**
- [ ] All packages installed without errors
- [ ] `app/lib/supabase.ts` exports working client
- [ ] Can query `staff_profiles` table from API route
- [ ] No TypeScript errors

**Test Steps:**
1. Run `npm install`
2. Create test API route:
   ```typescript
   // app/api/test-db/route.ts
   import { supabase } from '@/app/lib/supabase'
   
   export async function GET() {
     const { data, error } = await supabase.from('staff_profiles').select('*').limit(1)
     return Response.json({ data, error })
   }
   ```
3. Visit `http://localhost:3000/api/test-db`
4. Should return `{ data: [], error: null }`

---

### SLICE 1.2: Authentication System (Supabase Auth)
**Priority:** P0 - BLOCKING USER MANAGEMENT  
**Estimated Effort:** 4 hours

**Why:** Cannot register users, login, or manage sessions without auth system.

**Dependencies:** SLICE 1.1

**Files to Create:**
- `app/login/page.tsx` - Login form
- `app/signup/page.tsx` - Signup form with role selection
- `app/api/auth/callback/route.ts` - Auth callback handler
- `app/components/AuthForm.tsx` - Reusable auth form component
- `middleware.ts` - Auth middleware for protected routes

**Database Changes:** None (uses Supabase Auth)

**Acceptance Criteria:**
- [ ] User can sign up with email/password and role (carer/setting/admin)
- [ ] User can log in
- [ ] User can log out
- [ ] Protected routes redirect to login
- [ ] Session persists across page reloads
- [ ] User metadata includes role

**Test Steps:**
1. Navigate to `/signup`
2. Enter email, password, select "Staff" role
3. Submit form
4. Check Supabase Auth dashboard for new user
5. Verify `raw_user_meta_data` contains `{ "role": "carer" }`
6. Log in at `/login`
7. Verify redirected to appropriate dashboard
8. Refresh page, verify still logged in
9. Log out, verify redirected to home

**Implementation Notes:**
```typescript
// Signup flow
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      role: 'carer' // or 'setting' or 'admin'
    }
  }
})

// After signup, create profile
if (data.user) {
  if (role === 'carer') {
    await supabase.from('staff_profiles').insert({
      id: data.user.id,
      email: data.user.email,
      // ... other fields
    })
  } else if (role === 'setting') {
    await supabase.from('childcare_settings').insert({
      id: data.user.id,
      email: data.user.email,
      // ... other fields
    })
  }
}
```

---

## PHASE 2: SETTINGS (Customer Onboarding)

### SLICE 2.1: Settings Table & Registration Form
**Priority:** P0 - BLOCKING CUSTOMER ACQUISITION  
**Estimated Effort:** 6 hours

**Why:** Cannot onboard customers without settings registration. Spec requires Ofsted URN validation.

**Dependencies:** SLICE 1.2

**Files to Create:**
- `supabase/migrations/0002_childcare_settings.sql` - Settings table
- `app/settings/register/page.tsx` - Replace placeholder with real form
- `app/api/settings/register/route.ts` - Registration endpoint
- `app/components/OfstedURNInput.tsx` - URN validation component
- `app/lib/validations/setting.ts` - Zod schemas

**Database Migration:**
```sql
-- supabase/migrations/0002_childcare_settings.sql
create table childcare_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  ofsted_urn text unique not null,
  ofsted_rating text check (ofsted_rating in ('Outstanding', 'Good', 'Requires Improvement', 'Inadequate')),
  email text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  postcode text not null,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  number_of_children integer,
  team_size integer,
  has_parking boolean default false,
  operation_hours_start time,
  operation_hours_end time,
  subscription_tier text default 'pilot' check (subscription_tier in ('pilot', 'full')),
  subscription_status text default 'active',
  monthly_fee decimal(10, 2) default 99.00,
  verification_status text default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_setting_ofsted on childcare_settings(ofsted_urn);
create index idx_setting_verification on childcare_settings(verification_status);
create index idx_setting_postcode on childcare_settings(postcode);

alter table childcare_settings enable row level security;

create policy "Settings can view own profile"
  on childcare_settings for select using (auth.uid() = id);

create policy "Settings can insert own profile"
  on childcare_settings for insert with check (auth.uid() = id);

create policy "Settings can update own profile"
  on childcare_settings for update using (auth.uid() = id);

create policy "Admins can view all settings"
  on childcare_settings for select using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

create policy "Admins can update settings"
  on childcare_settings for update using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

create trigger update_childcare_settings_updated_at
  before update on childcare_settings
  for each row
  execute function update_updated_at_column();
```

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] Settings can access `/settings/register` after signup
- [ ] Form validates Ofsted URN format (e.g., EY123456)
- [ ] Form validates all required fields
- [ ] Postcode triggers geocoding (lat/lng stored)
- [ ] Data saved to `childcare_settings` table
- [ ] `verification_status` set to 'pending'
- [ ] User redirected to "pending approval" page

**Test Steps:**
1. Run migration in Supabase SQL Editor
2. Sign up as setting at `/signup` (role: setting)
3. Redirected to `/settings/register`
4. Fill form:
   - Name: "Happy Days Nursery"
   - Ofsted URN: "EY123456"
   - Ofsted Rating: "Good"
   - Address: "123 Main St"
   - City: "London"
   - Postcode: "SW1A 1AA"
   - Phone: "020 1234 5678"
   - Number of children: 30
   - Team size: 5
   - Has parking: Yes
   - Operation hours: 08:00 - 18:00
5. Submit form
6. Verify data in `childcare_settings` table
7. Verify `verification_status` = 'pending'
8. Verify redirected to pending approval page

---

### SLICE 2.2: Admin Settings Verification UI
**Priority:** P0 - BLOCKING SETTING APPROVAL  
**Estimated Effort:** 4 hours

**Why:** Settings cannot post jobs until admin approves them. Spec requires manual verification.

**Dependencies:** SLICE 2.1

**Files to Create:**
- `app/admin/page.tsx` - Admin dashboard
- `app/admin/settings/page.tsx` - Settings verification queue
- `app/admin/settings/[id]/page.tsx` - Setting details page
- `app/api/admin/settings/approve/route.ts` - Approve endpoint
- `app/api/admin/settings/reject/route.ts` - Reject endpoint
- `app/components/AdminSettingCard.tsx` - Setting card component
- `middleware.ts` - Update to protect `/admin/*` routes

**Acceptance Criteria:**
- [ ] Admin can access `/admin/settings`
- [ ] Non-admin redirected to home
- [ ] Pending settings displayed in list
- [ ] Each setting shows: name, URN, rating, address, registration date
- [ ] Admin can click "View Details"
- [ ] Details page shows all setting information
- [ ] Admin can click "Approve" or "Reject"
- [ ] Approval updates `verification_status` to 'approved'
- [ ] Approval sets `verified_by` to admin user ID
- [ ] Approval sets `verified_at` to current timestamp
- [ ] Setting receives email notification of approval/rejection
- [ ] Approved settings can access dashboard

**Test Steps:**
1. Grant admin role to test user:
   ```sql
   UPDATE auth.users 
   SET raw_user_meta_data = '{"role":"admin"}'::jsonb 
   WHERE email = 'admin@test.com';
   ```
2. Log in as admin
3. Navigate to `/admin/settings`
4. Verify pending setting from SLICE 2.1 appears
5. Click "View Details"
6. Verify all setting info displayed
7. Click "Approve"
8. Verify `verification_status` changed to 'approved' in database
9. Verify `verified_by` and `verified_at` populated
10. Log out
11. Log in as setting
12. Verify can access `/settings/dashboard`

---

## PHASE 3: STAFF (Worker Onboarding)

### SLICE 3.1: Expand Staff Profiles Table
**Priority:** P0 - BLOCKING STAFF ONBOARDING  
**Estimated Effort:** 2 hours

**Why:** Current `staff_profiles` table missing 20+ required columns from spec.

**Dependencies:** SLICE 1.1

**Files to Create:**
- `supabase/migrations/0003_expand_staff_profiles.sql`

**Database Migration:**
```sql
-- supabase/migrations/0003_expand_staff_profiles.sql
alter table staff_profiles
add column if not exists first_name text,
add column if not exists last_name text,
add column if not exists national_insurance_number text,
add column if not exists date_of_birth date,
add column if not exists address_line_1 text,
add column if not exists address_line_2 text,
add column if not exists city text,
add column if not exists latitude decimal(10, 8),
add column if not exists longitude decimal(11, 8),
add column if not exists dbs_certificate_number text unique,
add column if not exists dbs_issue_date date,
add column if not exists dbs_expiry_date date,
add column if not exists dbs_surname_on_certificate text,
add column if not exists verified boolean default false,
add column if not exists status text default 'active' check (status in ('active', 'suspended', 'banned')),
add column if not exists strikes integer default 0,
add column if not exists avg_rating decimal(3,2) default 0.00,
add column if not exists total_shifts integer default 0,
add column if not exists sms_opt_in boolean default false,
add column if not exists available_now boolean default false,
add column if not exists availability_schedule jsonb,
add column if not exists safeguarding_certificate_url text,
add column if not exists safeguarding_expiry_date date,
add column if not exists paediatric_first_aid_url text,
add column if not exists paediatric_first_aid_expiry_date date,
add column if not exists right_to_work_document_url text,
add column if not exists emergency_contact_1_name text,
add column if not exists emergency_contact_1_phone text,
add column if not exists emergency_contact_1_relationship text,
add column if not exists emergency_contact_2_name text,
add column if not exists emergency_contact_2_phone text,
add column if not exists emergency_contact_2_relationship text,
add column if not exists gp_name text,
add column if not exists gp_address text,
add column if not exists health_declaration jsonb,
add column if not exists smoking_declaration text,
add column if not exists drugs_alcohol_declaration text,
add column if not exists digital_signature text,
add column if not exists digital_signature_date timestamptz,
add column if not exists disqualified_person_declaration boolean default false,
add column if not exists suspension_start_date timestamptz,
add column if not exists suspension_end_date timestamptz,
add column if not exists suspension_history jsonb default '[]'::jsonb;

-- Add indexes
create index if not exists idx_staff_dbs on staff_profiles(dbs_certificate_number);
create index if not exists idx_staff_status on staff_profiles(status);
create index if not exists idx_staff_available on staff_profiles(available_now);
create index if not exists idx_staff_location on staff_profiles(latitude, longitude);
```

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] All new columns added
- [ ] Indexes created
- [ ] No data loss from existing records
- [ ] Can query new columns

**Test Steps:**
1. Run migration in Supabase SQL Editor
2. Query table: `SELECT * FROM staff_profiles LIMIT 1;`
3. Verify all new columns present
4. Verify existing data intact

---

### SLICE 3.2: Complete Staff Onboarding Form (Steps 2-5)
**Priority:** P1 - REQUIRED FOR STAFF ACQUISITION  
**Estimated Effort:** 12 hours

**Why:** Staff Onboarding spec requires 5-step process. Currently only Step 1 (ID verification) works.

**Dependencies:** SLICE 3.1, existing ID verification (already implemented)

**Files to Modify:**
- `app/staff/onboarding/page.tsx` - Expand to full 5-step form

**Files to Create:**
- `app/components/staff/Step2ProfileBasics.tsx`
- `app/components/staff/Step3Documents.tsx`
- `app/components/staff/Step4HealthDeclaration.tsx`
- `app/components/staff/Step5DigitalSignature.tsx`
- `app/api/staff/onboarding/route.ts` - Save profile data
- `app/api/staff/documents/upload/route.ts` - Upload documents to Supabase Storage
- `app/lib/validations/staff.ts` - Zod schemas

**Step 2: Profile Basics**
- National Insurance Number
- Date of Birth
- Phone Number
- Full Address (street, city, postcode)
- Travel Radius (miles, default 10)
- Mode of Transport (dropdown: Car/Public Transport/Bicycle/Walking)
- Years of Experience
- Qualification Level (radio: Level 2/Level 3)
- **DBS Update Service** (checkbox with HARD STOP if not checked)
  - Link to https://www.gov.uk/dbs-update-service opens in new tab
  - Cannot proceed without checking this box
- Criminal Conviction Declaration (checkbox)
- Disabilities/Health Concerns (textarea)

**Step 3: Document Upload**
- Right to Work Document (PDF/JPG upload)
- DBS Certificate Upload (PDF/JPG)
- DBS Certificate Number (text input)
- Surname on DBS Certificate (text input)
- DBS Issue Date (date picker with auto-flag if >12 months)
- Safeguarding Certificate (PDF upload with expiry date)
- Paediatric First Aid Certificate (PDF upload with expiry date)
- Disqualified Person Declaration (checkbox: "I confirm I do not live with a disqualified person")
- Emergency Contact 1 (name, phone, relationship)
- Emergency Contact 2 (name, phone, relationship)
- GP Details (name and address)

**Step 4: Health Declaration**
- 14 checkboxes for health conditions:
  - Epilepsy
  - Diabetes
  - Heart conditions
  - Mental health conditions
  - Back problems
  - Allergies
  - Asthma
  - Hearing impairment
  - Vision impairment
  - Mobility issues
  - Pregnancy
  - Infectious diseases
  - Substance abuse history
  - Medication (list if checked)
- Smoking Declaration (Yes/No/Former)
- Drugs/Alcohol Declaration (text)

**Step 5: Digital Signature**
- Canvas drawing pad for signature
- "I confirm all information is accurate" checkbox
- Submit button

**Acceptance Criteria:**
- [ ] All 5 steps functional
- [ ] DBS Update Service checkbox blocks progress if unchecked
- [ ] Link to gov.uk opens in new tab
- [ ] All documents upload to Supabase Storage
- [ ] File size limit enforced (10MB)
- [ ] File type validation (PDF, JPG, PNG only)
- [ ] DBS issue date >12 months shows warning
- [ ] Health declaration stored as JSONB
- [ ] Digital signature captured as base64 image
- [ ] All data saved to `staff_profiles` and `staff_documents` tables
- [ ] `verification_status` set to 'pending'
- [ ] User redirected to "pending approval" page

**Test Steps:**
1. Sign up as staff at `/signup`
2. Complete Step 1 (ID verification) - already working
3. Step 2: Fill profile basics
4. Try to proceed without DBS Update Service checkbox (should block)
5. Check DBS Update Service checkbox
6. Click link, verify opens gov.uk in new tab
7. Complete Step 2, click Next
8. Step 3: Upload all documents
9. Enter DBS details with issue date >12 months
10. Verify warning displayed
11. Complete Step 3, click Next
12. Step 4: Check health conditions
13. Fill smoking/drugs declarations
14. Complete Step 4, click Next
15. Step 5: Draw signature on canvas
16. Check confirmation checkbox
17. Click Submit
18. Verify all data in `staff_profiles` table
19. Verify documents in Supabase Storage
20. Verify `staff_documents` table has entries
21. Verify redirected to pending approval page

---

### SLICE 3.3: Admin Staff Verification UI
**Priority:** P1 - BLOCKING STAFF APPROVAL  
**Estimated Effort:** 6 hours

**Why:** Staff cannot accept jobs until admin verifies DBS, qualifications, and documents.

**Dependencies:** SLICE 3.2

**Files to Create:**
- `app/admin/staff/page.tsx` - Staff verification queue
- `app/admin/staff/[id]/page.tsx` - Staff details page
- `app/api/admin/staff/approve/route.ts` - Approve endpoint
- `app/api/admin/staff/reject/route.ts` - Reject endpoint
- `app/components/AdminStaffCard.tsx` - Staff card component
- `app/components/DocumentViewer.tsx` - View uploaded documents

**Acceptance Criteria:**
- [ ] Admin can access `/admin/staff`
- [ ] Pending staff displayed in list
- [ ] Each staff shows: name, qualification, registration date, DBS status
- [ ] Admin can click "View Details"
- [ ] Details page shows all staff information
- [ ] ID verification results from Didit displayed
- [ ] All uploaded documents viewable/downloadable
- [ ] DBS certificate details displayed
- [ ] DBS issue date highlighted if >12 months
- [ ] Health declaration displayed
- [ ] Digital signature displayed
- [ ] Admin can click "Approve" or "Reject"
- [ ] Approval updates `verification_status` to 'approved'
- [ ] Approval sets `verified` to true
- [ ] Approval sets admin user ID and timestamp
- [ ] Staff receives email notification
- [ ] Approved staff can access dashboard

**Test Steps:**
1. Log in as admin
2. Navigate to `/admin/staff`
3. Verify pending staff from SLICE 3.2 appears
4. Click "View Details"
5. Verify ID verification results displayed
6. Click on DBS certificate, verify opens in new tab
7. Verify all documents accessible
8. Verify health declaration displayed
9. Verify digital signature displayed
10. Click "Approve"
11. Verify `verification_status` = 'approved' in database
12. Verify `verified` = true
13. Log out
14. Log in as staff
15. Verify can access `/staff/dashboard`

---

## PHASE 4: REFERENCE SYSTEM

### SLICE 4.1: Reference Tables & Token System
**Priority:** P1 - COMPLIANCE REQUIREMENT  
**Estimated Effort:** 3 hours

**Why:** Operational Policies require professional references with domain email validation.

**Dependencies:** SLICE 3.1

**Files to Create:**
- `supabase/migrations/0004_carer_references.sql`

**Database Migration:**
```sql
-- supabase/migrations/0004_carer_references.sql
create table carer_references (
  id uuid primary key default gen_random_uuid(),
  carer_id uuid not null references staff_profiles(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  referee_email text not null,
  referee_name text,
  status text default 'pending' check (status in ('pending', 'completed', 'expired')),
  
  -- Reference details
  setting_name text,
  setting_ofsted_urn text,
  setting_ofsted_rating text,
  work_period_from date,
  work_period_to date,
  role text,
  reason_for_leaving text,
  
  -- Ratings (1-5)
  q1_childcare_skills integer check (q1_childcare_skills between 1 and 5),
  q2_reliability integer check (q2_reliability between 1 and 5),
  q3_teamwork integer check (q3_teamwork between 1 and 5),
  q5_would_rehire boolean,
  q8_safeguarding_concerns boolean,
  q8_safeguarding_details text,
  
  -- Metadata
  submitted_at timestamptz,
  expires_at timestamptz default (now() + interval '14 days'),
  ip_address inet,
  user_agent text,
  
  created_at timestamptz default now()
);

create index idx_references_carer on carer_references(carer_id);
create index idx_references_token on carer_references(token);
create index idx_references_status on carer_references(status);

alter table carer_references enable row level security;

create policy "Staff can view own references"
  on carer_references for select using (
    carer_id in (select id from staff_profiles where id = auth.uid())
  );

create policy "Staff can insert own references"
  on carer_references for insert with check (
    carer_id in (select id from staff_profiles where id = auth.uid())
  );

create policy "Public can update references via token"
  on carer_references for update using (true);

create policy "Admins can view all references"
  on carer_references for select using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
```

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] Table created with all columns
- [ ] Token auto-generated on insert
- [ ] Expires_at defaults to 14 days
- [ ] RLS policies allow public updates via token

**Test Steps:**
1. Run migration
2. Insert test reference:
   ```sql
   INSERT INTO carer_references (carer_id, referee_email)
   VALUES ('existing-staff-id', 'referee@nursery.com')
   RETURNING token;
   ```
3. Verify token generated
4. Verify expires_at set to 14 days from now

---

### SLICE 4.2: Reference Request Flow (Staff Side)
**Priority:** P1 - COMPLIANCE REQUIREMENT  
**Estimated Effort:** 4 hours

**Why:** Staff need to send reference requests during onboarding.

**Dependencies:** SLICE 4.1

**Files to Create:**
- `app/staff/onboarding/references/page.tsx` - Add references step
- `app/api/references/send/route.ts` - Send reference request email
- `app/components/ReferenceRequestForm.tsx` - Form component
- `app/lib/sendgrid.ts` - SendGrid email client

**Acceptance Criteria:**
- [ ] Staff can add 2+ professional references
- [ ] Form collects: referee name, email, relationship
- [ ] Click "Send Request" generates token
- [ ] Email sent to referee with unique link
- [ ] Email contains: carer name, link to form, expiry date
- [ ] Link format: `https://[domain]/references/[token]`
- [ ] Reference status shows "Pending"
- [ ] Staff can resend request if expired

**Test Steps:**
1. Log in as staff
2. Navigate to references step in onboarding
3. Click "Add Reference"
4. Enter referee details:
   - Name: "Jane Smith"
   - Email: "jane@happydaysnursery.com"
   - Relationship: "Former Manager"
5. Click "Send Request"
6. Verify entry in `carer_references` table
7. Verify token generated
8. Check email inbox (use test email)
9. Verify email received with link
10. Verify link contains token
11. Verify status shows "Pending" in UI

---

### SLICE 4.3: Reference Form (Public Route)
**Priority:** P1 - COMPLIANCE REQUIREMENT  
**Estimated Effort:** 6 hours

**Why:** Referees need to submit references without logging in.

**Dependencies:** SLICE 4.2

**Files to Create:**
- `app/references/[token]/page.tsx` - Public reference form
- `app/api/references/[token]/route.ts` - Submit reference
- `app/components/ReferenceForm.tsx` - Form component
- `app/lib/validations/reference.ts` - Zod schemas

**Form Fields:**
- Referee Name (pre-filled from request)
- Referee Email (pre-filled, readonly)
- Setting Name
- Ofsted URN (validated format)
- Ofsted Rating (dropdown)
- Work Period (from/to dates)
- Role (text)
- Reason for Leaving (text)
- Q1: Childcare Skills (1-5 stars)
- Q2: Reliability (1-5 stars)
- Q3: Teamwork (1-5 stars)
- Q5: Would you rehire? (Yes/No)
- Q8: Any safeguarding concerns? (Yes/No)
  - If Yes: Details (textarea)
- Consent checkbox: "I confirm this information is accurate"

**Acceptance Criteria:**
- [ ] Form accessible without login
- [ ] Invalid token shows "Link expired or invalid"
- [ ] Expired token (>14 days) shows "Link expired"
- [ ] Already submitted token shows "Reference already submitted"
- [ ] Domain email validation (no gmail/yahoo/hotmail)
- [ ] Ofsted URN format validated (EY######)
- [ ] All fields required
- [ ] Safeguarding details required if concerns = Yes
- [ ] Submit updates reference record
- [ ] Status changed to 'completed'
- [ ] IP address and user agent logged
- [ ] Submitted_at timestamp recorded
- [ ] Staff notified via email
- [ ] Admin notified for review

**Test Steps:**
1. Get token from SLICE 4.2 test
2. Open link in incognito window (not logged in)
3. Verify form loads
4. Try to submit with personal email (should reject)
5. Enter domain email: "jane@happydaysnursery.com"
6. Fill all fields:
   - Setting: "Happy Days Nursery"
   - URN: "EY123456"
   - Rating: "Good"
   - Period: 2023-01-01 to 2024-12-31
   - Role: "Room Leader"
   - Reason: "Career progression"
   - Skills: 5 stars
   - Reliability: 5 stars
   - Teamwork: 4 stars
   - Would rehire: Yes
   - Safeguarding: No
7. Check consent checkbox
8. Click Submit
9. Verify success message
10. Verify reference record updated in database
11. Verify status = 'completed'
12. Verify IP address logged
13. Try to submit again (should show "already submitted")
14. Verify staff received email notification

---

## PHASE 5: JOB MARKETPLACE

### SLICE 5.1: Job Request Tables & Basic Job Posting
**Priority:** P0 - CORE FEATURE  
**Estimated Effort:** 8 hours

**Why:** Cannot have marketplace without job postings. Core business feature.

**Dependencies:** SLICE 2.1 (settings table), SLICE 3.1 (staff table)

**Files to Create:**
- `supabase/migrations/0005_job_requests_placements.sql`
- `app/settings/dashboard/page.tsx` - Settings dashboard
- `app/settings/post-job/page.tsx` - Job posting form
- `app/api/jobs/create/route.ts` - Create job endpoint
- `app/components/JobPostForm.tsx` - Form component
- `app/lib/validations/job.ts` - Zod schemas

**Database Migration:**
```sql
-- supabase/migrations/0005_job_requests_placements.sql
create table job_requests (
  id uuid primary key default gen_random_uuid(),
  setting_id uuid not null references childcare_settings(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  role text not null,
  responsibilities text[],
  additional_tasks text,
  hourly_rate decimal(10, 2) default 22.00,
  total_cost decimal(10, 2),
  status text default 'open' check (status in ('open', 'filled', 'cancelled')),
  created_at timestamptz default now()
);

create table placements (
  id uuid primary key default gen_random_uuid(),
  job_request_id uuid not null references job_requests(id) on delete cascade,
  primary_carer_id uuid references staff_profiles(id),
  secondary_carer_id uuid references staff_profiles(id),
  assigned_carer_id uuid references staff_profiles(id),
  status text default 'confirmed' check (status in ('confirmed', 'completed', 'cancelled', 'no_show')),
  check_in_time timestamptz,
  check_out_time timestamptz,
  actual_hours decimal(5, 2),
  emergency_bonus_paid boolean default false,
  created_at timestamptz default now()
);

create index idx_jobs_setting on job_requests(setting_id);
create index idx_jobs_date on job_requests(date);
create index idx_jobs_status on job_requests(status);
create index idx_placements_job on placements(job_request_id);
create index idx_placements_primary on placements(primary_carer_id);
create index idx_placements_secondary on placements(secondary_carer_id);

alter table job_requests enable row level security;
alter table placements enable row level security;

create policy "Settings can view own jobs"
  on job_requests for select using (
    setting_id in (select id from childcare_settings where id = auth.uid())
  );

create policy "Settings can create jobs"
  on job_requests for insert with check (
    setting_id in (select id from childcare_settings where id = auth.uid())
  );

create policy "Staff can view jobs"
  on job_requests for select using (status = 'open');

create policy "Admins can view all jobs"
  on job_requests for select using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
```

**Job Posting Form Fields:**
- Date (date picker, cannot be in past)
- Start Time (time picker)
- End Time (time picker)
- Role (dropdown: Nursery Nurse, Room Leader, Deputy Manager, Manager)
- Responsibilities (multi-select checkboxes):
  - Supervise children
  - Prepare activities
  - Maintain records
  - Liaise with parents
  - Ensure safety
  - Follow policies
- Additional Tasks (textarea)
- Hourly Rate (readonly, £22.00)
- Total Cost (auto-calculated: hours × rate)

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] Settings can access `/settings/dashboard`
- [ ] Dashboard shows "Post Job" button
- [ ] Click button goes to `/settings/post-job`
- [ ] Form validates all fields
- [ ] Cannot select past date
- [ ] End time must be after start time
- [ ] Total cost auto-calculates
- [ ] Submit creates job in `job_requests` table
- [ ] Status set to 'open'
- [ ] User redirected to job details page

**Test Steps:**
1. Run migration
2. Log in as approved setting
3. Navigate to `/settings/dashboard`
4. Click "Post Job"
5. Fill form:
   - Date: Tomorrow
   - Start: 09:00
   - End: 17:00
   - Role: "Nursery Nurse"
   - Responsibilities: Check 3 items
   - Additional: "Must have Level 2"
6. Verify total cost shows £176 (8 hours × £22)
7. Click Submit
8. Verify job in `job_requests` table
9. Verify status = 'open'
10. Verify redirected to job details

---

### SLICE 5.2: Available Jobs List (Staff Side)
**Priority:** P0 - CORE FEATURE  
**Estimated Effort:** 6 hours

**Why:** Staff need to see available jobs to respond.

**Dependencies:** SLICE 5.1

**Files to Create:**
- `app/staff/dashboard/page.tsx` - Staff dashboard
- `app/staff/jobs/page.tsx` - Available jobs list
- `app/staff/jobs/[id]/page.tsx` - Job details
- `app/api/staff/available-jobs/route.ts` - Get available jobs
- `app/components/JobCard.tsx` - Job card component

**Acceptance Criteria:**
- [ ] Staff can access `/staff/dashboard`
- [ ] Dashboard shows available jobs count
- [ ] Click "View Jobs" goes to `/staff/jobs`
- [ ] Jobs filtered by:
  - Status = 'open'
  - Date >= today
  - Within travel radius (if location set)
- [ ] Each job card shows:
  - Setting name
  - Date and time
  - Role
  - Hours
  - Pay (£15.50/hour for staff)
  - Total pay
  - Distance/travel time (if location set)
- [ ] Click job goes to details page
- [ ] Details show:
  - All job info
  - Setting details (rating, parking, etc.)
  - Responsibilities
  - Additional tasks
- [ ] "Available" and "Not Available" buttons visible

**Test Steps:**
1. Log in as approved staff
2. Navigate to `/staff/dashboard`
3. Verify shows "X jobs available"
4. Click "View Jobs"
5. Verify job from SLICE 5.1 appears
6. Verify shows:
   - "Happy Days Nursery"
   - Tomorrow's date
   - "09:00 - 17:00"
   - "Nursery Nurse"
   - "8 hours"
   - "£124.00" (8 × £15.50)
7. Click on job
8. Verify details page shows all info
9. Verify "Available" and "Not Available" buttons present

---

### SLICE 5.3: Job Response System
**Priority:** P0 - CORE FEATURE  
**Estimated Effort:** 6 hours

**Why:** Staff need to indicate availability for jobs.

**Dependencies:** SLICE 5.2

**Files to Create:**
- `supabase/migrations/0006_job_responses.sql`
- `app/api/jobs/respond/route.ts` - Respond to job
- `app/components/JobResponseButtons.tsx` - Response buttons

**Database Migration:**
```sql
-- supabase/migrations/0006_job_responses.sql
create table job_responses (
  id uuid primary key default gen_random_uuid(),
  job_request_id uuid not null references job_requests(id) on delete cascade,
  carer_id uuid not null references staff_profiles(id) on delete cascade,
  response text not null check (response in ('available', 'not_available')),
  created_at timestamptz default now(),
  unique(job_request_id, carer_id)
);

create index idx_responses_job on job_responses(job_request_id);
create index idx_responses_carer on job_responses(carer_id);

alter table job_responses enable row level security;

create policy "Staff can insert own responses"
  on job_responses for insert with check (
    carer_id in (select id from staff_profiles where id = auth.uid())
  );

create policy "Settings can view responses for own jobs"
  on job_responses for select using (
    job_request_id in (
      select id from job_requests where setting_id = auth.uid()
    )
  );

create policy "Staff can view own responses"
  on job_responses for select using (
    carer_id in (select id from staff_profiles where id = auth.uid())
  );
```

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] Staff can click "Available" or "Not Available"
- [ ] Response recorded in `job_responses` table
- [ ] Cannot respond twice to same job
- [ ] Button states update after response
- [ ] "Available" shows green checkmark
- [ ] "Not Available" shows red X
- [ ] Setting receives notification of response

**Test Steps:**
1. Run migration
2. Log in as staff
3. Navigate to job details from SLICE 5.2
4. Click "Available"
5. Verify response in `job_responses` table
6. Verify response = 'available'
7. Verify button shows green checkmark
8. Try to click again (should be disabled)
9. Refresh page, verify state persists

---

### SLICE 5.4: Carer Selection (Setting Side)
**Priority:** P0 - CORE FEATURE  
**Estimated Effort:** 8 hours

**Why:** Settings need to select primary and secondary carers from responses.

**Dependencies:** SLICE 5.3

**Files to Create:**
- `app/settings/jobs/[id]/page.tsx` - Job details with responses
- `app/api/jobs/select-carer/route.ts` - Select carer endpoint
- `app/components/CarerSelectionModal.tsx` - Selection modal
- `app/components/CarerResponseCard.tsx` - Carer card

**Acceptance Criteria:**
- [ ] Setting can view job details
- [ ] Available carers listed with:
  - Name
  - Qualification level
  - Rating
  - Total shifts
  - Travel time
  - Response time
- [ ] Setting can select primary carer
- [ ] Modal prompts to select secondary carer
- [ ] Both selections create placement record
- [ ] Primary carer receives confirmation email
- [ ] Secondary carer receives standby email
- [ ] Job status changes to 'filled'

**Test Steps:**
1. Log in as setting
2. Navigate to job posted in SLICE 5.1
3. Verify shows available carers (staff from SLICE 5.3)
4. Click "Select" on first carer
5. Verify modal prompts for secondary
6. Select second carer
7. Click "Confirm Selection"
8. Verify placement created in database
9. Verify primary_carer_id and secondary_carer_id set
10. Verify job status = 'filled'
11. Check emails sent to both carers

---

## PHASE 6: CHECK-IN/OUT SYSTEM

### SLICE 6.1: GPS Check-In (Web Geolocation)
**Priority:** P1 - COMPLIANCE  
**Estimated Effort:** 8 hours

**Why:** Spec requires location verification for check-in.

**Dependencies:** SLICE 5.4

**Files to Create:**
- `supabase/migrations/0007_shift_check_ins.sql`
- `app/staff/shifts/[id]/page.tsx` - Shift details with check-in
- `app/api/check-in/route.ts` - Check-in endpoint
- `app/components/CheckInButton.tsx` - GPS check-in component

**Database Migration:**
```sql
-- supabase/migrations/0007_shift_check_ins.sql
create table shift_check_ins (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references placements(id) on delete cascade,
  carer_id uuid not null references staff_profiles(id) on delete cascade,
  check_in_type text not null check (check_in_type in ('start', 'end')),
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  accuracy decimal(6, 2),
  distance_from_setting decimal(6, 2),
  verified boolean default false,
  location_permission_granted boolean default false,
  ip_address inet,
  user_agent text,
  device_info jsonb,
  requires_admin_review boolean default false,
  admin_reviewed boolean default false,
  admin_notes text,
  checked_in_at timestamptz default now()
);

create index idx_check_ins_placement on shift_check_ins(placement_id);
create index idx_check_ins_carer on shift_check_ins(carer_id);

alter table shift_check_ins enable row level security;

create policy "Staff can insert own check-ins"
  on shift_check_ins for insert with check (
    carer_id in (select id from staff_profiles where id = auth.uid())
  );

create policy "Staff can view own check-ins"
  on shift_check_ins for select using (
    carer_id in (select id from staff_profiles where id = auth.uid())
  );

create policy "Settings can view check-ins for own jobs"
  on shift_check_ins for select using (
    placement_id in (
      select p.id from placements p
      join job_requests j on j.id = p.job_request_id
      where j.setting_id = auth.uid()
    )
  );
```

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] Staff can access upcoming shift
- [ ] "Check In" button visible
- [ ] Click button requests location permission
- [ ] If permission granted:
  - Gets GPS coordinates
  - Calculates distance from setting
  - If within 100m: Check-in successful
  - If >100m: Shows error with distance
- [ ] If permission denied:
  - Shows fallback option
  - Allows manual check-in
  - Flags for admin review
  - Notifies setting for confirmation
- [ ] Check-in updates placement status
- [ ] Setting receives notification

**Test Steps:**
1. Run migration
2. Log in as staff with confirmed placement
3. Navigate to shift details
4. Click "Check In"
5. Allow location permission
6. If near setting (or using mock location):
   - Verify check-in successful
   - Verify record in `shift_check_ins` table
   - Verify verified = true
   - Verify distance calculated
7. If far from setting:
   - Verify error message shows distance
   - Verify check-in not recorded
8. Deny location permission:
   - Verify fallback UI shown
   - Complete manual check-in
   - Verify verified = false
   - Verify requires_admin_review = true

---

## PHASE 7: PAYMENTS (Critical for Revenue)

### SLICE 7.1: Stripe Connect Integration
**Priority:** P0 - REVENUE BLOCKING  
**Estimated Effort:** 12 hours

**Why:** Cannot process payments without Stripe.

**Dependencies:** All previous slices

**Files to Create:**
- `app/lib/stripe.ts` - Stripe client
- `app/api/stripe/connect/create-account/route.ts` - Create Connect account
- `app/api/stripe/connect/onboard/route.ts` - Onboarding link
- `app/api/stripe/charge-setting/route.ts` - Charge setting
- `app/api/stripe/payout-carer/route.ts` - Payout carer
- `app/api/webhooks/stripe/route.ts` - Webhook handler
- `supabase/migrations/0008_payment_tables.sql`

**Environment Variables:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Database Migration:**
```sql
-- supabase/migrations/0008_payment_tables.sql
create table carer_invoices (
  id uuid primary key default gen_random_uuid(),
  carer_id uuid not null references staff_profiles(id) on delete cascade,
  placement_id uuid not null references placements(id) on delete cascade,
  hours_worked decimal(5, 2) not null,
  hourly_rate decimal(10, 2) default 15.50,
  base_amount decimal(10, 2) not null,
  emergency_bonus decimal(10, 2) default 0,
  sms_charges decimal(10, 2) default 0,
  final_amount decimal(10, 2) not null,
  status text default 'pending' check (status in ('pending', 'paid')),
  submitted_at timestamptz default now(),
  due_date timestamptz,
  paid_at timestamptz,
  stripe_transfer_id text
);

create table setting_invoices (
  id uuid primary key default gen_random_uuid(),
  setting_id uuid not null references childcare_settings(id) on delete cascade,
  billing_month text not null,
  subscription_fee decimal(10, 2) not null,
  hourly_fees decimal(10, 2) default 0,
  total_amount decimal(10, 2) not null,
  stripe_invoice_id text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

alter table childcare_settings add column stripe_customer_id text;
alter table staff_profiles add column stripe_account_id text;

create index idx_carer_invoices_carer on carer_invoices(carer_id);
create index idx_carer_invoices_status on carer_invoices(status);
create index idx_setting_invoices_setting on setting_invoices(setting_id);
```

**Acceptance Criteria:**
- [ ] Stripe SDK installed
- [ ] Stripe client initialized
- [ ] Carers can create Connect account
- [ ] Settings can add payment method
- [ ] Can charge setting for job
- [ ] Can payout carer (Net-30)
- [ ] Webhooks handle payment events
- [ ] Invoices created in database
- [ ] Payment status tracked

**Test Steps:**
1. Install Stripe: `npm install stripe @stripe/stripe-js`
2. Add API keys to `.env.local`
3. Create test carer Connect account
4. Add test payment method for setting
5. Create test charge
6. Verify charge in Stripe dashboard
7. Create test payout
8. Verify payout in Stripe dashboard
9. Test webhook with Stripe CLI
10. Verify invoice records created

---

## SUMMARY

**Total Slices:** 20+  
**Estimated Total Effort:** 120+ hours  
**Critical Path:** Slices 1.1 → 1.2 → 2.1 → 2.2 → 5.1 → 5.2 → 5.3 → 5.4 → 7.1

**Priority Order:**
1. **P0 (BLOCKING MVP):** Slices 1.1, 1.2, 2.1, 2.2, 5.1-5.4, 7.1
2. **P1 (REQUIRED):** Slices 3.1-3.3, 4.1-4.3, 6.1
3. **P2 (IMPORTANT):** Remaining features (notifications, reviews, strikes, etc.)

**Next Immediate Action:**
Start with SLICE 1.1 (Install Supabase client) - this unblocks everything else.
