# Slice 2: Setup and Test Guide

## Prerequisites
- Supabase project configured with Auth enabled
- `.env.local` file with Supabase credentials
- Node.js and npm installed

---

## Part 1: Database Setup

### Step 1: Apply Migration

1. Open your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `zkqysmbyfrijmfrrjxps`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file `supabase/migrations/0003_staff_onboarding_complete.sql` in your code editor
6. Copy the entire contents
7. Paste into the Supabase SQL Editor
8. Click **Run** (or press Ctrl+Enter)
9. Verify: You should see "Success. No rows returned"

### Step 2: Create Storage Bucket

1. In Supabase dashboard, click **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Enter bucket name: `staff-documents`
4. Set **Public bucket** to **OFF** (private bucket)
5. Click **Create bucket**

### Step 3: Set Storage Bucket Policies

1. Click on the `staff-documents` bucket
2. Click **Policies** tab
3. Click **New Policy**
4. Click **Create a policy from scratch**

**Policy 1: Allow authenticated users to upload their own files**
```sql
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 2: Allow authenticated users to read their own files**
```sql
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'staff-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 3: Allow authenticated users to update their own files**
```sql
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'staff-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

4. Click **Review** then **Save policy** for each

---

## Part 2: Install Dependencies and Build

Open PowerShell in the project root (`c:\dev\REC-APP`) and run:

```powershell
# Install dependencies (if not already installed)
npm install

# Run linter
npm run lint

# Build the project
npm run build

# Start dev server
npm run dev
```

Expected output:
```
> rec-app@0.1.0 dev
> next dev

  ▲ Next.js 16.1.6
  - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in 2.3s
```

---

## Part 3: Create Test User

### Option A: Using Supabase Dashboard

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **Add user** → **Create new user**
3. Enter email: `teststaff@example.com`
4. Enter password: `TestPassword123!`
5. Check **Auto Confirm User**
6. Click **Create user**
7. Copy the user ID (UUID) for reference

### Option B: Using Sign Up Flow (if you have a sign-up page)

1. Navigate to your sign-up page
2. Create account with email and password
3. Verify email if required

---

## Part 4: Manual Test Script

### Test 1: Access Onboarding (Unauthenticated)

1. Open browser to: `http://localhost:3000/staff/onboarding`
2. **Expected**: "Access Denied" error message
3. **Reason**: User must be authenticated

### Test 2: Sign In

1. Sign in with test user credentials
   - Email: `teststaff@example.com`
   - Password: `TestPassword123!`

### Test 3: Access Onboarding (Authenticated)

1. Navigate to: `http://localhost:3000/staff/onboarding`
2. **Expected**: Step 1 - Account Status page
3. **Verify**: Your email is displayed
4. Click **Continue to Profile Details**

### Test 4: Step 2 - Profile Basics

Fill in the form:
- **Full Name**: John Smith
- **National Insurance Number**: AB123456C
- **Date of Birth**: 1990-01-15
- **Phone Number**: 07700900123
- **Address Line 1**: 123 High Street
- **City**: London
- **Postcode**: SW1A 1AA
- **Travel Radius**: 15 miles
- **Transport Mode**: Public Transport
- **Years of Experience**: 5
- **Qualification Level**: Level 3
- **Criminal Conviction**: Leave unchecked

Click **Continue**

**Expected**: Progress saves, moves to Step 3

### Test 5: Verify Progress Persistence

1. Refresh the page (F5)
2. **Expected**: You should be on Step 3 (not back to Step 1)
3. **Reason**: Profile data was saved and step progress restored

### Test 6: Step 3 - Compliance (DBS Hard Stop)

1. Try clicking **Continue** without checking DBS Update Service
2. **Expected**: Alert: "You must subscribe to the DBS Update Service to continue"
3. Check the DBS Update Service checkbox
4. Fill in:
   - **DBS Certificate Number**: 001234567890
   - **DBS Issue Date**: 2024-01-15
   - **Surname on Certificate**: Smith

### Test 7: Document Uploads

For each document type, upload a test file (PDF, JPG, or PNG under 10MB):

1. **DBS Certificate**: Upload a test PDF
   - **Expected**: "Uploading..." then "Uploaded successfully" with green checkmark
2. **Safeguarding Certificate**: Upload a test file
3. **Paediatric First Aid**: Upload a test file
4. **Right to Work**: Upload a test file
5. **Qualification Certificate**: Upload a test file

**Verify**: All 5 documents show green checkmark

Click **Continue**

**Expected**: Progress saves, moves to Step 4

### Test 8: Step 4 - Health and Safety

Fill in:

**Emergency Contact 1**:
- Name: Jane Smith
- Phone: 07700900456
- Relationship: Spouse

