# Slice 2: Quick Reference Commands

## PowerShell Commands (run in project root)

```powershell
# Install dependencies
npm install

# Run linter
npm run lint

# Build project
npm run build

# Start dev server
npm run dev
```

---

## Supabase SQL Commands

### 1. Apply Migration
Copy and paste the entire contents of `supabase/migrations/0003_staff_onboarding_complete.sql` into Supabase SQL Editor and run.

### 2. Create Storage Bucket
- Dashboard → Storage → Create new bucket
- Name: `staff-documents`
- Public: **OFF** (private)

### 3. Storage Policies
Run these in Supabase SQL Editor:

```sql
-- Policy 1: Upload
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Read
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'staff-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Update
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'staff-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Test URLs

- Onboarding: `http://localhost:3000/staff/onboarding`
- Home: `http://localhost:3000`

---

## Test User Credentials

Create in Supabase Dashboard → Authentication → Users:
- Email: `teststaff@example.com`
- Password: `TestPassword123!`
- Auto Confirm: **YES**
