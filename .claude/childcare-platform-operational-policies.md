# Emergency Childcare Staffing Platform - Operational Policies

**Last Updated:** 14 February 2026  
**Status:** FINALIZED - Ready for Development

---

## 1. Strike & Suspension System

### Strike Progression

**STRIKE 1: Warning (Hidden)**
- Status: ACTIVE ✓
- Visibility: Hidden from settings (internal only)
- Impact: Email warning to carer
- Profile Badge: None
- Priority: Normal (no ranking penalty)
- Expiry: Removed after 90 days if no new strikes
- Carer sees: "You have received a warning for [reason]"

**STRIKE 2: Visible Warning**
- Status: ACTIVE ⚠️
- Visibility: VISIBLE to settings when reviewing candidates
- Impact: Profile shows "⚠️ 1 Active Warning"
- Profile Badge: Yellow warning icon
- Priority: Lowered (appears lower in search results)
- Settings see: "This carer has reliability concerns. [View details]"
- Expiry: Removed after 90 days if no new strikes

**STRIKE 3: 30-Day Suspension**
- Status: SUSPENDED 🔴
- Duration: 30 days
- Cannot accept new jobs
- Existing bookings: Can complete if booked before suspension
- Profile: Hidden from all searches
- Reactivation: Automatic after 30 days
- Post-suspension: 30-day probation period
- Warning: "One more strike within 30 days = 60-day suspension"

**STRIKE 4: 60-Day Suspension** (Only if occurs within 30 days after Strike 3 lifted)
- Status: SUSPENDED (EXTENDED) 🔴
- Duration: 60 days
- All bookings: Cancelled (settings refunded)
- Reactivation: Manual admin review required
- Post-suspension: Strict probation

**STRIKE 5+: Permanent Ban**
- Status: BANNED (permanent)
- DBS Number: Flagged in system
- Re-registration: Blocked automatically
- Appeal: Formal process available

### Strike Causes
- No-show (didn't arrive, didn't communicate)
- Late cancellation without valid proof (<12 hours)
- Late cancellation without calling support (<2 hours)
- Pattern of last-minute cancellations (>3 in 30 days)
- Providing false evidence (instant removal)
- Serious misconduct (safeguarding, unprofessional behavior)

### No-Strike Situations
- Cancel 24+ hours in advance (any reason)
- Cancel <24 hours with approved proof
- Genuine emergency with evidence
- Setting-initiated cancellation
- Platform error/technical issue

### Strike Expiry
- Strikes expire after 90 days if no new strikes
- Clean record = strikes reset to zero
- Probation period resets strike counter but flags history

---

## 2. Cancellation Policies

### Settings Cancellation Tiers

**Tier 1: Less than 2 hours before start**
- Fee: 100% of shift cost
- Example: 8-hour shift @ £22/hour = £176
- Carer receives: Full payment (£124)
- Platform keeps: £52 margin
- Rationale: Carer likely already traveling

**Tier 2: 2-12 hours before start**
- Fee: 50% of shift cost
- Example: £176 shift = £88 fee
- Carer receives: Half payment (£62)
- Platform keeps: £26 margin
- Rationale: Very short notice, hard to rebook

**Tier 3: 12-23 hours before start**
- Fee: 25% of shift cost
- Example: £176 shift = £44 fee
- Carer receives: Quarter payment (£31)
- Platform keeps: £13 margin
- Rationale: Some notice given, carer has time to find other work

**Tier 4: 24+ hours before start**
- Fee: £0 (FREE cancellation)
- Carer receives: £0
- Platform keeps: £0
- Rationale: Fair notice, carer can rebook easily

### Carer Cancellation Policy

**24+ Hours Notice:**
- Proof required: NONE
- Process: Simple cancellation, select reason from dropdown
- Strike: No strike
- Payment: No compensation

**12-24 Hours Notice:**
- Proof required: Brief explanation (text field)
- Admin review: Required (approve/strike within 24 hours)
- Strike: Applied if reason not valid
- Examples: "Child sick - school called", "Doctor appointment moved"

**2-12 Hours Notice:**
- Proof required: EVIDENCE + detailed explanation
- Evidence examples:
  - Medical: Doctor's note, prescription, hospital letter
  - Transport: TfL alert screenshot, breakdown reference
  - Family: School notification, care home call
