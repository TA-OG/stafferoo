# Emergency Childcare Staffing Platform - Technical Specification

**Last Updated:** 14 February 2026  
**Status:** FINALIZED - Ready for Development

---

## 1. Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Forms:** React Hook Form
- **State Management:** Tanstack Query (React Query)

### Backend
- **API:** Next.js API Routes
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **Real-time:** Supabase Realtime

### Third-Party Services
1. **Payments:** Stripe Connect (Express accounts)
2. **SMS:** Textlocal (£0.04/message, 27% cheaper than Twilio)
3. **Maps/Transit:** Google Maps API
   - Geocoding API
   - Distance Matrix API
4. **ID Verification:** Didit (500 free/month, then £0.30-0.50)
5. **Email:** SendGrid (free tier, 100/day)

### Hosting & Infrastructure
- **Hosting:** Vercel Pro (£16/month)
- **Database:** Supabase Pro (£20/month)
- **Domain:** Namecheap (~£10/year)
- **SSL:** Included with Vercel

---

## 2. Infrastructure Costs (Monthly)

### Core Platform
```
Supabase Pro:           £20
Vercel Pro:             £16
Stripe fees (~0.75%):   £16
Google Maps API:        £15
Textlocal SMS:          £2 (settings only)
Domain:                 £3
TOTAL:                  £72/month
```

### As Platform Scales
```
Month 1-3 (Pilot):      £72
Month 4-6 (£10K MRR):   £100 (increased usage)
Month 7+ (Scale):       £150-200 (higher API usage)
```

