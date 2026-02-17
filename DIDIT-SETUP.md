# Didit ID Verification Setup Guide

## What is Didit?

Didit is an ID verification service that automatically extracts and validates information from identity documents (passports, driver's licenses, national ID cards). It checks document authenticity, expiration dates, and extracts personal information.

## Setup Steps

### 1. Get Your API Credentials

1. Go to [https://business.didit.me](https://business.didit.me)
2. Create an account or log in
3. Navigate to the **API** section
4. Copy your **API Key**
5. Copy your **Webhook Secret** (for future webhook integration)

### 2. Add API Key to Environment Variables

Open your `.env.local` file and replace the placeholder values:

```env
DIDIT_API_KEY=your_actual_api_key_here
DIDIT_WEBHOOK_SECRET=your_actual_webhook_secret_here
```

**IMPORTANT:** After updating `.env.local`, you MUST restart your dev server:
- Stop the server (Ctrl+C in the terminal running `npm run dev`)
- Start it again: `npm run dev`

### 3. Files Created

The following files have been created for Didit integration:

#### `app/lib/didit.ts`
- Core Didit API client
- Handles document verification requests
- Extracts and formats verification data
- TypeScript types for type safety

#### `app/api/verify-id/route.ts`
- Next.js API route: `POST /api/verify-id`
- Accepts document images from frontend
- Calls Didit API
- Stores results in Supabase database
- Returns verification status

#### `app/components/IDVerification.tsx`
- React component for ID upload UI
- File upload with image preview
- Real-time verification status
- Displays extracted information
- Error handling and loading states

### 4. How to Use in Your Onboarding Flow

Add the ID verification component to your staff onboarding page:

```tsx
import IDVerification from '@/app/components/IDVerification';

// Inside your onboarding form (Step 3 - Document Upload)
<IDVerification 
  staffId={currentStaffId} 
  onVerificationComplete={(data) => {
    console.log('Verification complete:', data);
    // Move to next step or update form state
  }}
/>
```

### 5. Database Fields Required

Make sure your `staff_profiles` table has these columns:

```sql
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS id_verification_status TEXT;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS id_verification_data JSONB;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMPTZ;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS full_name_verified TEXT;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS date_of_birth_verified DATE;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS document_expiration DATE;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS portrait_image TEXT;
```

### 6. Testing

#### Test with Sample Documents
1. Navigate to `/staff/onboarding` (or wherever you integrate the component)
2. Upload a clear photo of an ID document
3. Click "Verify ID Document"
4. Check the verification result

#### What Didit Checks
- ✅ Document authenticity (not fake/tampered)
- ✅ Document expiration date
- ✅ MRZ (Machine Readable Zone) validation
- ✅ Data consistency between visual and MRZ zones
- ✅ Document liveness (not a photo of a photo)
- ✅ Age verification (minimum 18)
- ✅ Extracts: name, DOB, address, nationality, document number

#### Verification Statuses
- **Approved**: Document is valid and all checks passed
- **Declined**: Document failed one or more checks
- **Pending**: Manual review required
- **Manual Review**: Flagged for admin review

### 7. Pricing (as of 2026)

Check current pricing at [https://didit.me/pricing](https://didit.me/pricing)

Typical pricing structure:
- Per verification: ~£0.50 - £2.00 per check
- Volume discounts available
- Free test credits for development

### 8. Production Checklist

Before going live:

- [ ] Get production API key from Didit
- [ ] Update `.env.local` with production key
- [ ] Set up webhook endpoint for real-time updates (optional)
- [ ] Test with real documents
- [ ] Configure minimum age requirement (currently 18)
- [ ] Enable document liveness detection (currently enabled)
- [ ] Set up admin review workflow for declined/pending verifications
- [ ] Add audit logging for compliance
- [ ] Configure GDPR-compliant data retention policy

### 9. Security Notes

- ✅ API key is server-side only (not exposed to browser)
- ✅ All requests go through your Next.js API route
- ✅ Document images are sent directly to Didit (not stored on your server unless you choose to)
- ✅ Verification results are stored in your Supabase database
- ⚠️ Never commit `.env.local` to git
- ⚠️ Use environment variables for all API keys

### 10. Support

- **Didit Documentation**: [https://docs.didit.me](https://docs.didit.me)
- **API Reference**: [https://docs.didit.me/reference/id-verification-standalone-api](https://docs.didit.me/reference/id-verification-standalone-api)
- **Business Console**: [https://business.didit.me](https://business.didit.me)

## Next Steps

1. Sign up for Didit account
2. Get your API key
3. Update `.env.local`
4. Restart dev server
5. Test the ID verification component
6. Integrate into your onboarding flow

---

**Need Help?** Check the Didit documentation or contact their support team.
