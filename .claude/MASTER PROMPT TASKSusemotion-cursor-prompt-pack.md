# Stafferoo, Cursor build prompt pack for full stack delivery
Last updated: 2026-02-18

Purpose
This document is designed to be uploaded into UseMotion and used as the single prompt source for Cursor.
It contains the prompts you paste into Cursor, one at a time, to build Stafferoo in small, test backed slices.

Operating rules for Cursor
1. Work in very small slices, maximum one clear feature per slice.
2. Before writing code, produce an implementation plan, acceptance criteria, and threat model.
3. Every API must be contract first, define request and response schemas and error codes.
4. TypeScript strict, Zod validation for all inputs, robust error handling.
5. Feature flags by default for all new capabilities.
6. Observability first, structured logs, audit events, correlation ids.
7. Database is Postgres, all schema changes via migrations only.
8. Do not introduce unnecessary dependencies.
9. No silent failures, no best effort success, never treat upstream errors as valid.
10. Definition of done requires lint, typecheck, build, and tests passing.

How to use this pack
1. Paste Prompt 0 first to get Cursor aligned.
2. Then paste each prompt in order.
3. After each slice, run the exact commands in the prompt and review git diff.
4. Do not start the next slice until the previous slice meets definition of done.

Prompt 0, global system brief for Cursor
Paste this in Cursor and keep it pinned.

You are a senior full stack engineer and web app UX and UI expert building Stafferoo.
You work with expert level Next.js App Router, TypeScript strict, Postgres, and server side background workers.
You always use Zod validation, robust error handling, feature flags by default, and observability first practices.
You implement in small slices with tests and gates.
You do not use browser automation for verification tasks.
You produce production grade code and do not miss usability details.
You keep UI clean, fast, accessible, and consistent.
You implement role based access control and multi tenancy.
You provide clear runbooks and documentation.
You never invent requirements, you ask to confirm only if absolutely required, otherwise make the safest assumption and document it.

Project baseline architecture, do not change
1. Next.js App Router
2. TypeScript strict
3. Postgres with migrations
4. Background jobs table plus Node worker process
5. Zod validation for all inputs
6. Feature flags by default
7. Observability first, structured logs and audit events
8. Email sending uses Resend for invoices
9. Future option, sync Gmail, Outlook, SMTP for invoice sending

UX and UI standards to follow
1. Mobile first, fast, minimal steps
2. Clear progress and status for onboarding and verification
3. Accessibility, WCAG aware, focus states, keyboard support
4. Always show users what is happening, and what to do next
5. Errors are actionable, never cryptic
6. Forms use inline validation, helpful field copy, and sensible defaults
7. Audit and compliance actions are visible to admins and private to carers

Prompt 1, create architecture decision records and project docs
Goal
Add documentation that locks the stack and build rules so there is no drift.

Tasks
1. Create docs folder with ADR template.
2. Add ADR 0001, Stafferoo architecture baseline, including the stack list above.
3. Add ADR 0002, background jobs and worker pattern.
4. Add a repo level PR checklist file that enforces gates.
5. Ensure docs include local setup, worker run instructions, and environment variable list placeholders.

Acceptance criteria
1. ADRs exist, are clear, and match the baseline architecture.
2. Docs include exact commands for running web app and worker.
3. No build breaks.

Run
npm run lint
npm run typecheck
npm run build

Prompt 2, implement feature flag system
Goal
Add a simple feature flag system so every feature can be gated.

Tasks
1. Add feature_flags table and migration, keyed by flag name with enabled boolean and optional JSON config.
2. Add a server side helper that reads flags with caching.
3. Add an admin only UI page to view and toggle flags.
4. Add audit events for flag changes.

Acceptance criteria
1. Flags can be toggled by admin only.
2. Audit event created for each toggle.
3. UI is clean and safe, no accidental toggles, confirm step.

Run
npm run lint
npm run typecheck
npm run test
npm run build

Prompt 3, implement audit events infrastructure
Goal
Create audit_events table, structured audit logger, and correlation ids.

Tasks
1. Add audit_events table and migration.
2. Create audit logger utility with event types and payload schema.
3. Add middleware that creates correlation id for each request and propagates it.
4. Ensure logs are structured JSON and exclude sensitive data.

Acceptance criteria
1. Audit events are recorded for at least user sign in, feature flag toggle, and admin actions.
2. Correlation id appears in logs and audit events.

Run
npm run lint
npm run typecheck
npm run test
npm run build

Prompt 4, implement auth and RBAC skeleton
Goal
Add auth and role enforcement.

Tasks
1. Implement auth provider integration currently used in the repo.
2. Define roles, admin, setting, carer.
3. Add organisation tenancy model, settings belong to organisations.
4. Add middleware and server helpers for access checks.
5. Add tests for access control.

Acceptance criteria
1. Unauthorised users cannot access admin routes.
2. Tenancy enforced, settings cannot see other settings.
3. Carers can only see their own profile.