### Cost Optimization
- Textlocal 27% cheaper than Twilio (£0.04 vs £0.055)
- Carers pay for their SMS (platform doesn't absorb cost)
- Free tiers: SendGrid email, Didit first 500 verifications
- No public liability insurance needed (digital platform)

---

## 3. Database Schema (Core Tables)

### Users & Profiles
```sql
users (Supabase Auth)
├─ id (UUID, primary key)
├─ email (unique)
├─ role (enum: 'carer', 'setting', 'admin')
├─ created_at
└─ updated_at

carers
├─ id (UUID, FK to users)
├─ first_name, last_name
├─ phone_number
├─ qualification (enum: 'Level 2', 'Level 3')
├─ latitude, longitude
├─ dbs_certificate_number (unique, fraud detection)
├─ dbs_issue_date, dbs_expiry_date
├─ verified (boolean)
├─ status (enum: 'active', 'suspended', 'banned')
├─ strikes (integer, 0-5)
├─ avg_rating (decimal)
├─ total_shifts (integer)
└─ sms_opt_in (boolean)

childcare_settings
├─ id (UUID, FK to users)
├─ name
├─ ofsted_urn (unique, verified)
├─ ofsted_rating (enum)
├─ address, postcode
├─ latitude, longitude
├─ subscription_tier (enum: 'pilot', 'full')
├─ subscription_status (enum: 'active', 'cancelled')
└─ monthly_fee (decimal: 99 or 249)
```

### Jobs & Placements
```sql
job_requests
├─ id (UUID)
├─ setting_id (FK)
├─ date
├─ start_time, end_time
├─ role (enum: 'Nursery Nurse', 'Room Leader', etc.)
├─ hourly_rate (£22)
├─ total_cost (calculated)
├─ status (enum: 'open', 'filled', 'cancelled')
└─ created_at

placements
├─ id (UUID)
├─ job_request_id (FK)
├─ primary_carer_id (FK to carers)
├─ secondary_carer_id (FK to carers, nullable)
├─ assigned_carer_id (FK, who actually worked)
├─ status (enum: 'confirmed', 'completed', 'cancelled', 'no_show')
├─ check_in_time (timestamptz)
├─ check_out_time (timestamptz)
├─ actual_hours (decimal)
├─ emergency_bonus_paid (boolean)
└─ created_at
```

### Verification & References
```sql
carer_verifications
├─ id (UUID)
├─ carer_id (FK)
├─ didit_verified (boolean)
├─ dbs_verified (boolean)
├─ qualification_verified (boolean)
├─ first_aid_verified (boolean)
├─ references_verified (boolean)
├─ admin_approved (boolean)
└─ verified_at

carer_references
├─ id (UUID)
├─ carer_id (FK)
├─ token (unique, 64 chars)
├─ referee_email
├─ referee_name
├─ status (enum: 'pending', 'completed', 'expired')
├─ setting_name
├─ setting_ofsted_urn
├─ setting_ofsted_rating
├─ q1_childcare_skills (integer 1-5)
├─ q2_reliability (integer 1-5)
├─ q3_teamwork (integer 1-5)
├─ q5_would_rehire (boolean)
├─ q8_safeguarding_concerns (boolean)
└─ submitted_at
```

### Strikes & Suspensions
```sql
strikes
├─ id (UUID)
├─ carer_id (FK)
├─ reason (text)
├─ strike_number (1-5)
├─ visible_to_settings (boolean)
├─ expires_at (timestamptz, +90 days)
└─ created_at

suspensions
├─ id (UUID)
├─ carer_id (FK)
├─ suspension_number (1-4)
├─ duration_days (30 or 60)
├─ reason (text)
├─ starts_at
├─ ends_at
├─ status (enum: 'active', 'completed')
└─ probation_until (timestamptz)

banned_users (fraud prevention)
├─ id (UUID)
├─ original_carer_id (FK)
├─ dbs_certificate_number (unique)
├─ ban_reason (text)
├─ permanent_ban (boolean)
└─ banned_at
```

### Cancellations
```sql
cancellations
├─ id (UUID)
├─ placement_id (FK)
├─ cancelled_by (enum: 'setting', 'carer', 'admin')
├─ cancelled_at
├─ shift_start_time
├─ hours_notice (decimal, auto-calculated)
├─ cancellation_tier (enum: 'tier_1', 'tier_2', 'tier_3', 'tier_4')
├─ setting_fee_percentage (0, 25, 50, 100)
├─ setting_fee_amount (decimal)
├─ carer_compensation_amount (decimal)
├─ reason_category (if carer)
├─ reason_explanation (text)
├─ evidence_urls (text array)
├─ requires_review (boolean)
├─ review_decision (enum: 'approved', 'denied')
└─ strike_applied (boolean)
```

### Payments & Invoices
```sql
carer_invoices
├─ id (UUID)
├─ carer_id (FK)
├─ placement_id (FK)
├─ hours_worked (decimal)
├─ hourly_rate (£15.50)
├─ base_amount (decimal)
├─ emergency_bonus (decimal, 0 or 10)
├─ sms_charges (decimal)
├─ final_amount (decimal)
├─ status (enum: 'pending', 'paid')
├─ submitted_at
├─ due_date (submitted_at + 30 days)
└─ paid_at

setting_invoices
├─ id (UUID)
├─ setting_id (FK)
├─ billing_month (YYYY-MM)
├─ subscription_fee (decimal)
├─ hourly_fees (decimal, from previous month)
├─ total_amount (decimal)
├─ stripe_invoice_id
└─ paid_at
```

---

## 4. Key Features & Functions

### Feature 1: Available Carers Dashboard (Settings)
**Location:** Settings dashboard homepage

**Function:** Real-time display of available carers within 1.5 hours public transit

**Data Required:**
- Setting location (lat/lng)
- Target date/time
- Carer availability
- Carer locations (lat/lng)
- Transit times (Google Distance Matrix API)

**API Endpoint:** `POST /api/settings/available-carers`

**Returns:**
```typescript
{
  carers: [
    {
      id: string,
      firstName: string,
      lastName: string,
      qualification: 'Level 2' | 'Level 3',
      avgRating: number,
      totalShifts: number,
      travelTime: number, // minutes
      bestTransportMode: 'transit' | 'driving' | 'walking',
      latestReview?: string
    }
  ],
  summary: {
    totalAvailable: number,
    under45mins: number,
    highlyRated: number
  }
}
```

---

### Feature 2: Dual Carer Selection (Primary + Secondary)
**Location:** Job booking flow

**Function:** Settings select primary carer AND backup carer when posting job

**Flow:**
1. Setting posts job
2. Available carers notified
3. Carers respond "Available" or "Not Available"
4. Setting reviews responses
5. Setting selects PRIMARY carer
6. Setting selects SECONDARY carer (backup)
7. Primary confirmed, secondary on standby
8. Secondary receives: "You're backup for [Setting] on [Date]. Available if needed?"
9. Secondary confirms standby status

**Database:**
```sql
placements table:
- primary_carer_id
- secondary_carer_id
- assigned_carer_id (who actually worked)
- emergency_bonus_paid (boolean)
```

---

### Feature 3: Automated Reference Collection
**Location:** Carer onboarding flow

**Function:** Carer sends secure link to 2+ referees, who complete standardized form

**Flow:**
1. Carer enters referee email
2. System generates unique token (64 chars, expires in 14 days)
3. Email sent with link: `[domain]/reference/[token]`
4. Referee completes form (5-10 minutes):
   - Setting details (name, Ofsted URN, rating)
   - Work period, role, reason for leaving
   - Ratings (1-5): Skills, reliability, teamwork
   - Would rehire? (boolean)
   - Safeguarding concerns? (boolean + details if yes)
5. Submission logged with IP address, timestamp
6. Admin notified for review
7. Carer notified when completed

**Security:**
- Unique token per reference
- Token expires after 14 days
- One-time submission (cannot edit after submit)
- IP address logged for fraud prevention
- Consent checkbox required

---

### Feature 4: No-Show Protocol with Secondary Mobilization
**Location:** Check-in system

**Timeline:**
```
9:00 AM - Shift start, check-in notifications sent
9:05 AM - Reminders sent if no response
9:15 AM - If no response from primary:
  ├─ Secondary receives STANDBY notification
  ├─ Setting receives decision prompt
  └─ Setting chooses: Wait or Mobilize backup

If Setting mobilizes backup:
  ├─ Secondary gets shift + £10 bonus
  ├─ Primary loses shift (if arrives late)
  ├─ Primary gets £5 travel compensation
  └─ Primary receives strike
```

**Notifications:**
- Primary: "Have you arrived and started work?"
- Setting: "Has [Carer] arrived and started?"
- Secondary (standby): "Primary hasn't arrived. On standby. Setting will confirm if needed."
- Secondary (mobilized): "Emergency cover needed! +£10 bonus. Expected arrival time?"

---

### Feature 5: Tiered Cancellation Fees
**Location:** Cancellation flow

**Calculation (Auto):**
```typescript
function calculateCancellationFee(
  shiftStartTime: Date,
  cancelledAt: Date,
  shiftCost: number
): {
  tier: 1 | 2 | 3 | 4,
  feePercentage: 0 | 25 | 50 | 100,
  feeAmount: number,
  carerCompensation: number
} {
  const hoursNotice = (shiftStartTime - cancelledAt) / (1000 * 60 * 60);
  
  if (hoursNotice < 2) {
    return { tier: 1, feePercentage: 100, 
             feeAmount: shiftCost, 
             carerCompensation: shiftCost * 0.7 }; // £124 from £176
  } else if (hoursNotice < 12) {
    return { tier: 2, feePercentage: 50, 
             feeAmount: shiftCost * 0.5, 
             carerCompensation: shiftCost * 0.35 };
  } else if (hoursNotice < 24) {
    return { tier: 3, feePercentage: 25, 
             feeAmount: shiftCost * 0.25, 
             carerCompensation: shiftCost * 0.175 };
  } else {
    return { tier: 4, feePercentage: 0, 
             feeAmount: 0, 
             carerCompensation: 0 };
  }
}
```

---

### Feature 6: Strike & Suspension System
**Location:** Admin dashboard + Carer profile

**Progression:**
- Strike 1: Warning (hidden from settings)
- Strike 2: Visible to settings
- Strike 3: 30-day suspension
- Strike 4 (within 30 days post-suspension): 60-day suspension
- Strike 5+: Permanent ban + DBS flagged

**Visibility:**
```typescript
// What settings see for Strike 2 carer
<Badge variant="warning">
  ⚠️ Reliability Notice
</Badge>
<p className="text-xs text-gray-600">
  Late cancellation (12 days ago)
</p>

// Strike 1 - completely hidden
// Strike 3+ - hidden (suspended/banned)
```

**Fraud Detection:**
```sql
-- Automatic check on new carer registration
SELECT * FROM banned_users 
WHERE dbs_certificate_number = NEW.dbs_certificate_number;

-- If match found:
-- 1. Block account creation
-- 2. Alert admin
-- 3. Log fraud attempt
```

---

## 5. Web-Based GPS Location Checking (MVP)

### Overview
**Purpose:** Verify carer is physically at nursery when checking in for shift  
**Technology:** Browser Geolocation API (no native app required)  
**Accuracy:** 10-50 meters (GPS), up to 100m indoors  
**User Experience:** Permission prompt → location check → verify distance

### Implementation

**Frontend (Check-In Component):**
```typescript
// components/carer/ShiftCheckIn.tsx

async function handleCheckIn(placementId: string, nurseryLocation: Location) {
  // Request location permission
  if (!navigator.geolocation) {
    return handleFallback('Location not supported');
  }
  
  setLoading(true);
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const carerLat = position.coords.latitude;
      const carerLng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      
      // Calculate distance from nursery
      const distance = calculateDistance(
        carerLat, 
        carerLng, 
        nurseryLocation.lat, 
        nurseryLocation.lng
      );
      
      // Verify within 100 meters
      if (distance <= 100) {
        // ✓ Location verified
        await submitCheckIn({
          placementId,
          latitude: carerLat,
          longitude: carerLng,
          accuracy,
          distance,
          verified: true,
          locationPermissionGranted: true
        });
        
        showSuccess('Check-in successful!');
      } else {
        // ✗ Too far away
        showError(`You're ${Math.round(distance)}m away from the nursery. Please arrive before checking in.`);
        
        // Log attempt for admin review
        await logCheckInAttempt({
          placementId,
          latitude: carerLat,
          longitude: carerLng,
          distance,
          verified: false,
          reason: 'too_far'
        });
      }
      
      setLoading(false);
    },
    (error) => {
      // Permission denied or location unavailable
      setLoading(false);
      handleLocationError(error);
    },
    {
      enableHighAccuracy: true, // Use GPS, not just IP
      timeout: 10000, // 10 seconds max
      maximumAge: 0 // Don't use cached location
    }
  );
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
}
```

**Fallback Flow (Permission Denied):**
```typescript
function handleLocationError(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    // User denied permission
    showWarning({
      title: 'Location Permission Denied',
      message: 'We need your location to verify check-in. You can still check in manually, but this will require setting confirmation.',
      actions: [
        {
          label: 'Enable Location',
          onClick: () => window.open('settings://location') // Browser settings
        },
        {
          label: 'Manual Check-In',
          onClick: () => manualCheckIn() // Fallback
        }
      ]
    });
  } else if (error.code === error.POSITION_UNAVAILABLE) {
    // Location unavailable (no GPS signal)
    showError('Location unavailable. Please ensure GPS is enabled and try again.');
  } else {
    // Timeout
    showError('Location request timed out. Please try again.');
  }
}

