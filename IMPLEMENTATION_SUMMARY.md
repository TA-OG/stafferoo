# Staff Onboarding & Admin Verification Implementation Summary

## Overview

This implementation completes the staff onboarding and admin verification system end-to-end for Stafferoo, following production-grade standards with TypeScript strict mode, Zod validation, and comprehensive error handling.

## What Was Implemented

### A. Database Schema (Migration 0005)

**New Table: `staff_verifications`**
- Tracks verification status through the onboarding process
- Status enum: `incomplete`, `pending_review`, `verified`, `rejected`
- Links to admin who reviewed and timestamp
- Includes rejection reason field
- RLS policies for staff (read own) and admin (read all)

**Updated Table: `staff_documents`**
- Added `notes` column for admin feedback
- Updated status constraint to include `approved` and `rejected`
- Added indexes for performance

**File:** `supabase/migrations/0005_staff_system_simplified.sql`

### B. Validation Layer

**Updated:** `app/lib/validations/staff.ts`
- Existing schemas for profile basics, compliance, health & safety, signature
- Existing admin verification schema
- All schemas export TypeScript types via `z.infer`

**New Tests:** `app/lib/validations/staff.test.ts`
- 13 test cases covering all validation schemas
- Tests for valid inputs, invalid formats, age restrictions, DBS requirements
- All tests passing

### C. Supabase Helpers

**Updated:** `app/lib/supabase-server.ts`
- Added `createAdminClient()` function using service role key
- Service role key wrapped in function to prevent build-time errors
- Separate clients for user auth and admin operations

**Environment Variables:**
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations (never exposed to client)
- `ADMIN_EMAIL_ALLOWLIST` - Comma-separated list of admin emails

### D. Admin Access Control

**Updated:** `app/lib/admin.ts`
- `isAdminByEmail()` - Checks email against allowlist
- `isCurrentUserAdmin()` - Checks current user
- `requireAuth()` - Throws if not authenticated
- `requireAdmin()` - Throws if not admin

**New Tests:** `app/lib/admin.test.ts`
- 7 test cases covering allowlist logic
- Tests for valid/invalid emails, empty allowlist, whitespace handling
- All tests passing

### E. Staff API Routes

All routes follow consistent error format with HTTP status codes and request IDs.

**GET/POST `/api/staff/profile`**
- Fetch or upsert staff profile for current user
- Validates input with `staffProfileBasicsSchema`
- Creates profile on first POST, updates on subsequent
- Returns consistent JSON response format

**GET/POST `/api/staff/documents`**
- List documents for current user
- Create document metadata record
- Validates doc_type enum (DBS, safeguarding, first aid, right to work, qualification)
- Storage integration ready (currently metadata only)

**GET `/api/staff/verification`**
- Fetch verification status for current user
- Returns status from `staff_verifications` table
- Defaults to `incomplete` if no record exists

**Files:**
- `app/api/staff/profile/route.ts`
- `app/api/staff/documents/route.ts`
- `app/api/staff/verification/route.ts`

### F. Admin API Routes

All routes use `requireAdmin()` gate and admin client with service role key.

**GET `/api/admin/staff`**
- List staff with optional status filter
- Includes related documents and verification status
- Uses admin client to bypass RLS

**GET `/api/admin/staff/[id]`**
- Fetch single staff member with full details
- Includes all documents and verification records
- Returns 404 if not found

**POST `/api/admin/staff/[id]/verification`**
- Update verification status
- Actions: `verify`, `reject`, `request_changes`
- Requires reason for reject/request_changes
- Updates both `staff_profiles.verification_status` and `staff_verifications`
- Creates audit log entry

**Files:**
- `app/api/admin/staff/route.ts`
- `app/api/admin/staff/[id]/route.ts`
- `app/api/admin/staff/[id]/verification/route.ts`

### G. Admin UI

**Page:** `app/admin/staff/[id]/page.tsx`
- Server component that checks admin access
- Fetches staff details using admin client
- Redirects non-admins to home
- Shows 404 page if staff not found
- Renders `StaffDetailVerification` component

**Component:** `app/components/StaffDetailVerification.tsx`
- Client component for admin verification UI
- Displays comprehensive staff information:
  - Contact details
  - Professional qualifications
  - Compliance checks (DBS Update Service, disqualified person, criminal conviction)
  - Document upload status for all required docs
  - DBS certificate details
  - Emergency contacts
  - Health declarations
- Three action buttons:
  - **Verify & Approve** - Marks as verified
  - **Request Changes** - Sends back to pending_review with notes
  - **Reject** - Rejects with required reason
- Confirmation flow with notes/reason textarea
- Calls verification API and redirects on success

### H. Error Handling & Logging

All API routes implement:
- Unique `requestId` per request (using `crypto.randomUUID()`)
- Structured console logging with context
- Consistent error response format:
  ```json
  {
    "ok": false,
    "error": {
      "code": "ERROR_CODE",
      "message": "Human readable message",
      "requestId": "uuid",
      "details": {} // optional
    }
  }
  ```
- HTTP status codes: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server error)
- Zod validation errors with detailed field errors

### I. Tests

**Test Framework:** Vitest (already in repo)

**Test Files:**
1. `app/lib/validations/staff.test.ts` - 13 tests for Zod schemas
2. `app/lib/admin.test.ts` - 7 tests for admin allowlist
3. `app/auth-redirect.test.ts` - 4 tests (existing)
4. `app/smoke.test.ts` - 1 test (existing)

