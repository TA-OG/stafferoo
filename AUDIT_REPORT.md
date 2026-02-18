# REC-APP Audit Report
**Date:** 2026-02-17  
**Auditor:** System Analysis  
**Scope:** Full repository audit against project specifications

---

## Executive Summary

The repository has foundational infrastructure in place (database, ID verification) but is missing **95% of core business logic**. Only 3 of 60+ required features are implemented. Critical gaps include settings registration, booking marketplace, payment flows, admin workflows, and compliance features.

**Immediate Priority:** Settings registration with Ofsted URN capture and admin verification workflow.

---

## 1. Repository Inspection Results

### 1.1 Routes Discovered
```
app/
├── page.tsx                          # Landing page (implemented)
├── staff/
│   └── onboarding/page.tsx          # Staff onboarding demo (partial)
├── settings/
│   └── register/page.tsx            # Placeholder only
└── api/
    └── verify-id/route.ts           # Didit ID verification (implemented)
```

**Missing Routes:**
- `/staff/dashboard` - Staff view available jobs
- `/staff/profile` - Staff profile management
- `/settings/dashboard` - Settings post jobs, view bookings
- `/settings/profile` - Settings profile management
- `/admin` - Admin verification and approval workflows
- `/admin/staff` - Staff verification queue
- `/admin/settings` - Settings verification queue
- `/bookings/*` - Booking management flows
- `/api/bookings/*` - Booking CRUD operations
- `/api/payments/*` - Payment processing
- `/api/references/*` - Reference request flows
- `/api/webhooks/didit` - Didit webhook handler
- `/api/webhooks/stripe` - Stripe webhook handler

### 1.2 Database Schema Analysis

**Tables Implemented (3):**
```sql
staff_profiles          # Basic staff data, missing 20+ required fields
staff_documents         # Document tracking only
id_verifications        # Didit integration records
```

**Missing Tables (12+):**
```sql
setting_profiles        # Settings/customers - CRITICAL MISSING
bookings                # Job postings and assignments - CORE FEATURE
reviews                 # Rating system - CORE FEATURE
notifications           # Email/SMS alerts - CORE FEATURE
block_lists             # Mutual blocking - SPEC REQUIREMENT
invoices                # Settings billing - PAYMENT REQUIREMENT
staff_payments          # Staff payouts - PAYMENT REQUIREMENT
staff_references        # Reference system - COMPLIANCE REQUIREMENT
audit_logs              # Compliance trail - GDPR REQUIREMENT
chat_messages           # In-booking chat - SPEC REQUIREMENT
recurring_bookings      # Repeat bookings - BUSINESS FEATURE
safeguarding_documents  # Setting-uploaded docs - COMPLIANCE
staff_document_acks     # Document read tracking - COMPLIANCE
```

**Missing Columns in staff_profiles:**
- `address_line_1`, `address_line_2`, `city` (required for travel calculation)
- `latitude`, `longitude` (required for distance matching)
- `dbs_certificate_number`, `dbs_issue_date`, `dbs_surname_on_certificate` (compliance)
- `safeguarding_certificate_url`, `safeguarding_expiry_date` (compliance)
- `paediatric_first_aid_url`, `paediatric_first_aid_expiry_date` (compliance)
- `right_to_work_document_url` (compliance)
- `emergency_contact_1_*`, `emergency_contact_2_*` (safety requirement)
- `gp_name`, `gp_address` (health declaration requirement)
- `health_declaration` (JSONB - 14 conditions per spec)
- `digital_signature`, `digital_signature_date` (legal requirement)
- `available_now`, `availability_schedule` (marketplace requirement)
- `average_rating`, `total_reviews`, `total_bookings` (rating system)
- `strike_count`, `suspension_start_date`, `suspension_end_date` (discipline system)

### 1.3 RLS Policies Analysis

**Implemented:**
- Staff can manage own profile ✓
- Admins can view all staff ✓
- Basic document access control ✓

