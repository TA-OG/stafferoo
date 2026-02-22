# Quick Test Guide - Staff Onboarding Step 2

## Prerequisites

1. Supabase project configured with `.env.local`
2. Database migrations applied (staff_profiles table exists)
3. Dev server running: `npm run dev`

## Test Scenario: Save Step 2 Profile

### 1. Sign In

```
URL: http://localhost:3000/auth
Action: Sign in with test credentials
Expected: Redirects to home or onboarding
```

### 2. Navigate to Onboarding

```
URL: http://localhost:3000/staff/onboarding
Expected: See Step 1 (Account Status)
Action: Click "Continue"
```

### 3. Fill Step 2 Form

```
Full Name: Test Staff
NI Number: AB 12 34 56 C  (test spaced format)
Date of Birth: 1990-01-01  (any date 18-75 years ago)
Phone: 07700900123
Address Line 1: 123 Test Street
Address Line 2: (leave empty)
City: London
Postcode: sw1a 1aa  (test lowercase)
Travel Radius: 10
Transport Mode: Public Transport
Years Experience: 5
Qualification: Level 3
Criminal Conviction: No (unchecked)
```

### 4. Submit

```
Action: Click "Continue"
Expected: 
  ✅ Form saves successfully
  ✅ Advances to Step 3
  ✅ No 401 error in console
```

### 5. Verify Network Request

Open DevTools → Network tab → Find `save-step` request:

```
Request:
  Method: POST
  URL: /api/staff/profile/save-step
  Cookies: ✅ sb-access-token present
  Body: { step: 2, data: { ... } }

Response:
  Status: 200 OK
  Body: { ok: true, data: { step: 2, saved: true } }
```

### 6. Verify Database

Supabase Dashboard → Table Editor → `staff_profiles`:

```
Expected row:
  id: (your user ID)
  full_name: "Test Staff"
  national_insurance_number: "AB123456C"  (normalized)
  postcode: "SW1A 1AA"  (normalized)
  phone: "07700900123"
  ... (all other fields)
```

## Test Scenario: 401 Redirect

### 1. Clear Cookies

```
DevTools → Application → Storage → Clear site data
```

### 2. Try to Access Onboarding

```
URL: http://localhost:3000/staff/onboarding
Expected: Redirects to /auth?redirectTo=/staff/onboarding
```

## Test Scenario: Validation Errors

### Invalid NI Number

```
Input: "12345678"
Expected: Validation error "Invalid NI number format"
```

### Invalid Postcode

```
Input: "INVALID"
Expected: Validation error "Invalid UK postcode format"
```

### Age Out of Range

```
Input: 2010-01-01 (too young)
Expected: Validation error "Must be between 18 and 75 years old"
```

## Commands

```bash
# Start dev server
npm run dev

# Run lint
npm run lint

# Run build
npm run build
```

## Success Criteria

✅ Step 2 saves without 401 error
✅ Data appears in database with normalized values
✅ NI number accepts both formats (compact and spaced)
✅ Postcode normalizes to uppercase
✅ Validation errors show clear messages
✅ 401 redirects to /auth when not signed in
✅ Cookies present in all requests

## Troubleshooting

**401 Error:**
- Restart dev server
- Clear cookies and sign in fresh
- Check `.env.local` has correct Supabase credentials

**Validation Error:**
- Check NI format: AB123456C or AB 12 34 56 C
- Check postcode format: SW1A 1AA
- Check age: 18-75 years old

**No Cookies:**
- Check middleware.ts exists at repo root
- Restart dev server
- Verify cookies in DevTools after sign in