// Manual check-in (fallback)
async function manualCheckIn() {
  const confirmed = await showConfirmDialog({
    title: 'Manual Check-In',
    message: 'Location verification failed. Your check-in will be flagged for admin review. The setting must also confirm your arrival.',
    confirmText: 'Proceed Anyway'
  });
  
  if (confirmed) {
    await submitCheckIn({
      placementId,
      latitude: null,
      longitude: null,
      accuracy: null,
      distance: null,
      verified: false,
      locationPermissionGranted: false,
      requiresAdminReview: true
    });
    
    // Notify setting for double confirmation
    await notifySetting({
      type: 'manual_check_in',
      message: 'Carer checked in manually (location unavailable). Please confirm arrival.'
    });
  }
}
```

**Backend API:**
```typescript
// app/api/check-in/route.ts

export async function POST(req: Request) {
  const { 
    placementId, 
    latitude, 
    longitude, 
    accuracy, 
    distance, 
    verified 
  } = await req.json();
  
  const supabase = createClient();
  
  // Get placement details
  const { data: placement } = await supabase
    .from('placements')
    .select('*, job_request:job_requests(*), setting:childcare_settings(*)')
    .eq('id', placementId)
    .single();
    
  // Log check-in
  const { data: checkIn } = await supabase
    .from('shift_check_ins')
    .insert({
      placement_id: placementId,
      carer_id: placement.primary_carer_id,
      check_in_type: 'start',
      latitude,
      longitude,
      accuracy,
      distance_from_setting: distance,
      verified,
      location_permission_granted: latitude !== null,
      ip_address: req.headers.get('x-forwarded-for'),
      user_agent: req.headers.get('user-agent'),
      device_info: {
        platform: req.headers.get('sec-ch-ua-platform'),
        mobile: req.headers.get('sec-ch-ua-mobile')
      }
    })
    .select()
    .single();
    
  // Update placement status
  await supabase
    .from('placements')
    .update({
      status: 'in_progress',
      check_in_time: new Date().toISOString(),
      check_in_verified: verified
    })
    .eq('id', placementId);
    
  // Notify setting
  if (verified) {
    await sendNotification({
      userId: placement.setting.user_id,
      type: 'carer_arrived',
      title: 'Carer Arrived',
      message: `${placement.carer.first_name} has checked in (verified ✓)`,
      data: { placementId, distance }
    });
  } else {
    // Flag for admin review
    await supabase.from('admin_review_queue').insert({
      type: 'unverified_check_in',
      placement_id: placementId,
      severity: 'medium',
      details: {
        reason: latitude ? 'too_far' : 'permission_denied',
        distance
      }
    });
  }
  
  return Response.json({ success: true, checkIn });
}
```

### Database Schema

```sql
CREATE TABLE shift_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placement_id UUID REFERENCES placements(id) NOT NULL,
  carer_id UUID REFERENCES carers(id) NOT NULL,
  
  -- Check-in/out
  check_in_type VARCHAR(20) CHECK (check_in_type IN ('start', 'end')) NOT NULL,
  
  -- Location data
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy DECIMAL(6, 2), -- meters
  distance_from_setting DECIMAL(6, 2), -- meters
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  location_permission_granted BOOLEAN DEFAULT FALSE,
  
  -- Fraud detection
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  
  -- Admin review
  requires_admin_review BOOLEAN DEFAULT FALSE,
  admin_reviewed BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_location CHECK (
    (latitude IS NULL AND longitude IS NULL) OR 
    (latitude IS NOT NULL AND longitude IS NOT NULL)
  )
);

