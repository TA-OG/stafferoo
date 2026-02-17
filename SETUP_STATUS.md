# REC-APP Setup Status

## Completed Setup

### Database Schema
- ✅ Created `supabase/migrations/0001_initial.sql`
- ✅ Applied migration successfully in Supabase
- ✅ Tables created:
  - `staff_profiles` - Core staff data and onboarding status
  - `staff_documents` - Document uploads (DBS, qualifications, etc)
  - `id_verifications` - ID verification records from Didit
- ✅ Row Level Security enabled with least privilege policies
- ✅ Indexes added for performance
- ✅ Auto-updating `updated_at` trigger on `staff_profiles`

### Didit ID Verification Integration
- ✅ API key configured in `.env.local`
- ✅ Core Didit client created at `app/lib/didit.ts`
- ✅ API endpoint created at `app/api/verify-id/route.ts`
- ✅ React component created at `app/components/IDVerification.tsx`
- ✅ Integration updated to work with new database schema
- ✅ Verification results stored in `id_verifications` table
- ✅ Approved verifications update staff profile name

### Environment Configuration
- ✅ Supabase URL and anon key configured
- ✅ Didit API key and webhook secret configured
- ✅ Dev server running on http://localhost:3000

### Documentation
- ✅ `supabase/README.md` - Migration application instructions
- ✅ `DIDIT-SETUP.md` - Complete Didit integration guide

## Next Steps

### 1. Test ID Verification
You can now test the ID verification flow:

```typescript
import IDVerification from '@/app/components/IDVerification';

// In your onboarding page
<IDVerification 
  staffId={userId} 
  onVerificationComplete={(data) => {
    console.log('Verification complete:', data);
  }}
/>
```

### 2. Create Staff Onboarding Page
Build the complete onboarding flow at `app/staff/onboarding/page.tsx` with:
- Step 1: Account creation (Supabase Auth)
- Step 2: Profile basics (name, phone, postcode, travel radius)
- Step 3: ID verification (using IDVerification component)
- Step 4: DBS and qualifications upload
- Step 5: Declarations and signature

### 3. Add Staff Registration
Create a registration endpoint that:
- Creates user in Supabase Auth
- Creates corresponding row in `staff_profiles`
- Sends verification email

### 4. Admin Dashboard
Build admin interface to:
- Review pending verifications
- Approve/reject staff profiles
- View ID verification results

## Database Access Patterns

### Staff Users
- Can select and update their own `staff_profiles` row
- Can insert their own profile on first login
- Can select and insert their own `staff_documents`
- Can select their own `id_verifications`

### Admin Users
- Can select all rows in all tables
- Identified by `raw_user_meta_data->>'role' = 'admin'`

### Grant Admin Access
```sql
update auth.users
set raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
where email = 'your-admin@email.com';
```

## API Endpoints

### POST /api/verify-id
Verify ID document using Didit.

**Request:**
- `front_image` (File) - Front of ID document
- `back_image` (File, optional) - Back of ID document
- `staff_id` (string) - UUID of staff profile
- `minimum_age` (string, optional) - Minimum age requirement (default: 18)

**Response:**
```json
{
  "success": true,
  "verification": {
    "status": "Approved",
    "fullName": "John Smith",
    "dateOfBirth": "1990-01-01",
    "documentNumber": "ABC123456",
    "documentType": "Passport",
    "nationality": "GBR",
    "warnings": []
  },
  "request_id": "uuid"
}
```

## Security Notes

- All API keys are server-side only
- RLS policies enforce data isolation
- ID verification runs server-side via API route
- Document images sent directly to Didit (not stored locally)
- Verification results stored in database for audit trail

## Development Server

Running at: http://localhost:3000

To restart:
```bash
# Stop: Ctrl+C in terminal
npm run dev
```

## Troubleshooting

### Database Errors
- Verify tables exist in Supabase Table Editor
- Check RLS policies are enabled
- Ensure user is authenticated

### ID Verification Errors
- Check Didit API key is valid
- Verify `.env.local` is loaded (restart dev server)
- Check network requests in browser DevTools
- Review Supabase logs for database errors

### Authentication Errors
- Ensure Supabase Auth is configured
- Check user exists in `auth.users`
- Verify JWT token is valid