Run
npm run lint
npm run typecheck
npm run test
npm run build

Prompt 5, implement background jobs table and worker framework
Goal
Create the jobs table, locking, retries, and a worker process that can run locally and in staging.

Tasks
1. Add jobs table migration with fields, type, payload JSON, run_after, attempts, max_attempts, status, locked_at, locked_by, last_error.
2. Add worker_heartbeats table migration.
3. Implement worker process:
   1. Poll pending jobs
   2. Claim with atomic update lock
   3. Dispatch by job type
   4. Retry with exponential backoff
   5. Lock sweeper for stale locks
   6. Heartbeat update loop
4. Add structured logs and audit events for job lifecycle.

Acceptance criteria
1. Worker can process a dummy job end to end.
2. Retry and backoff works.
3. Stale locks are recovered.
4. Heartbeat is updated and can be monitored.

Run
npm run lint
npm run typecheck
npm run test
npm run build
npm run worker

Prompt 6, carer onboarding data model and UI skeleton
Goal
Create the onboarding flow skeleton and core tables.

Tasks
1. Add carers table and carer profile fields used by onboarding.
2. Add carer_documents table and file metadata.
3. Add carer_verifications summary table that stores the current verification state and reasons.
4. Build onboarding UI with steps:
   1. Personal details
   2. Identity and right to work
   3. DBS details and consent
   4. Qualifications and training
   5. References
   6. Review and submit
5. Add server actions and API routes with Zod validation.
6. Add inline validation and progress UI.

Acceptance criteria
1. Onboarding steps save draft progress.
2. Users can resume where they left off.
3. Admin can see a queue of submitted onboarding packs.
4. No sensitive data is exposed in logs.

Run
npm run lint
npm run typecheck
npm run test
npm run build

Prompt 7, implement references workflow
Goal
Carer can request references and a referee can submit securely.

Tasks
1. Add reference_requests table, token, expiry, status.
2. Add reference_submissions table, responses, created_at.
3. Build referee public form with one time token and expiry checks.
4. Add admin view of references with evidence.

Acceptance criteria
1. Tokens are one time use and expire.
2. Referee can submit without creating an account.
3. Admin can review, approve, and store outcome with audit events.

Run
npm run lint
npm run typecheck
npm run test
npm run build

Prompt 8, implement DBS Update Service verification feature, end to end
Goal
Add the official multiple status check based verification flow.
Do not use any browser automation.

Inputs
Use the plan in the file a.md stored in the repo and follow it exactly.

Tasks
1. Add dbs details table and required fields.
2. Add dbs verification jobs and results tables, or map them into the generic jobs table if you prefer, but keep the same semantics.
3. Implement API route:
   POST /api/carers/{carerId}/dbs
   Validate with Zod, enforce consent, enqueue job with idempotency.
4. Implement status route:
   GET /api/carers/{carerId}/dbs/status
5. Implement worker handler for DBS check job:
   1. Construct request to DBS multiple status check endpoint per official guide
   2. Timeout, parse XML, map to outcome
   3. Persist results and audit events
   4. Retry transient errors, never convert errors into valid
6. Add admin UI to view DBS check history and manual recheck button.
7. Add retention purge job if storing raw responses.

Acceptance criteria
1. Outcome mapping is correct, VALID only when upstream says no new info.
2. On mismatch, rejection, or upstream outage, outcome is NEEDS_REVIEW.
3. Idempotency prevents duplicate jobs.
4. Unit tests for parser and mapping.
5. Integration tests for worker with mocked upstream XML.

Run
npm run lint
npm run typecheck
npm run test
npm run build
npm run worker

Prompt 9, setting onboarding and subscription skeleton
Goal
Create setting accounts, profiles, and subscription selection.

Tasks
1. Add settings table and profile fields.
2. Add subscription tables and tiers, monthly and annual.
3. Implement billing alignment rule, pro rata now, align renewal to the 28th.
4. Build UI:
   1. Setting sign up
   2. Profile completion
   3. Choose plan
   4. Payment and confirmation
5. Add admin tools to manage subscription states.

Acceptance criteria
1. Access control correct.
2. Subscription status gates ability to post job requests.
3. Clear UX and receipts.

Run
npm run lint
npm run typecheck
npm run test
npm run build

Prompt 10, job requests and placements MVP
Goal
Settings can create job requests and carers can be assigned.

Tasks
1. Add job_requests table.
2. Add placements table linking carers to job requests.
3. Build UI for settings to create, view, and manage job requests.
4. Build carer view for upcoming placements.
5. Add cancellation and status transitions.

Acceptance criteria
1. Data model supports multiple staff per day and recurring bookings.
2. Status transitions are validated server side.
3. Audit events recorded for create, update, cancel.

Run
npm run lint
npm run typecheck
npm run test
npm run build

Prompt 11, timekeeping, check in and check out
Goal
Record actual hours worked.