CREATE INDEX idx_check_ins_placement ON shift_check_ins(placement_id);
CREATE INDEX idx_check_ins_carer ON shift_check_ins(carer_id);
CREATE INDEX idx_check_ins_review ON shift_check_ins(requires_admin_review) 
  WHERE requires_admin_review = TRUE;
```

### User Experience Flow

**Carer Side:**
```
1. Notification: "Your shift starts in 5 mins"
2. Carer arrives at nursery
3. Opens app → Dashboard → "Check In" button
4. Browser prompt: "Allow location?"
5. Carer clicks "Allow"
6. App checking location... (2-5 seconds)
7. Success: "✓ Checked in at 9:02 AM (32m from nursery)"
8. Setting notified automatically
```

**Setting Side:**
```
1. Dashboard shows: "Sarah Johnson - Expected 9:00 AM"
2. Notification arrives: "Sarah has checked in ✓"
3. Dashboard updates: "Sarah Johnson - Arrived 9:02 AM (verified)"
4. Green checkmark shown
5. Can view details: "Location verified - 32m from your location"
```

**Admin Review (if flagged):**
```
Review Queue:
┌─────────────────────────────────────────┐
│ ⚠️ Unverified Check-In                  │
├─────────────────────────────────────────┤
│ Carer: John Smith                       │
│ Setting: Happy Days Nursery             │
│ Time: 9:15 AM (15 mins late)           │
│ Issue: Location permission denied       │
│ Setting confirmed: ✓ Yes                │
│                                         │
│ Action: No issue (technical problem)   │
│ [✓ Approve] [✗ Flag Carer]            │
└─────────────────────────────────────────┘
```

### Security & Privacy

**Privacy Controls:**
- Location only requested at check-in (not continuous)
- Only shift start/end, not during shift
- Coordinates stored encrypted
- Only admin can view exact coordinates
- Settings see: "Verified ✓" or distance only
- Deleted after 90 days (GDPR)

**Anti-Spoofing Measures:**
- IP address logged (detect VPN spoofing)
- User agent logged (detect emulators)
- Device info logged (detect changes)
- Timestamp verification (prevent replay attacks)
- Admin review for patterns (same carer always "permission denied")

**Accuracy Handling:**
```typescript
// Accept if accuracy is reasonable
if (accuracy > 100) {
  showWarning('GPS signal is weak. Please move outdoors for better accuracy.');
  // Still allow check-in but flag for review
}

