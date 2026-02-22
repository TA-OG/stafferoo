# Stafferoo master build checklist, single source of truth
Last updated: 2026-02-18

This checklist is designed so you can pause the build, return later, and immediately see what is done, what is next, and what is on hold.

Status right now
1. Scaffold stage, backlog captured
2. No feature cluster is approved for build
3. Nothing should be marked complete until it is tested and you explicitly sign it off

## A. Product scope map, what the app must do
### A1. Roles and core entities
- [ ] Users, roles: carer, setting, admin
- [ ] Carer profile, compliance status, availability
- [ ] Setting profile, compliance profile, billing status
- [ ] Job requests, placements, shifts worked, disputes
- [ ] Payments, payouts, invoices, fees, refunds
- [ ] Messaging, notifications, audit trail

### A2. Primary workflows
- [ ] Carer onboarding, document upload, verification, admin approval
- [ ] Setting onboarding, subscription, ability to post job requests
- [ ] Matching, offer, acceptance, confirmation
- [ ] Shift execution, check in, check out, actual hours
- [ ] Weekly pay flow for carers, invoicing flow for settings
- [ ] Compliance and enforcement, strikes, suspensions, bans
- [ ] Support and disputes, evidence, decisioning

## B. Engineering rules, quality gates, delivery contract
- [ ] TypeScript strict is enabled and enforced in CI
- [ ] Zod validation on all external inputs, API bodies, query params, webhooks
- [ ] Standard error taxonomy, no uncaught errors, no silent failures
- [ ] Feature flags by default for every new capability
- [ ] Observability first, structured logs, audit events, correlation ids
- [ ] Database migrations, no manual schema edits
- [ ] Small slices only, each slice has acceptance criteria and tests
- [ ] Required gates before merge, lint, typecheck, build, tests
- [ ] Rollback plan or kill switch for each feature cluster

## C. Architecture baseline, must match the current agreed stack
Record the final stack in the repo as an ADR so it never drifts.

- [ ] Next.js, App Router
- [ ] TypeScript strict
- [ ] Postgres with migrations
- [ ] Auth, roles and session enforcement
- [ ] Background jobs via jobs table plus Node worker process
- [ ] Feature flags and structured audit logging
- [ ] Email provider baseline, invoices via Resend, later optional Gmail, Outlook, SMTP
- [ ] For childcare platform modules, payments via Stripe Connect, SMS via Textlocal, maps via Google Maps API, file storage and auth via Supabase, if those modules are in scope for this codebase

## D. Repository and environment setup
### D1. Repo structure, documentation
- [ ] README includes local setup, env vars, how to run worker, how to run tests
- [ ] docs folder includes ADRs, data model, API contracts, runbooks
- [ ] SECURITY.md includes secrets handling, logging rules, dependency policy
- [ ] CONTRIBUTING.md includes gates, branch strategy, PR checklist

### D2. Environment variables
- [ ] Database connection string
- [ ] Auth provider keys
- [ ] Resend API key and sender domain
- [ ] Stripe Connect keys, webhook secrets, if used
- [ ] Textlocal API key, if used
- [ ] Google Maps API key, if used
- [ ] Supabase keys, if used
- [ ] Encryption key for storing sensitive upstream responses, if enabled
- [ ] Worker identity, for locking and heartbeat

### D3. CI pipeline
- [ ] Lint
- [ ] Typecheck
- [ ] Unit tests
- [ ] Integration tests
- [ ] Build
- [ ] Dependency security checks

## E. Data model and migrations
### E1. Core tables, common across the product
- [ ] users, profiles, roles, organisation membership
- [ ] carers, settings
- [ ] job_requests, placements
- [ ] audit_events
- [ ] feature_flags
- [ ] notifications, email_log, sms_log

### E2. Compliance and enforcement tables
- [ ] carer_verifications summary table
- [ ] strikes
- [ ] suspensions
- [ ] banned_users, fraud prevention keys
- [ ] reference requests, tokens, submissions, expiry

### E3. Payments and billing tables
For childcare staffing model
- [ ] subscriptions for settings, tiers, status, proration rules
- [ ] weekly payslips or worker invoices for carers
- [ ] setting invoices, line items, disputes, credit notes
- [ ] bursary wallet if used, top ups, deductions, ledger