- Admin review: Within 4 hours (urgent)
- Strike: Applied if proof insufficient

**Less than 2 Hours Notice:**
- Proof required: IMMEDIATE contact + evidence
- Must: Call platform support (not just app)
- Evidence: Required within 2 hours
- Admin: Immediate escalation and review
- Strike: Applied unless genuine emergency with proof

### Valid Cancellation Reasons (No Strike)
1. **Medical Emergencies**
   - Personal severe illness
   - Family member hospitalization
   - Accident/injury
   - Mental health crisis

2. **Family Emergencies**
   - Child sick/school closure
   - Elderly parent emergency
   - Bereavement
   - Domestic crisis

3. **Transport Failures**
   - Train/bus cancelled (not delayed)
   - Major incident on route
   - Car breakdown with evidence
   - Severe weather travel ban

4. **Safety Concerns**
   - Unsafe working conditions
   - Harassment/safeguarding issue
   - Home emergency (flood, fire, break-in)
   - Police/court requirement

5. **Setting-Caused**
   - Setting changed shift details last-minute
   - Setting has Ofsted issue/closure
   - Setting requested cancellation
   - Duplicate booking error

---

## 3. No-Show Protocol

### Timeline

**8:55 AM - Pre-arrival reminder**
- Primary carer: "Your shift starts in 5 mins"
- SMS + Push notification

**9:00 AM - Check-in notification (BOTH parties)**
- Primary carer: "Have you arrived and started work?"
  - Options: [✓ Yes, I've started] [⏰ Running late] [✗ Can't make it]
- Setting: "Has [Carer Name] arrived and started?"
  - Options: [✓ Yes, started] [⏰ Not yet arrived] [⚠ Issue]

**9:05 AM - Reminder sent** (if no response)

**9:15 AM - No-show triggered** (if no response)
- Secondary receives STANDBY notification
- Setting receives decision prompt

### Decision Flow