// Reject if accuracy is absurd (obvious spoofing)
if (accuracy > 1000) {
  showError('Location accuracy too poor. Please try again.');
  return;
}
```

### Phase 2 Upgrade Path (Native App)

**What Native App Adds:**
1. **Background tracking:** Continuous location during shift
2. **Geofencing:** Auto check-in when entering 50m radius
3. **Better accuracy:** 5-10m with WiFi + Bluetooth
4. **Offline mode:** Works without internet
5. **Advanced anti-spoofing:** Device attestation, SafetyNet

**Migration:**
- Same database schema works for both
- Add `tracking_type` field: 'web' or 'native'
- Web check-ins remain valid alongside native
- Gradual rollout (web → native over time)

### Limitations (MVP Acceptance)

**Known Issues:**
- ✗ Can't prove carer stayed entire shift
- ✗ 10-50m accuracy (might show "outside" when at door)
- ✗ Indoor accuracy varies (metal buildings problematic)
- ✗ Permission friction (asked every time on some browsers)
- ✗ Desktop browser can spoof more easily

**Mitigations:**
- Setting physically present (confirms arrival)
- Strike system (bad actors removed quickly)
- Admin review queue (flags suspicious patterns)
- Fraud rate likely <2% (verified, trusted carers)

### Success Metrics

**Track:**
- Location permission grant rate (target: >80%)
- Verification success rate (target: >90%)
- Average distance from nursery (expect: 20-40m)
- Flagged check-ins requiring review (expect: <5%)
- Settings confirming manual check-ins (if permission denied)

**Review After 3 Months:**
- If fraud rate >5%: Consider native app
- If permission denial >30%: Improve UX/messaging
- If accuracy issues >20%: Adjust verification radius

---

## 6. API Integrations

### Textlocal SMS API
```typescript
import axios from 'axios';