**Missing:**
- No policies for settings (table doesn't exist)
- No policies for bookings (table doesn't exist)
- No admin update/approve policies
- No policies for payments, invoices, reviews

### 1.4 Code Search Results

| Search Term | Found | Implementation Status |
|-------------|-------|----------------------|
| Ofsted/URN | Mentioned in placeholder only | **NOT IMPLEMENTED** |
| DBS | Column exists, no upload flow | **PARTIAL** |
| DBS Update Service | Boolean field only, no hard stop | **PARTIAL** |
| Reference/Referee | Not found | **NOT IMPLEMENTED** |
| Didit | Fully implemented | **✓ COMPLETE** |
| Webhook | Not found | **NOT IMPLEMENTED** |
| Payment/Invoice | Not found | **NOT IMPLEMENTED** |
| Stripe | Not found | **NOT IMPLEMENTED** |
| Booking | Not found | **NOT IMPLEMENTED** |

---

## 2. Feature Implementation Matrix

### 2.1 Settings (Childcare Providers) Features

| Feature | Spec Reference | Status | Files | Notes |
|---------|---------------|--------|-------|-------|
| **Settings Registration** | Technical Spec: Settings Profiles | ❌ NOT IMPLEMENTED | Placeholder only | **CRITICAL GAP** |
| Ofsted URN capture | Operational Policies: Verification | ❌ NOT IMPLEMENTED | N/A | Required for compliance |
| Ofsted rating capture | Technical Spec: Settings table | ❌ NOT IMPLEMENTED | N/A | Required for staff visibility |
| Settings address with geocoding | Technical Spec: Distance calc | ❌ NOT IMPLEMENTED | N/A | Required for travel time |
| Number of children | Technical Spec: Settings details | ❌ NOT IMPLEMENTED | N/A | Context for staff |
| Team size | Technical Spec: Settings details | ❌ NOT IMPLEMENTED | N/A | Context for staff |
| Parking availability | Technical Spec: Settings details | ❌ NOT IMPLEMENTED | N/A | Staff decision factor |
| Operation hours | Technical Spec: Settings details | ❌ NOT IMPLEMENTED | N/A | Booking constraints |
| Subscription tier selection | Payments Spec: £99 pilot / £249 standard | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Stripe payment method | Payments Spec: Card on file | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Bursary fund (prepay) | Payments Spec: Optional prepay | ❌ NOT IMPLEMENTED | N/A | Cash flow feature |
| Settings verification status | Operational Policies: Admin approval | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| **Post Job/Booking** | Technical Spec: Booking flow | ❌ NOT IMPLEMENTED | N/A | **CORE FEATURE MISSING** |
| Role to cover | Operational Policies: Job details | ❌ NOT IMPLEMENTED | N/A | Required field |
| Responsibilities checklist | Operational Policies: Standard tasks | ❌ NOT IMPLEMENTED | N/A | Required field |
| Additional tasks text | Operational Policies: Custom tasks | ❌ NOT IMPLEMENTED | N/A | Optional field |
| Date and time selection | Technical Spec: Booking | ❌ NOT IMPLEMENTED | N/A | Core booking |
| View available staff | Technical Spec: Marketplace | ❌ NOT IMPLEMENTED | N/A | **CORE FEATURE MISSING** |
| Staff distance/travel time | Technical Spec: Google Maps API | ❌ NOT IMPLEMENTED | N/A | Decision factor |
| Staff ratings and reviews | Technical Spec: Rating system | ❌ NOT IMPLEMENTED | N/A | Decision factor |
| Select primary staff | Operational Policies: Booking flow | ❌ NOT IMPLEMENTED | N/A | Core booking |
| Select secondary staff | Operational Policies: Backup system | ❌ NOT IMPLEMENTED | N/A | No-show mitigation |
| Check-in confirmation | Operational Policies: GPS check | ❌ NOT IMPLEMENTED | N/A | Compliance |
| Check-out confirmation | Operational Policies: Shift end | ❌ NOT IMPLEMENTED | N/A | Payment trigger |
| Early termination | Operational Policies: Complaint flow | ❌ NOT IMPLEMENTED | N/A | Edge case |
| Cancel booking | Operational Policies: Cancellation fees | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Rate staff | Technical Spec: Reviews | ❌ NOT IMPLEMENTED | N/A | Quality control |
| Block staff | Operational Policies: Block lists | ❌ NOT IMPLEMENTED | N/A | Safety feature |
| Chat with staff | Technical Spec: Chat during booking | ❌ NOT IMPLEMENTED | N/A | Communication |
| View invoices | Payments Spec: Weekly invoicing | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Pay invoices | Payments Spec: 72hr payment window | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Upload safeguarding docs | Operational Policies: Mandatory reading | ❌ NOT IMPLEMENTED | N/A | Compliance |

**Settings Features: 0/28 implemented (0%)**

### 2.2 Staff (Carers) Features

| Feature | Spec Reference | Status | Files | Notes |
|---------|---------------|--------|-------|-------|
| **Account Creation** | Staff Onboarding: Step 1 | ⚠️ DEMO ONLY | `app/staff/onboarding/page.tsx` | No real auth |
| Email verification | Staff Onboarding: Step 1 | ❌ NOT IMPLEMENTED | N/A | Security requirement |
| **Profile Basics** | Staff Onboarding: Step 2 | ❌ NOT IMPLEMENTED | N/A | Partial schema only |
| National Insurance Number | Staff Onboarding: Step 2 | ❌ NOT IMPLEMENTED | N/A | Required field |
| Date of Birth | Staff Onboarding: Step 2 | ❌ NOT IMPLEMENTED | N/A | Age verification |
| Phone Number | Staff Onboarding: Step 2 | ⚠️ COLUMN ONLY | `staff_profiles.phone` | No UI |
| Full Address | Staff Onboarding: Step 2 | ❌ NOT IMPLEMENTED | N/A | Required for distance |
| Travel Radius | Staff Onboarding: Step 2 | ⚠️ COLUMN ONLY | `staff_profiles.travel_radius_miles` | No UI |
| Mode of Transport | Staff Onboarding: Step 2 | ⚠️ COLUMN ONLY | `staff_profiles.transport_mode` | No UI |
| Years of Experience | Staff Onboarding: Step 2 | ⚠️ COLUMN ONLY | `staff_profiles.years_experience` | No UI |
| Qualification Level | Staff Onboarding: Step 2 | ⚠️ COLUMN ONLY | `staff_profiles.qualification_level` | No UI |
| **DBS Update Service** | Staff Onboarding: Hard stop | ⚠️ COLUMN ONLY | `staff_profiles.dbs_update_service` | **NO HARD STOP IMPLEMENTED** |
| DBS Update Service URL | Staff Onboarding: Link to signup | ❌ NOT IMPLEMENTED | N/A | Should open in new tab |
| Criminal Conviction Declaration | Staff Onboarding: Step 2 | ⚠️ COLUMN ONLY | `staff_profiles.criminal_conviction_declared` | No UI |
| Health Adjustments | Staff Onboarding: Step 2 | ⚠️ COLUMN ONLY | `staff_profiles.health_adjustments` | No UI |
| **ID Verification (Didit)** | Staff Onboarding: Step 3 | ✅ IMPLEMENTED | `app/components/IDVerification.tsx` | **WORKING** |
| Right to Work Document | Staff Onboarding: Step 3 | ❌ NOT IMPLEMENTED | N/A | Compliance |
| DBS Certificate Upload | Staff Onboarding: Step 3 | ❌ NOT IMPLEMENTED | N/A | **CRITICAL** |
| DBS Certificate Number | Staff Onboarding: Step 3 | ❌ NOT IMPLEMENTED | N/A | Required field |
| DBS Surname | Staff Onboarding: Step 3 | ❌ NOT IMPLEMENTED | N/A | Verification field |
| DBS Issue Date | Staff Onboarding: Step 3 | ❌ NOT IMPLEMENTED | N/A | 12-month check |
| Safeguarding Certificate | Staff Onboarding: Step 3 | ❌ NOT IMPLEMENTED | N/A | Compliance |
| Paediatric First Aid | Staff Onboarding: Step 3 | ❌ NOT IMPLEMENTED | N/A | Compliance |
| Disqualified Person Declaration | Staff Onboarding: Step 3 | ❌ NOT IMPLEMENTED | N/A | Legal requirement |
| Emergency Contact 1 | Staff Onboarding: Step 3 | ❌ NOT IMPLEMENTED | N/A | Safety |
| Emergency Contact 2 | Staff Onboarding: Step 3 | ❌ NOT IMPLEMENTED | N/A | Safety |
| GP Details | Staff Onboarding: Step 3 | ❌ NOT IMPLEMENTED | N/A | Health declaration |
| Health Declaration (14 conditions) | Staff Onboarding: Step 3 | ❌ NOT IMPLEMENTED | N/A | Compliance |
| Smoking/Drugs/Alcohol | Staff Onboarding: Step 3 | ❌ NOT IMPLEMENTED | N/A | Disclosure |
| Digital Signature | Staff Onboarding: Step 3 | ❌ NOT IMPLEMENTED | N/A | Legal requirement |
| **References** | Staff Onboarding: Step 4 | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| Personal Reference | Staff Onboarding: Step 4 | ❌ NOT IMPLEMENTED | N/A | Required |
| Professional Reference 1 | Staff Onboarding: Step 4 | ❌ NOT IMPLEMENTED | N/A | Required |
| Professional Reference 2 | Staff Onboarding: Step 4 | ❌ NOT IMPLEMENTED | N/A | Required |
| Reference domain email validation | Operational Policies: No personal emails | ❌ NOT IMPLEMENTED | N/A | **CRITICAL** |
| URN required for references | Operational Policies: Setting verification | ❌ NOT IMPLEMENTED | N/A | Validation |
| Reference link generation | Staff Onboarding: Auto-send | ❌ NOT IMPLEMENTED | N/A | Workflow |
| Reference form route | Staff Onboarding: Public form | ❌ NOT IMPLEMENTED | N/A | **MISSING ROUTE** |
| **Verification Status** | Staff Onboarding: Step 5 | ⚠️ COLUMN ONLY | `staff_profiles.verification_status` | No workflow |
| Pending review display | Staff Onboarding: Step 5 | ❌ NOT IMPLEMENTED | N/A | Status page |
| Verified badge | Staff Onboarding: Approved | ❌ NOT IMPLEMENTED | N/A | Visual indicator |
| **Availability** | Staff Onboarding: Step 5 | ❌ NOT IMPLEMENTED | N/A | Marketplace requirement |
| Available now toggle | Staff Onboarding: Step 5 | ❌ NOT IMPLEMENTED | N/A | Visibility control |
| Calendar/schedule | Staff Onboarding: Step 5 | ❌ NOT IMPLEMENTED | N/A | Availability management |
| **View Available Jobs** | Technical Spec: Marketplace | ❌ NOT IMPLEMENTED | N/A | **CORE FEATURE MISSING** |
| Job notifications | Operational Policies: Push/Email/SMS | ❌ NOT IMPLEMENTED | N/A | **CORE FEATURE MISSING** |
| Available/Not Available response | Operational Policies: Big buttons | ❌ NOT IMPLEMENTED | N/A | Core interaction |
| View job details | Operational Policies: Role, tasks, hours | ❌ NOT IMPLEMENTED | N/A | Decision making |
| View setting details | Operational Policies: Rating, parking, etc | ❌ NOT IMPLEMENTED | N/A | Decision making |
| Travel time display | Technical Spec: Google Maps | ❌ NOT IMPLEMENTED | N/A | Decision making |
| Accept job | Operational Policies: Confirmation flow | ❌ NOT IMPLEMENTED | N/A | **CORE FEATURE MISSING** |
| Secondary backup acceptance | Operational Policies: £10 bonus | ❌ NOT IMPLEMENTED | N/A | No-show mitigation |
| Check-in | Operational Policies: GPS + manual | ❌ NOT IMPLEMENTED | N/A | Compliance |
| Check-out | Operational Policies: End shift | ❌ NOT IMPLEMENTED | N/A | Payment trigger |
| Request replacement | Operational Policies: Sick day | ❌ NOT IMPLEMENTED | N/A | Edge case |
| Cancel job | Operational Policies: Serious reasons | ❌ NOT IMPLEMENTED | N/A | Edge case |
| Submit invoice | Payments Spec: Friday submission | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| View payment history | Payments Spec: Weekly payouts | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Rate setting | Technical Spec: Reviews | ❌ NOT IMPLEMENTED | N/A | Quality control |
| Block setting | Operational Policies: Block lists | ❌ NOT IMPLEMENTED | N/A | Safety feature |
| Chat with setting | Technical Spec: During booking only | ❌ NOT IMPLEMENTED | N/A | Communication |
| SMS opt-in/out | Payments Spec: Optional SMS | ❌ NOT IMPLEMENTED | N/A | Cost control |
| Read safeguarding docs | Operational Policies: Mandatory | ❌ NOT IMPLEMENTED | N/A | Compliance |

**Staff Features: 1/62 implemented (1.6%)**

### 2.3 Admin Features

| Feature | Spec Reference | Status | Files | Notes |
|---------|---------------|--------|-------|-------|
| **Admin Dashboard** | Operational Policies: Admin review | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| Staff verification queue | Operational Policies: Manual checks | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| View staff ID verification | Technical Spec: Didit results | ❌ NOT IMPLEMENTED | N/A | Data exists, no UI |
| View staff DBS details | Operational Policies: Certificate check | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| View staff qualifications | Operational Policies: Level 2/3 | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| View staff references | Operational Policies: Domain validation | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| Approve staff | Operational Policies: Verification | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| Reject staff | Operational Policies: Verification | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| Admin verification logging | Operational Policies: Timestamp + user | ❌ NOT IMPLEMENTED | N/A | Compliance |
| Settings verification queue | Operational Policies: Ofsted check | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| Verify Ofsted URN | Operational Policies: Registration check | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| Approve setting | Operational Policies: Verification | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| Reject setting | Operational Policies: Verification | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| View all bookings | Technical Spec: Admin oversight | ❌ NOT IMPLEMENTED | N/A | Monitoring |
| Mediate complaints | Operational Policies: Dispute resolution | ❌ NOT IMPLEMENTED | N/A | Customer service |
| Issue strikes | Operational Policies: 3-strike system | ❌ NOT IMPLEMENTED | N/A | Discipline |
| Suspend staff | Operational Policies: 30/60 day suspension | ❌ NOT IMPLEMENTED | N/A | Discipline |
| View audit logs | Technical Spec: Compliance | ❌ NOT IMPLEMENTED | N/A | GDPR requirement |
| Manual payment processing | Payments Spec: Edge cases | ❌ NOT IMPLEMENTED | N/A | Finance |

**Admin Features: 0/19 implemented (0%)**

### 2.4 Booking/Marketplace Features

| Feature | Spec Reference | Status | Files | Notes |
|---------|---------------|--------|-------|-------|
| **Job Posting** | Operational Policies: Settings post | ❌ NOT IMPLEMENTED | N/A | **CORE FEATURE MISSING** |
| **Staff Matching** | Technical Spec: Distance + availability | ❌ NOT IMPLEMENTED | N/A | **CORE FEATURE MISSING** |
| Distance calculation | Technical Spec: Google Maps Distance Matrix | ❌ NOT IMPLEMENTED | N/A | **API INTEGRATION MISSING** |
| Travel time calculation | Technical Spec: Driving vs public transport | ❌ NOT IMPLEMENTED | N/A | **API INTEGRATION MISSING** |
| Availability filtering | Technical Spec: Available now flag | ❌ NOT IMPLEMENTED | N/A | Marketplace logic |
| Block list filtering | Operational Policies: Mutual blocks | ❌ NOT IMPLEMENTED | N/A | Safety |
| Notification dispatch | Operational Policies: Email/SMS/Push | ❌ NOT IMPLEMENTED | N/A | **CORE FEATURE MISSING** |
| Staff response tracking | Operational Policies: Available/Not Available | ❌ NOT IMPLEMENTED | N/A | Marketplace logic |
| Primary selection | Operational Policies: Settings choose | ❌ NOT IMPLEMENTED | N/A | Core booking |
| Secondary selection | Operational Policies: Backup | ❌ NOT IMPLEMENTED | N/A | No-show mitigation |
| Confirmation emails | Operational Policies: Both parties | ❌ NOT IMPLEMENTED | N/A | Communication |
| Terms and conditions | Operational Policies: In confirmation | ❌ NOT IMPLEMENTED | N/A | Legal |
| Check-in reminders | Operational Policies: Both parties | ❌ NOT IMPLEMENTED | N/A | Compliance |
| Check-out reminders | Operational Policies: Both parties | ❌ NOT IMPLEMENTED | N/A | Payment trigger |
| No-show detection | Operational Policies: 15min window | ❌ NOT IMPLEMENTED | N/A | **CRITICAL LOGIC** |
| Secondary mobilization | Operational Policies: £10 bonus | ❌ NOT IMPLEMENTED | N/A | No-show mitigation |
| Strike system | Operational Policies: 3 strikes | ❌ NOT IMPLEMENTED | N/A | Discipline |
| Cancellation fee calculation | Operational Policies: Time-based fees | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Recurring bookings | Technical Spec: Templates | ❌ NOT IMPLEMENTED | N/A | Business feature |
| Multiple staff booking | Technical Spec: Same shift | ❌ NOT IMPLEMENTED | N/A | Business feature |

**Booking Features: 0/20 implemented (0%)**

### 2.5 Payment Features

| Feature | Spec Reference | Status | Files | Notes |
|---------|---------------|--------|-------|-------|
| **Stripe Connect Integration** | Payments Spec: Split payments | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Settings subscription charge | Payments Spec: £99/£249 monthly | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Hourly booking charge | Payments Spec: £23/hour | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| First booking monthly fee | Payments Spec: Subscription on first booking | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Weekly invoicing | Payments Spec: Friday invoices | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| 72-hour payment window | Payments Spec: Due Tuesday | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Bursary fund | Payments Spec: Prepay option | ❌ NOT IMPLEMENTED | N/A | Cash flow feature |
| Cancellation fee charging | Operational Policies: Time-based | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Staff weekly payouts | Payments Spec: Week in hand | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Staff hourly rate | Payments Spec: £15.50/hour | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Bonus payments | Operational Policies: £10 secondary cover | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Platform fee calculation | Payments Spec: £23 - £15.50 = £7.50 | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Invoice generation | Payments Spec: PDF invoices | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Payment status tracking | Payments Spec: Pending/Paid/Overdue | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Stripe webhooks | Technical Spec: Payment events | ❌ NOT IMPLEMENTED | N/A | **PAYMENT CRITICAL** |
| Annual payment discount | Payments Spec: 10 months for 12 | ❌ NOT IMPLEMENTED | N/A | Business feature |
| Full-time buyout fee | Payments Spec: Tiered 25%/20%/15% | ❌ NOT IMPLEMENTED | N/A | Business feature |

**Payment Features: 0/17 implemented (0%)**

### 2.6 Compliance Features

| Feature | Spec Reference | Status | Files | Notes |
|---------|---------------|--------|-------|-------|
| DBS Update Service hard stop | Operational Policies: Cannot proceed | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| DBS 12-month check | Operational Policies: Auto-flag expiry | ❌ NOT IMPLEMENTED | N/A | Compliance |
| Safeguarding cert expiry | Operational Policies: Auto-flag | ❌ NOT IMPLEMENTED | N/A | Compliance |
| First Aid cert expiry | Operational Policies: Auto-flag | ❌ NOT IMPLEMENTED | N/A | Compliance |
| Reference domain validation | Operational Policies: No personal emails | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| URN validation | Operational Policies: Ofsted check | ❌ NOT IMPLEMENTED | N/A | **CRITICAL GAP** |
| GPS check-in | Operational Policies: Web geolocation | ❌ NOT IMPLEMENTED | N/A | Compliance |
| Audit logging | Technical Spec: All actions | ❌ NOT IMPLEMENTED | N/A | GDPR requirement |
| Safeguarding doc upload | Operational Policies: Settings upload | ❌ NOT IMPLEMENTED | N/A | Compliance |
| Mandatory doc reading | Operational Policies: Staff acknowledge | ❌ NOT IMPLEMENTED | N/A | Compliance |
| Health declaration | Staff Onboarding: 14 conditions | ❌ NOT IMPLEMENTED | N/A | Compliance |
| Digital signature | Staff Onboarding: Legal binding | ❌ NOT IMPLEMENTED | N/A | Legal requirement |
| Suspension tracking | Operational Policies: 30/60 days | ❌ NOT IMPLEMENTED | N/A | Discipline |
| Duplicate detection | Operational Policies: Same DBS/Ofsted | ❌ NOT IMPLEMENTED | N/A | Fraud prevention |

**Compliance Features: 0/14 implemented (0%)**

---

## 3. Critical Gaps Summary

### 3.1 Blocking Issues (Cannot Launch MVP)

1. **No Settings Registration** - Cannot onboard customers
2. **No Ofsted URN Capture** - Cannot verify settings
3. **No Admin Verification UI** - Cannot approve settings/staff
4. **No Booking System** - Core marketplace missing
5. **No Payment Integration** - Cannot charge or pay
6. **No Notification System** - Cannot alert users
7. **No Reference System** - Cannot verify staff background

### 3.2 Data Model Gaps

**Missing Tables:**
- `setting_profiles` - **CRITICAL: No customer table**
- `bookings` - **CRITICAL: No jobs/assignments**
- `reviews` - Rating system
- `notifications` - Alerts
- `invoices` - Billing
- `staff_payments` - Payouts
- `staff_references` - Background checks
- `block_lists` - Safety
- `audit_logs` - Compliance

**Missing Columns in Existing Tables:**
- 20+ fields missing from `staff_profiles` (addresses, documents, health, emergency contacts)

### 3.3 Integration Gaps

| Integration | Required | Status |
|-------------|----------|--------|
| Supabase Auth | Account creation | ❌ NOT IMPLEMENTED |
| Didit ID Verification | Identity checks | ✅ IMPLEMENTED |
| Didit Webhooks | Async results | ❌ NOT IMPLEMENTED |
| Stripe Connect | Payments | ❌ NOT IMPLEMENTED |
| Stripe Webhooks | Payment events | ❌ NOT IMPLEMENTED |
| Google Maps Distance Matrix | Travel time | ❌ NOT IMPLEMENTED |
| Google Maps Geocoding | Address to lat/lng | ❌ NOT IMPLEMENTED |
| SendGrid | Email notifications | ❌ NOT IMPLEMENTED |
| Textlocal | SMS notifications | ❌ NOT IMPLEMENTED |
| Web Geolocation API | GPS check-in | ❌ NOT IMPLEMENTED |

---

## 4. Proposed Backlog (Next 5 Slices)

### **SLICE 1: Settings Registration & Verification** ⭐ HIGHEST PRIORITY
**Why Required:** Cannot onboard customers without this. Spec requires Ofsted URN validation per Operational Policies.

**Implementation Plan:**
1. Create `setting_profiles` table migration
2. Create `/settings/register` form with:
   - Setting name
   - Ofsted URN (text input with validation)
   - Ofsted rating (dropdown: Outstanding/Good/Requires Improvement/Inadequate)
   - Email, phone
   - Full address with postcode
   - Number of children, team size
   - Parking availability (boolean)
   - Operation hours (start/end time)
3. Create `/api/settings/register` endpoint
4. Store in database with `verification_status: 'pending'`
5. Create `/admin/settings` verification queue
6. Display pending settings with Ofsted details
7. Add approve/reject buttons
8. Update `verification_status` and log admin action

**Acceptance Criteria:**
- Setting can register with Ofsted URN
- Data stored in `setting_profiles` table
- Admin can view pending settings at `/admin/settings`
- Admin can approve/reject with logged action
- Approved settings can log in

**Test Locally:**
1. Navigate to `/settings/register`
2. Fill form with test Ofsted URN (e.g., "EY123456")
3. Submit registration
4. Grant admin role: `UPDATE auth.users SET raw_user_meta_data = '{"role":"admin"}' WHERE email = 'your@email.com'`
5. Navigate to `/admin/settings`
6. Verify pending setting appears
7. Click approve
8. Verify status changes to 'approved' in database

**Database Migration:**
```sql
-- 0002_settings.sql
create table setting_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  setting_name text not null,
  ofsted_number text unique not null,
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
  subscription_tier text default 'pilot' check (subscription_tier in ('pilot', 'standard')),
  verification_status text default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_setting_ofsted on setting_profiles(ofsted_number);
create index idx_setting_verification on setting_profiles(verification_status);

alter table setting_profiles enable row level security;

create policy "Settings can view own profile"
  on setting_profiles for select using (auth.uid() = id);

create policy "Settings can update own profile"
  on setting_profiles for update using (auth.uid() = id);

create policy "Admins can view all settings"
  on setting_profiles for select using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

create policy "Admins can update settings"
  on setting_profiles for update using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
```

---

### **SLICE 2: Complete Staff Onboarding Form**
**Why Required:** Staff Onboarding spec requires 5-step process with all fields. Currently only ID verification works.

**Implementation Plan:**
1. Expand `staff_profiles` table with missing columns
2. Build Step 2: Profile basics form (NI number, DOB, address, travel, transport, experience, qualification)
3. Build Step 3: Document uploads (DBS cert, qualifications, first aid, right to work)
4. Add DBS Update Service hard stop with link to gov.uk
5. Build Step 4: Health declaration (14 conditions), emergency contacts, GP details
6. Build Step 5: Digital signature canvas
7. Create file upload to Supabase Storage
8. Store all data in `staff_profiles` and `staff_documents`

**Acceptance Criteria:**
- All 5 steps functional
- DBS Update Service blocks progress if not checked
- All documents upload to Supabase Storage
- Digital signature captured
- Profile saved with `verification_status: 'pending'`

**Test Locally:**
1. Navigate to `/staff/onboarding`
2. Complete all 5 steps
3. Upload test documents
4. Try to proceed without DBS Update Service (should block)
5. Complete signature
6. Verify data in `staff_profiles` and `staff_documents` tables

**Database Migration:**
```sql
-- 0003_staff_complete.sql
alter table staff_profiles
add column if not exists national_insurance_number text,
add column if not exists date_of_birth date,
add column if not exists address_line_1 text,
add column if not exists address_line_2 text,
add column if not exists city text,
add column if not exists latitude decimal(10, 8),
add column if not exists longitude decimal(11, 8),
add column if not exists dbs_certificate_number text,
add column if not exists dbs_issue_date date,
add column if not exists dbs_surname_on_certificate text,
add column if not exists safeguarding_certificate_url text,
add column if not exists safeguarding_expiry_date date,
add column if not exists paediatric_first_aid_url text,
add column if not exists paediatric_first_aid_expiry_date date,
add column if not exists right_to_work_document_url text,
add column if not exists disqualified_person_declaration boolean default false,
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
add column if not exists digital_signature_date timestamptz;
```

---

### **SLICE 3: Admin Staff Verification UI**
**Why Required:** Operational Policies require manual admin verification of DBS, qualifications, and references before staff can work.

**Implementation Plan:**
1. Create `/admin/staff` verification queue
2. Display pending staff with all uploaded documents
3. Show ID verification results from Didit
4. Show DBS certificate details
5. Show qualifications
6. Show references (when implemented)
7. Add approve/reject buttons
8. Update `verification_status` to 'approved' or 'rejected'
9. Log admin user and timestamp in `verified_by` and `verified_at`
10. Send email notification to staff

**Acceptance Criteria:**
- Admin can view all pending staff
- All documents visible and downloadable
- ID verification results displayed
- Approve/reject updates status
- Staff notified of decision

**Test Locally:**
1. Complete staff onboarding (Slice 2)
2. Grant admin role to test user
3. Navigate to `/admin/staff`
4. Verify pending staff appears
5. Click on staff to view details
6. Click approve
7. Verify `verification_status` changes to 'approved'
8. Verify `verified_by` and `verified_at` populated

---

### **SLICE 4: Reference System**
**Why Required:** Operational Policies require professional references with domain email validation and URN.

**Implementation Plan:**
1. Create `staff_references` table
2. Build Step 4 in staff onboarding: Add references form
3. Generate unique reference token for each reference
4. Create `/api/references/send` endpoint to email reference link
5. Create `/references/[token]` public form route
6. Reference form captures: name, email, phone, setting name, URN, position, dates worked, reference text, rating, would rehire
7. Validate email domain (not gmail/yahoo/hotmail)
8. Store reference in `staff_references` table
9. Display references in admin verification UI

**Acceptance Criteria:**
- Staff can add 2 professional references
- Reference emails sent with unique link
- Reference form accessible without login
- Domain validation blocks personal emails
- References visible in admin UI

**Test Locally:**
1. Add references in staff onboarding
2. Check email for reference link (or copy from database)
3. Open reference link in incognito window
4. Fill reference form
5. Try personal email (should reject)
6. Use domain email (should accept)
7. Verify reference stored in database
8. View in admin UI

**Database Migration:**
```sql
-- 0004_references.sql
create table staff_references (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff_profiles(id) on delete cascade,
  reference_type text not null check (reference_type in ('personal', 'professional')),
  referee_name text not null,
  referee_email text not null,
  referee_phone text,
  relationship text,
  years_known integer,
  setting_name text,
  setting_urn text,
  position text,
  dates_worked_from date,
  dates_worked_to date,
  reference_link_token uuid default gen_random_uuid(),
  reference_link_sent_at timestamptz,
  reference_submitted_at timestamptz,
  reference_text text,
  reference_rating integer check (reference_rating between 1 and 5),
  would_rehire boolean,
  email_verified boolean default false,
  domain_verified boolean default false,
  created_at timestamptz not null default now()
);

create index idx_references_staff_id on staff_references(staff_id);
create index idx_references_token on staff_references(reference_link_token);

alter table staff_references enable row level security;

create policy "Staff can view own references"
  on staff_references for select using (
    staff_id in (select id from staff_profiles where id = auth.uid())
  );

create policy "Public can submit references"
  on staff_references for update using (true);

create policy "Admins can view all references"
  on staff_references for select using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
```

---

### **SLICE 5: Basic Booking Flow (MVP)**
**Why Required:** Core marketplace feature. Settings post jobs, staff respond. Operational Policies define entire flow.

**Implementation Plan:**
1. Create `bookings` table
2. Create `/settings/dashboard` with "Post Job" button
3. Build job posting form: role, responsibilities, date, start time, end time
4. Create `/api/bookings/create` endpoint
5. Calculate available staff within travel radius
6. Create `/staff/dashboard` showing available jobs
7. Display job details: setting name, rating, role, hours, travel time
8. Add "Available" / "Not Available" buttons
9. Create `/api/bookings/respond` endpoint
10. Settings view responses at `/settings/bookings/[id]`
11. Settings select primary staff
12. Create `/api/bookings/confirm` endpoint
13. Update booking status to 'confirmed'
14. Send confirmation emails to both parties

**Acceptance Criteria:**
- Setting can post job
- Staff within radius notified (email for MVP, no SMS yet)
- Staff can mark available/not available
- Setting sees available staff with travel time
- Setting can select staff
- Booking confirmed
- Both parties receive confirmation email

**Test Locally:**
1. Create approved setting and staff
2. Log in as setting
3. Navigate to `/settings/dashboard`
4. Click "Post Job"
5. Fill job details
6. Submit
7. Log in as staff
8. Navigate to `/staff/dashboard`
9. Verify job appears
10. Click "Available"
11. Log in as setting
12. View responses
13. Select staff
14. Verify booking status 'confirmed'
15. Check email for confirmations

**Database Migration:**
```sql
-- 0005_bookings.sql
create table bookings (
  id uuid primary key default gen_random_uuid(),
  setting_id uuid not null references setting_profiles(id) on delete cascade,
  staff_id uuid references staff_profiles(id) on delete set null,
  secondary_staff_id uuid references staff_profiles(id) on delete set null,
  role_to_cover text not null,
  responsibilities text[],
  additional_tasks text,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  hours decimal(5, 2) not null,
  status text default 'pending' check (status in (
    'pending', 'confirmed', 'in_progress', 'completed',
    'cancelled_by_setting', 'cancelled_by_staff', 'no_show', 'terminated'
  )),
  secondary_notified boolean default false,
  secondary_accepted boolean default false,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  hourly_rate_setting decimal(10, 2) default 23.00,
  hourly_rate_staff decimal(10, 2) default 15.50,
  total_cost_setting decimal(10, 2),
  total_pay_staff decimal(10, 2),
  platform_fee decimal(10, 2),
  bonus_pay decimal(10, 2) default 0.00,
  estimated_travel_time_minutes integer,
  travel_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_bookings_setting on bookings(setting_id);
create index idx_bookings_staff on bookings(staff_id);
create index idx_bookings_date on bookings(booking_date);
create index idx_bookings_status on bookings(status);

alter table bookings enable row level security;

create policy "Settings can view own bookings"
  on bookings for select using (
    setting_id in (select id from setting_profiles where id = auth.uid())
  );

create policy "Staff can view own bookings"
  on bookings for select using (
    staff_id in (select id from staff_profiles where id = auth.uid())
    or secondary_staff_id in (select id from staff_profiles where id = auth.uid())
  );

create policy "Settings can create bookings"
  on bookings for insert with check (
    setting_id in (select id from setting_profiles where id = auth.uid())
  );

create policy "Admins can view all bookings"
  on bookings for select using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
```

---

## 5. Backlog Priority Order

| Priority | Slice | Reason | Estimated Effort |
|----------|-------|--------|------------------|
| 1 | Settings Registration & Verification | Cannot onboard customers | 2-3 days |
| 2 | Complete Staff Onboarding | Cannot onboard workers | 3-4 days |
| 3 | Admin Staff Verification | Cannot approve workers | 1-2 days |
| 4 | Reference System | Compliance requirement | 2-3 days |
| 5 | Basic Booking Flow | Core marketplace | 4-5 days |
| 6 | Payment Integration (Stripe) | Revenue critical | 5-7 days |
| 7 | Notification System | User engagement | 2-3 days |
| 8 | Check-in/Check-out | Compliance | 2-3 days |
| 9 | Rating System | Quality control | 2-3 days |
| 10 | Cancellation & Fees | Business logic | 2-3 days |

---

## 6. Immediate Action Items

### To Build Next (Slice 1):
1. Create `0002_settings.sql` migration
2. Run migration in Supabase
3. Build `/settings/register` form component
4. Build `/api/settings/register` endpoint
5. Build `/admin/settings` verification queue
6. Test end-to-end flow

### Files to Create:
```
supabase/migrations/0002_settings.sql
app/settings/register/page.tsx (replace placeholder)
app/api/settings/register/route.ts
app/admin/settings/page.tsx
app/admin/layout.tsx (admin navigation)
app/components/OfstedURNInput.tsx (validation component)
```

### Estimated Time:
2-3 days for complete Slice 1 implementation and testing.

---

## 7. Risk Assessment

### High Risk Items:
1. **No payment system** - Cannot generate revenue
2. **No booking system** - No core product
3. **No settings table** - Cannot onboard customers
4. **No notification system** - Users won't know about jobs

### Medium Risk Items:
1. Incomplete staff onboarding - Workers can't complete signup
2. No admin verification - Can't approve users
3. No reference system - Compliance gap

### Low Risk Items:
1. Missing rating system - Can add post-launch
2. Missing chat - Can use email initially
3. Missing recurring bookings - Nice to have

---

## 8. Conclusion

**Current State:** 5% complete. Foundation exists (database connection, ID verification) but no core business logic.

**Next Step:** Implement Slice 1 (Settings Registration & Verification) to enable customer onboarding and admin approval workflow.

**MVP Readiness:** After completing Slices 1-5, the platform will have minimum viable marketplace functionality. Estimated 12-15 days of focused development.

**Recommendation:** Follow the slice order exactly. Each slice builds on the previous and unblocks critical functionality.