For Stafferoo invoices and quotes model
- [ ] clients
- [ ] jobs
- [ ] invoices, invoice_line_items
- [ ] quotes, quote_line_items, deposit terms, validity dates
- [ ] payments, manual payment entries, status history
- [ ] outbound email accounts, sends audit

### E4. Jobs queue tables
- [ ] jobs table for background work, type, payload, run_after, attempts, locks
- [ ] worker heartbeats

## F. Authentication, authorisation, and tenancy
- [ ] Secure session management
- [ ] Role based access control
- [ ] Organisation level tenancy, settings cannot see each other’s data
- [ ] Carers can only see their own profile, documents, jobs, payments
- [ ] Admin can access verification queues, disputes, enforcement tooling
- [ ] Audit events emitted for sensitive actions

## G. Carer onboarding and verification, end to end
Source inputs come from the onboarding requirements file.

### G1. Account creation
- [ ] Sign up, email verification, password rules
- [ ] Basic profile, phone, NI number, location, travel radius, transport, role skills

### G2. Eligibility gating
- [ ] DBS Update Service requirement, hard stop if not on the service
- [ ] Permission to check DBS online, explicit consent captured
- [ ] Qualifications gating, MVP hard stop if none, route to keep on file page
- [ ] Mandatory safeguarding training and paediatric first aid, capture dates, expiry warnings

### G3. Document upload
- [ ] ID, right to work, qualifications, DBS certificate, safeguarding, first aid
- [ ] Certificate surname and certificate number captured
- [ ] Emergency contacts, GP details
- [ ] Health declaration, sensitive data handling
- [ ] Digital signature with date

### G4. References
- [ ] At least one setting reference using a work email on a setting domain
- [ ] Reference request tokens, expiry, one time submission
- [ ] Reference form fields captured, safeguarding concerns, would rehire

### G5. Verification status and badges
- [ ] Pending review state
- [ ] Verified badge after admin approval

### G6. DBS Update Service verification automation, production implementation
This is the plan in a.md, integrated into the onboarding automation.
- [ ] API route to submit DBS details and enqueue job
- [ ] Status endpoint for onboarding automation and admin UI
- [ ] Worker claims jobs, calls multiple status check endpoint, parses XML
- [ ] Mapping rules, VALID, INVALID, NEEDS_REVIEW, never auto pass on errors
- [ ] Idempotency, retries, lock sweeper
- [ ] Encrypted raw response storage optional, retention purge
- [ ] Unit tests and integration tests for parser and worker

## H. Settings onboarding and subscription
Based on payments notes and technical spec.
- [ ] Setting account creation and verification, Ofsted URN capture and validation, if required
- [ ] Setting profile, address, location coordinates
- [ ] Subscription tier selection, pilot, full
- [ ] Pro rata billing on sign up, align all payments to the 28th for next month
- [ ] Ability to pay yearly with 10 month discount
- [ ] Notifications to confirm booked hours and approve invoice, payment expected within 3 days

## I. Job requests, matching, and placements
- [ ] Create job request, date, times, role, rate, total cost
- [ ] Ability to book more than one staff member per day
- [ ] Recurring bookings for the same staff member
- [ ] Offer and acceptance, confirmation messaging, cancellation rules
- [ ] Placement record, primary and secondary carer support
- [ ] Check in, check out, actual hours
- [ ] No show handling and penalties

## J. Payments, invoicing, and payouts
There are two related billing models here. Keep them modular.

### J1. Childcare staffing platform payments model
- [ ] Carers work one week in hand
- [ ] Weekly pay processing, invoice submitted Friday, staff confirm hours and flag discrepancies
- [ ] Settings pay for staff hours booked the previous week, paid on Wednesday after, if this is the target behaviour
- [ ] Stripe Connect Express account flows, if paying carers through the platform
- [ ] Ledger and reconciliation, invoices and payouts match hours and rates
- [ ] Bursary wallet feature, funding and drawdown rules, if in scope