async function sendSMS(to: string, message: string) {
  const response = await axios.post('https://api.txtlocal.com/send/', {
    apikey: process.env.TEXTLOCAL_API_KEY,
    numbers: to, // 447123456789
    message: message,
    sender: 'YourApp' // Max 11 chars
  });
  
  return response.data;
}

// Cost tracking
await supabase.from('sms_log').insert({
  phone_number: to,
  message,
  cost: 0.04, // £0.04 per SMS
  provider: 'textlocal'
});
```

### Google Maps Distance Matrix API
```typescript
async function calculateTransitTime(
  origin: { lat: number, lng: number },
  destination: { lat: number, lng: number }
) {
  const response = await axios.get(
    'https://maps.googleapis.com/maps/api/distancematrix/json',
    {
      params: {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        mode: 'transit', // public transport
        departure_time: 'now',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    }
  );
  
  const element = response.data.rows[0].elements[0];
  
  return {
    duration: element.duration.value / 60, // minutes
    distance: element.distance.value / 1000, // km
    status: element.status
  };
}

// Filter carers within 1.5 hours
const accessibleCarers = carers.filter(carer => 
  carer.transitTime <= 90
);
```

### Didit ID Verification
```typescript
// Create verification session
async function createDiditVerification(carerId: string) {
  const response = await axios.post(
    'https://api.didit.me/v1/verifications',
    {
      callback_url: `${process.env.APP_URL}/api/webhooks/didit`,
      metadata: { carer_id: carerId }
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.DIDIT_API_KEY}`
      }
    }
  );
  
  return {
    sessionId: response.data.id,
    verificationUrl: response.data.verification_url
  };
}

// Webhook handler
export async function POST(req: Request) {
  const { session_id, status, extracted_data } = await req.json();
  
  if (status === 'verified') {
    await supabase.from('carers').update({
      didit_verified: true,
      didit_session_id: session_id,
      id_document_type: extracted_data.document_type,
      id_document_number: extracted_data.document_number
    }).eq('id', metadata.carer_id);
  }
}
```

### Stripe Connect (Carer Payouts)
```typescript
// Create Express account for carer
async function createStripeAccount(carerId: string, email: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'GB',
    email: email,
    capabilities: {
      transfers: { requested: true }
    },
    metadata: { carer_id: carerId }
  });
  
  return account.id;
}

// Process payout (Net-30)
async function processCarerPayout(invoiceId: string) {
  const invoice = await getInvoice(invoiceId);
  
  const transfer = await stripe.transfers.create({
    amount: invoice.final_amount * 100, // pence
    currency: 'gbp',
    destination: invoice.carer_stripe_account_id,
    description: `Payment for shift on ${invoice.shift_date}`
  });
  
  await supabase.from('carer_invoices').update({
    status: 'paid',
    paid_at: new Date().toISOString(),
    stripe_transfer_id: transfer.id
  }).eq('id', invoiceId);
}
```

---

## 6. Security & Compliance

### Data Protection
- Row-level security (RLS) on all Supabase tables
- Encryption at rest (Supabase default)
- Encryption in transit (HTTPS/TLS everywhere)
- JWT tokens (24-hour expiry)
- Rate limiting: 100 requests/min per IP

### GDPR Compliance
- Data retention: 2 years (verification docs), 7 years (transactions)
- Right to erasure: Automated deletion workflow
- Data portability: Export functionality
- Privacy policy: Required before signup
- Cookie consent: Banner on first visit

### File Security
- DBS certificates: Encrypted in Supabase Storage
- Max file size: 10MB
- Allowed types: PDF, JPG, PNG only
- Virus scanning: ClamAV integration
- Access control: Only admin + carer can view own DBS

### Authentication
- Supabase Auth (email + password)
- MFA optional (TOTP)
- Password requirements: 8+ chars, complexity rules
- Session timeout: 24 hours
- Remember me: 30 days (secure cookie)

---

## 7. Monitoring & Logging

### Error Tracking
- Sentry (free tier for MVP)
- Track: API errors, database errors, payment failures
- Alerts: Slack webhook for critical errors

### Analytics
- Vercel Analytics (included)
- Track: Page views, conversion funnels, performance
- Custom events: Job posts, bookings, cancellations

### Logging
```typescript
// Database audit log
audit_log table:
├─ table_name
├─ action (insert, update, delete)
├─ user_id
├─ ip_address
├─ changes (JSONB)
└─ created_at

// Application logs
import winston from 'winston';

logger.info('Carer verified', {
  carerId,
  verificationType: 'DBS',
  timestamp: new Date()
});
```

---

**END OF TECHNICAL SPECIFICATION**