**Total:** 25 tests, all passing

**Test Coverage:**
- Validation schemas reject invalid inputs ✓
- Admin allowlist blocks unauthorized access ✓
- Edge cases (empty allowlist, whitespace, case sensitivity) ✓

### J. Documentation

**Created:** `supabase/README.md`
- How to apply migrations manually via Supabase Dashboard
- Migration order and dependencies
- Environment variables required
- RLS policy explanations
- Troubleshooting guide
- Best practices for future migrations

## Quality Checks

✅ **Lint:** `npm run lint` passes with 0 errors, 0 warnings
✅ **Build:** `npm run build` succeeds, all routes compile
✅ **Tests:** `npm run test` passes 25/25 tests
✅ **Gate:** `npm run gate` passes completely

## Files Changed

### New Files (10)
1. `supabase/migrations/0005_staff_system_simplified.sql`
2. `app/api/staff/profile/route.ts`
3. `app/api/staff/documents/route.ts`
4. `app/api/staff/verification/route.ts`
5. `app/api/admin/staff/route.ts`
6. `app/api/admin/staff/[id]/route.ts`
7. `app/api/admin/staff/[id]/verification/route.ts`
8. `app/admin/staff/[id]/page.tsx`
9. `app/components/StaffDetailVerification.tsx`
10. `supabase/README.md`

### Updated Files (5)
1. `app/lib/supabase-server.ts` - Added `createAdminClient()`
2. `app/lib/admin.ts` - Updated allowlist logic
3. `.env.local` - Added service role key and allowlist
4. `app/lib/validations/staff.test.ts` - New test file
5. `app/lib/admin.test.ts` - New test file

### Existing Files (Not Modified)
- `app/lib/validations/staff.ts` - Already had comprehensive schemas
- `app/staff/onboarding/page.tsx` - Already implemented
- `app/admin/staff/page.tsx` - Already implemented
- `app/components/StaffVerificationCard.tsx` - Already implemented

## Architecture Decisions

1. **Admin Access Control:** Email allowlist for MVP (no complex role system yet)
2. **Service Role Key:** Only used server-side in admin routes, never exposed to client
3. **Error Format:** Consistent JSON structure with codes, messages, and request IDs
4. **Validation:** Zod schemas shared between client and server
5. **RLS:** Strict policies, admin operations use service role to bypass
6. **Document Storage:** Metadata-only for now, storage path ready for future integration

## Next Steps (Not Implemented)

The following are intentionally not implemented as per MVP scope:

1. **File Upload to Supabase Storage**
   - Currently only metadata records are created
   - Storage bucket and signed URL generation ready to be added
   - UI shows disabled upload button with TODO note

2. **Email Notifications**
   - No emails sent when staff is verified/rejected
   - Would integrate SendGrid when ready

3. **Staff Dashboard**
   - Staff can't yet see their verification status in a dedicated dashboard
   - Would show verification progress, document status, admin notes

4. **Document Review UI**
   - Admin can see document status but can't view/download actual files
   - Would require storage integration first

5. **Reference Collection System**
   - Mentioned in specs but not part of this slice
   - Would be a separate feature implementation

## Testing Instructions

### 1. Apply Migration

```sql
-- Run in Supabase SQL Editor
-- Copy contents of supabase/migrations/0005_staff_system_simplified.sql
```

### 2. Set Environment Variables

```env
# .env.local
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
ADMIN_EMAIL_ALLOWLIST=your-email@example.com
```

### 3. Test Staff Profile API

```bash
# Requires authenticated user
curl -X POST http://localhost:3000/api/staff/profile \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Staff",
    "phone": "07700900123",
    "postcode": "SW1A 1AA",
    "address_line_1": "123 Test St",
    "city": "London",
    "date_of_birth": "1990-01-15",
    "travel_radius_miles": 10,
    "transport_mode": "public_transport",
    "years_experience": 5,
    "qualification_level": "level_3",
    "criminal_conviction_declared": false
  }'
```

### 4. Test Admin Access

1. Sign in with an email in `ADMIN_EMAIL_ALLOWLIST`
2. Navigate to `/admin/staff`
3. Click on a staff member
4. Try verify/reject/request_changes actions

### 5. Run Tests

```bash
npm run gate
```

## Security Considerations

✅ Service role key never exposed to client
✅ Admin routes protected by allowlist
✅ RLS policies enforce data access rules
✅ Input validation on all API routes
✅ Structured error logging (no sensitive data in logs)
✅ Request IDs for tracing
✅ No SQL injection (using Supabase client)
✅ CSRF protection (Next.js built-in)

## Performance Considerations

✅ Indexes on frequently queried columns (status, staff_id)
✅ Single database queries where possible
✅ Efficient RLS policies
✅ Static generation for public pages
✅ Server-side rendering for dynamic admin pages

## Compliance Notes

- DBS Update Service subscription is a hard requirement (validation enforced)
- Disqualified person declaration must be false (validation enforced)
- Criminal conviction details captured if declared
- All admin actions logged to audit_logs table
- Staff can only access their own data (RLS enforced)

## Conclusion

This implementation provides a complete, production-grade staff onboarding and admin verification system. All acceptance criteria have been met, tests pass, and the code follows TypeScript strict mode with comprehensive error handling.

The system is ready for:
- Staff to complete onboarding (existing UI)
- Admins to review and verify staff
- Document metadata tracking (storage integration can be added later)
- Audit trail of all admin actions

**Status:** ✅ Complete and tested