Tasks
1. Add shift_timekeeping table, check in time, check out time, confirmation states.
2. Build carer UI for check in and check out.
3. Build setting UI to confirm hours and flag discrepancies.
4. Add dispute status and admin escalation.

Acceptance criteria
1. Cannot check out before check in.
2. Setting confirmation required before pay run.
3. Audit events and logs show a clear timeline.

Run
npm run lint
npm run typecheck
npm run test
npm run build

Prompt 12, payments and invoicing for childcare staffing model
Goal
Implement weekly pay and setting invoices at MVP level.

Tasks
1. Add invoice tables, line items, status.
2. Create pay run job type in worker.
3. Generate setting invoices from confirmed hours.
4. If using Stripe Connect, implement payout flow, otherwise record manual payment state.
5. Build UI for invoices, payment status, and discrepancy workflow.

Acceptance criteria
1. Invoices match confirmed hours and agreed rates.
2. No invoice can be marked paid without an audit event.
3. Pay run is idempotent.

Run
npm run lint
npm run typecheck
npm run test
npm run build
npm run worker

Prompt 13, Stafferoo quotes and invoice system feature clusters
This is a separate cluster set, implement only if in scope for this codebase.

Cluster A, quotes
Tasks
1. Add quotes table, quote_line_items, validity default 30 days.
2. Add deposit terms default 30 percent with toggle.
3. Add used components option with no warranty disclosure.
4. Generate acceptance link that converts to invoice, one time token, idempotent.

Acceptance criteria
1. Quote acceptance creates invoice exactly once.
2. Quote and invoice numbers are consistent and unique.
3. Terms are clearly displayed and saved.

Cluster B, invoice controls
Tasks
1. Allow payment status to be set back to unpaid.
2. Manual payment entry with audit.
3. Toggle showing paid and unpaid invoices.
4. Default sorting newest first.
5. Unpaid indicator in list.

Cluster C, client creation and Companies House
Tasks
1. Add client dropdown with add client panel.
2. Companies House search as you type and auto populate fields.

Cluster D, jobs and costing
Tasks
1. Jobs pull into invoices.
2. Jobs purchase order number on confirmation.
3. Job confirmations to clients.
4. Calendar sync, Google Calendar, Outlook, iCal.
5. Add costs including crew, auto generate PO number for crew.

Cluster E, outbound email accounts
Tasks
1. Gmail, Outlook, SMTP sending accounts.
2. Default sending account selection.
3. Fallback and failure handling.
4. Deliverability guidance, SPF, DKIM, DMARC.
5. Full send audit and error reporting.

Prompt 14, messaging and notifications
Goal
Implement notifications and messaging with strict access rules.

Tasks
1. Messaging is available only after a booking relationship exists.
2. Add notification system, email and SMS templates if needed.
3. Notification preferences.

Acceptance criteria
1. No user can message another user without a valid booking link.
2. All message events audited.

Run
npm run lint
npm run typecheck
npm run test
npm run build

Prompt 15, admin console completeness
Goal
Finish admin tooling so operations can run.

Tasks
1. Verification queue across documents, references, DBS checks.
2. Manual review flow and outcomes.
3. Enforcement tools, strikes, suspensions, bans.
4. Disputes management.
5. Feature flag management.
6. Billing admin tools.

Acceptance criteria
1. Admin can resolve every NEEDS_REVIEW state without database edits.
2. Audit events exist for all admin actions.
3. Clear UI and search and filters.

Run
npm run lint
npm run typecheck
npm run test
npm run build

Prompt 16, security hardening and privacy
Goal
Final security pass.

Tasks
1. Confirm no sensitive data in logs.
2. Rate limit public endpoints.
3. CSRF protection for state changing admin actions.
4. File upload security, mime type checks, scanning plan.
5. Retention jobs for sensitive raw data.
6. Secret rotation runbook.

Acceptance criteria
1. Security checklist passes.
2. Abuse cases have automated tests where possible.

Run
npm run lint
npm run typecheck
npm run test
npm run build

Prompt 17, performance and UX polish
Goal
Finish UX to modern usability standards.

Tasks
1. Reduce onboarding friction, autosave, helpful defaults.
2. Loading states, empty states, error states are designed.
3. Accessibility checks, keyboard navigation, contrast.
4. Mobile layout polish.
5. Speed measurement and optimisation.

Acceptance criteria
1. Lighthouse scores meet targets recorded in the repo.
2. No major accessibility issues.
3. Core pages feel fast.

Run
npm run lint
npm run typecheck
npm run test
npm run build

Prompt 18, release readiness
Goal
Production release.

Tasks
1. Staging smoke tests.
2. Monitoring dashboards set up.
3. Incident runbooks written.
4. Feature flags ready for gradual rollout.
5. Backups and restore drill.
6. Post release review checklist.

Acceptance criteria
1. Release checklist completed and committed in docs.
2. Rollback plan tested.
3. Go live decision recorded.

End of prompt pack