### J2. Stafferoo quote, invoice, payment controls backlog
Cluster 1, quote to invoice pipeline
- [ ] Quotes, estimates for clients, mini proposal output
- [ ] Quote validity default 30 days
- [ ] Used components option, no warranty disclosure
- [ ] Deposit section default 30 percent, toggleable
- [ ] Quote acceptance link converts to invoice, secure one time token, idempotent
- [ ] Shared numbering, line items, terms, and draft handling with invoices

Cluster 2, payments and status controls
- [ ] Invoice payment status can be changed back to unpaid
- [ ] Manual payment entry
- [ ] Toggle showing paid and unpaid invoices
- [ ] Invoice list newest first
- [ ] Red box indicator for unpaid invoices
- [ ] Resend email send audit and error tracking

Cluster 3, client creation and Companies House enrichment
- [ ] Client dropdown with add client
- [ ] Add client opens in separate panel
- [ ] Companies House search as you type, auto populate

Cluster 4, jobs and costing
- [ ] Jobs pull into invoices
- [ ] Jobs input purchase order number on confirmation
- [ ] Send job confirmations to clients
- [ ] Jobs page sync with Google Calendar, Outlook, iCal
- [ ] Import button for calendar items
- [ ] Add costs to jobs including crew or manpower, auto generate PO number for crew

Cluster 5, outbound email accounts
- [ ] Gmail connection, send via user account
- [ ] Outlook connection, send via user account
- [ ] Generic SMTP connection
- [ ] Default sending account per org or user
- [ ] Fallback behaviour and send failure handling
- [ ] From name, reply to, signature, compliance footer
- [ ] Deliverability configuration guidance, SPF, DKIM, DMARC
- [ ] Full audit log of sends and errors

## K. Messaging and collaboration
- [ ] Chat between settings and staff only once booked together
- [ ] Notifications, email and SMS templates
- [ ] Notification preferences per user role

## L. Safeguarding and site orientation
- [ ] Settings can upload safeguarding and H and S orientation packs, mandatory for new staff
- [ ] Staff confirm they have read and understood, stored as evidence
- [ ] Staff tick DBS declaration fit and suitable for environment

## M. Admin console
- [ ] Verification queue, documents, references, DBS status
- [ ] Manual review tools for NEEDS_REVIEW outcomes
- [ ] Enforcement tools, strikes, suspensions, bans
- [ ] Disputes, hour discrepancies, audit evidence
- [ ] Feature flag toggles, controlled rollout
- [ ] Billing admin, subscription status, invoice disputes

## N. Security, privacy, and compliance
- [ ] Data minimisation, only collect what is required
- [ ] Sensitive data handling, health declarations, encryption or strict access rules
- [ ] Audit trail for all sensitive actions
- [ ] Retention schedules, especially for raw verification responses
- [ ] Secret rotation plan
- [ ] Rate limiting on public endpoints
- [ ] CSRF and session protection for admin actions
- [ ] File upload security, content type checks, malware scanning plan if needed

## O. Observability and operations
- [ ] Structured logging and correlation ids end to end
- [ ] Worker heartbeat and stale detection alert
- [ ] Queue depth monitoring
- [ ] Error dashboards by reason code
- [ ] Runbooks for common incidents, upstream outage, credential rotation, webhook failures

## P. Deployment and release management
- [ ] Staging environment matches production shape
- [ ] Migrations run safely, with rollback plan
- [ ] Feature flags default off for new clusters
- [ ] Smoke tests in staging before release
- [ ] Post release review, list of bugs, list of improvements

## Q. Backlog governance, how you prevent scope drift
- [ ] All new ideas go into a backlog list, not into the current sprint
- [ ] You approve feature clusters explicitly before any implementation starts
- [ ] Each cluster has a definition of done and explicit sign off requirement
- [ ] Keep a weekly snapshot of this checklist in the repo so you can diff progress

## R. Current next actions, what you should do now
1. Decide which cluster is approved next, choose one
2. Create an ADR in the repo capturing the final stack and boundaries, what is in scope for this codebase
3. Create the project board columns, Backlog, Approved, In progress, In review, Done
4. Start Slice 1 for the approved cluster only, migrations and contracts first