**Emergency Contact 2** (optional):
- Leave blank or fill in

**GP Details**:
- GP Name: Dr. Sarah Johnson
- GP Address: 456 Medical Centre, London, SW1A 2BB

**Health Declaration**:
- Check: Asthma
- Check: Allergies
- Add notes: "Mild asthma, controlled with inhaler. Allergic to penicillin."

**Lifestyle Declarations**:
- Smoking Status: Non-smoker
- Drugs and Alcohol: "No history of drug or alcohol issues"

**Disqualified Person**:
- Leave **UNCHECKED** (must be false to proceed)

Click **Continue**

**Expected**: Progress saves, moves to Step 5

### Test 9: Step 5 - Signature and Submit

1. Read the declaration
2. Sign in the signature box using your mouse
3. **Expected**: Signature appears in the canvas
4. Click **Clear Signature** to test
5. **Expected**: Canvas clears
6. Sign again
7. Check the agreement checkbox
8. Click **Submit Application**

**Expected**:
- Button shows "Submitting..."
- After 1-2 seconds, moves to Step 6 (Confirmation)

### Test 10: Confirmation Screen

**Verify**:
- Green checkmark icon
- "Application Submitted" heading
- Status: "Pending Review"
- Submitted date is shown

### Test 11: Verify in Database

1. Go to Supabase dashboard → **Table Editor**
2. Open `staff_profiles` table
3. Find your user's row (by email)
4. **Verify**:
   - `verification_status` = `pending`
   - `submitted_at` has a timestamp
   - All fields are populated (full_name, date_of_birth, etc.)
5. Open `staff_documents` table
6. **Verify**: 5 rows exist for your user with different `doc_type` values

### Test 12: Verify Files in Storage

1. Go to Supabase dashboard → **Storage** → `staff-documents`
2. Click on the folder with your user ID
3. **Verify**: 5 files are present with names like:
   - `dbs_certificate_1234567890_abc123.pdf`
   - `safeguarding_certificate_1234567891_def456.pdf`
   - etc.

---

## Part 5: Error Handling Tests

### Test 13: Incomplete Profile Submission

1. Create a new test user
2. Complete only Step 2
3. Manually navigate to: `http://localhost:3000/staff/onboarding`
4. Try to skip to Step 5 by modifying the step state (if possible via browser dev tools)
5. Try submitting
6. **Expected**: API returns error "Profile is incomplete" with list of missing fields

### Test 14: Missing Documents

1. Complete Steps 2-4 but upload only 3 out of 5 documents
2. Try submitting
3. **Expected**: Alert "Please upload all required documents before continuing"

### Test 15: Invalid File Type

1. Try uploading a `.txt` or `.exe` file
2. **Expected**: File input should reject it (accept attribute limits to PDF/images)

### Test 16: Disqualified Person Declaration

1. On Step 4, check the "I am disqualified..." checkbox
2. Try to continue
3. **Expected**: Alert "You must not be disqualified from working with children to continue"

---

## Part 6: Lint and Build Verification

```powershell
# Run linter
npm run lint
```

**Expected**: No errors

```powershell
# Build for production
npm run build
```

**Expected**: Build completes successfully with no TypeScript errors

---

## Troubleshooting

### Error: "relation staff_profiles does not exist"
- **Fix**: Run migration 0003 in Supabase SQL Editor

### Error: "Failed to create upload URL"
- **Fix**: Verify `staff-documents` bucket exists and is private
- **Fix**: Check storage policies are created correctly

### Error: "You must be signed in"
- **Fix**: Ensure user is authenticated via Supabase Auth
- **Fix**: Check `.env.local` has correct Supabase credentials

### Documents not uploading
- **Fix**: Check browser console for errors
- **Fix**: Verify file size is under 10MB
- **Fix**: Verify file type is PDF, JPG, PNG, or WEBP

### Progress not persisting
- **Fix**: Check browser console for API errors
- **Fix**: Verify RLS policies allow user to insert/update their own profile

---

## Success Criteria

✅ All 5 steps can be completed without errors  
✅ Progress persists across page reloads  
✅ DBS Update Service checkbox blocks progression  
✅ All 5 documents upload successfully  
✅ Signature can be drawn and cleared  
✅ Submit changes status to 'pending' and records timestamp  
✅ `npm run lint` passes  
✅ `npm run build` passes  
✅ Data appears correctly in Supabase tables  
✅ Files appear in Supabase Storage  

---

## Next Steps

After Slice 2 is verified:
- Implement admin verification UI (Slice 3)
- Add reference collection system (Slice 4)
- Build marketplace and booking flow (Slice 5+)