**If Primary Confirms "Running Late":**
- System asks: "When will you arrive?"
  - [15 mins] [30 mins] [1 hour] [Can't make it]
- Message sent to setting with ETA
- Setting decides: [Wait for primary] or [Use backup carer]

**If Setting Waits:**
- Secondary not mobilized
- Primary keeps shift (minus late time)
- No strike if genuinely late and communicated

**If Setting Mobilizes Backup:**
- Secondary receives urgent notification + £10 bonus offer
- Primary loses shift (even if arrives later)
- Primary receives £5 travel compensation
- Primary receives strike
- Secondary gets full shift + £10 bonus

### Secondary Carer Standby System

**When Selected as Secondary:**
- Notification: "You're selected as backup carer for [Setting] on [Date]"
- Must confirm: "I'm available as backup"
- Responsibilities:
  - Check app at shift start time
  - Be ready to mobilize if called
  - Respond within 5 minutes if mobilized

**Standby Notification (if primary no-show):**
```
⚠️ PRIMARY CARER HAS NOT ARRIVED

Setting: Happy Days Nursery
Shift: 9:00 AM - 5:00 PM

You are on STANDBY as backup.
The setting will confirm if they need you.

If mobilized, you'll receive:
- Full shift pay (£124 for 8 hours)
- Emergency bonus: +£10
- Total: £134

[✓ I'm ready if needed] [✗ Not available]
```

**Mobilization Notification:**
```
🚨 EMERGENCY COVER NEEDED

Setting: Happy Days Nursery
Address: 123 High Street, SE1 2AB
Shift: NOW until 5:00 PM

Emergency bonus: +£10

Fastest route: Northern Line to Borough (18 mins)
Expected arrival: 9:33 AM

[✓ On my way] [View directions]
```

### Payment for No-Show Scenarios

**Primary No-Show, Secondary Covers:**
- Primary: £5 travel compensation only + Strike
- Secondary: £124 shift + £10 bonus = £134
- Setting pays: £176 (normal rate)
- Platform: £42 margin (covers £5 to primary)

**Primary Late (communicated), Setting Waits:**
- Primary: Full pay minus late time
- Secondary: £0 (not needed)
- No strike (communicated in advance)

**Primary Late (no communication), Setting Mobilizes:**
- Primary: £5 travel only + Strike
- Secondary: £134 (full pay + bonus)
- Strike justification: Lack of communication

---

## 4. Verification Requirements

### Carer Verification Checklist

**1. Identity Verification (Didit)**
- Government-issued photo ID
- Liveness check (not just photo)
- Automated via Didit API
- Cost: Free for first 500/month, then £0.30-0.50

**2. Enhanced DBS Certificate**
- Must be Enhanced (not Basic or Standard)
- Accept existing if:
  - Less than 12 months old, OR
  - Registered with Update Service
- Upload: PDF or photo
- Verification: Admin checks certificate number against DBS database
- Storage: Encrypted in Supabase Storage

**3. Qualifications**
- Required: Level 2 or Level 3 Childcare qualification
- Upload: Certificate or diploma
- Verification: Admin checks awarding body
- Accepted: CACHE, NCFE, City & Guilds, BTEC, NVQ

**4. First Aid Certificate**
- Required: Paediatric First Aid (12-hour course)
- Must be in-date
- Upload: Certificate
- Verification: Admin checks expiry date

**5. References (2+ Required)**
- Automated secure link system
- Referee completes standardized form
- Must be from childcare setting (Ofsted registered)
- Verified via Ofsted URN
- Admin reviews before approval

**6. Admin Approval**
- All 5 items above must be complete
- Admin manually reviews all documents
- Checks for red flags
- Approves or requests corrections
- Carer cannot accept jobs until 100% verified

### Reference Collection Process

**Carer Side:**
1. Enter referee email in profile
2. Click "Send reference request"
3. System generates unique token (expires in 14 days)
4. Email sent automatically to referee
5. Carer can track status: Pending → Completed

**Referee Side:**
1. Receives email with secure link
2. Clicks link (no login required)
3. Completes 10-question form (5-10 minutes):
   - Setting name, Ofsted URN, rating
   - Relationship to carer, dates employed
   - Role, responsibilities, reason for leaving
   - Ratings (1-5): Childcare skills, reliability, teamwork, professionalism
   - Would you rehire this person? (Yes/No)
   - Any safeguarding concerns? (Yes/No + details)
4. Submits form (one-time, cannot edit)
5. IP address and timestamp logged

**Admin Side:**
1. Notification when reference submitted
2. Reviews all answers
3. Checks Ofsted URN validity
4. Flags if concerns raised
5. Approves or requests follow-up
6. Notes added to carer record

### Anti-Fraud Detection (References)

**Red Flags:**
- Same email domain as carer
- Submitted <2 minutes after opening link
- All perfect 5-star ratings
- Generic copy-paste comments
- Invalid Ofsted URN
- Referee name matches carer's family member (cross-check)

**Verification:**
- Ofsted URN checked against official registry
- Email domain verified (nursery websites)
- Phone number validation (call referee if suspicious)
- Multiple references from same setting flagged

---

## 5. Compliance Requirements

### Agency Worker Regulations (AWR)

**12-Week Rule:**
- Track weeks worked at same setting
- Auto-alert admin at week 10
- Auto-alert setting at week 10
- At week 12: Carer entitled to permanent staff pay rate
- Action required: Adjust pay or rotate carer

**Tracking:**
```sql
awr_tracking table:
├─ carer_id
├─ setting_id
├─ weeks_worked (integer, cumulative)
├─ last_shift_date
├─ alert_sent_at (week 10)
├─ action_required (boolean)
└─ resolution_notes
```

**Dashboard Alert:**
```
⚠️ AWR ALERT

Carer: Sarah Johnson
Setting: Happy Days Nursery
Weeks worked: 10/12

ACTION REQUIRED in 2 weeks:
- Match permanent staff pay rate, OR
- Rotate carer to different setting

[View Details] [Mark Resolved]
```

### Ofsted Compliance

**Setting Verification:**
- Ofsted URN required at signup
- Verified against official Ofsted database
- Rating checked: Good or Outstanding preferred
- Inadequate rating: Flagged for review

**Ratio Requirements:**
- Level 2: Can work but doesn't count toward qualified staff ratio
- Level 3: Counts toward qualified staff ratio
- Platform tracks and displays on carer profile
- Settings responsible for ensuring ratios met

**Record Keeping:**
- All placements logged
- Hours worked tracked
- Qualifications stored
- Available for Ofsted inspection

### GDPR & Data Protection

**Data Retention:**
- Verification documents: 2 years after last shift
- Transaction records: 7 years (tax requirement)
- Communication logs: 1 year
- Deleted user data: Anonymized, not deleted (fraud prevention)

**Right to Erasure:**
- User can request deletion
- Personal data removed within 30 days
- Exception: Transaction records (7-year tax requirement)
- Anonymization: Name → "User [ID]", email → deleted

**Data Access:**
- Users can export all their data
- Format: JSON or CSV
- Includes: Profile, shifts, payments, communications
- Available via dashboard: "Download My Data"

**Security:**
- Encryption at rest (Supabase default)
- Encryption in transit (HTTPS/TLS)
- Row-level security (RLS) on all tables
- DBS certificates: Extra encryption layer
- Access logs: All document access tracked

---

## 6. Payment Terms & Processes

### Carer Payments

**Payment Schedule:**
- Terms: Net-30 from invoice submission
- Submission: Carer submits invoice after shift completion
- Due date: 30 days after submission
- Method: Bank transfer via Stripe Connect

**Invoice Process:**
1. Shift completed and confirmed by both parties
2. Carer clicks "Submit invoice"
3. System generates invoice:
   - Base pay: Hours × £15.50
   - Emergency bonus: +£10 (if applicable)
   - SMS charges: -£X (if opt-in)
   - Final amount calculated
4. Invoice sent to platform for payment
5. Paid within 30 days to carer's bank account

**SMS Charge Deduction:**
- Calculated monthly (all SMS in billing period)
- Deducted from first invoice of month
- Shown on invoice breakdown:
  ```
  Shift earnings:        £124.00
  SMS charges (15 msgs): -£1.50
  TOTAL:                 £122.50
  ```

### Setting Payments

**Billing Cycle:**
- Monthly billing
- Subscription charged: 1st of month
- Hourly fees charged: Previous month's usage
- Combined into single invoice

**Example Invoice (Month 2):**
```
INVOICE #202602-001
Happy Days Nursery
February 2026

SUBSCRIPTION (Feb 2026):
Monthly subscription:        £99.00

USAGE (Jan 2026):
15 hours × £22/hour:         £330.00
Emergency bonus (1×):        £10.00

TOTAL DUE:                   £439.00
Due date: 7 Feb 2026
```

**Payment Method:**
- Stripe subscription (automatic)
- Card on file charged automatically
- Failed payment: 3 retry attempts
- Continued failure: Account suspended

---

## 7. Quality Assurance

### Rating System

**Who Can Rate:**
- Settings rate carers (after shift)
- Carers rate settings (after shift)
- Both must complete shift for ratings to count

**Rating Scale:**
- 1-5 stars
- Required categories:
  - Carers: Professionalism, Childcare Skills, Reliability, Communication
  - Settings: Clarity, Professionalism, Working Conditions, Communication
- Optional: Written review (500 characters max)

**Display:**
- Average rating shown on profile
- Total shifts completed shown
- Recent reviews visible (last 5)
- Settings can filter by rating (4+ stars only)

**Impact:**
- Below 4.0: Account review triggered
- Below 3.5: Automatic suspension pending review
- Consistent 1-2 star reviews: Removal from platform

### Dispute Resolution

**Disputes Can Be Raised For:**
- Hours worked disagreement
- No-show claims
- Quality of work
- Safety concerns

**Process:**
1. Party raises dispute via dashboard
2. Evidence submitted by both sides
3. Admin reviews within 48 hours
4. Decision made based on:
   - Check-in/check-out logs
   - GPS data (Phase 2)
   - Communications
   - Previous history
5. Resolution communicated to both parties
6. Adjustment made if required

**Escalation:**
- If party disagrees with resolution
- Formal appeal to senior admin
- Reviewed within 5 business days
- Final decision binding

---

**END OF OPERATIONAL POLICIES**
