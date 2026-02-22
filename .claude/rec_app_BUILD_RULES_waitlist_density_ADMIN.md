# Rec app engineering build rules and gates

## Objective
Ship production grade functionality in small slices with strict quality gates, so the platform scales safely in a regulated environment.

## Non negotiable standards
TypeScript strict must be enabled and passing.
All inputs validated with Zod at API boundaries.
Errors must be handled, no silent failures.
Standardised error taxonomy, every API returns consistent error shapes.
Logging is structured, no sensitive data in logs.
Audit log required for all sensitive actions, especially compliance and payouts.
Feature flags by default for risky, growth affecting, or policy sensitive functionality.
Webhook handlers must be idempotent, retry safe, and concurrency safe.
Security checks are mandatory, least privilege, secrets never committed, secure defaults.

## Development workflow
Work in small PR sized slices.
Each slice has acceptance criteria and definition of done.
Every slice includes tests, at minimum unit tests for pure logic and integration tests for API flows.
No scope creep, backlog anything extra.
Use a builder plus reviewer approach, reviewer must be critical and block unsafe changes.

## Decision gates per slice
### Design gate
Define user stories and acceptance criteria.
Define data contracts, schemas, and migrations.
Lightweight threat model for the slice, identify abuse cases and mitigations.
Define observability requirements, logs, metrics, and audit events.
Define rollout plan and feature flag behaviour.

### Implementation gate
Code compiles with TypeScript strict.
Lint and formatting pass.
All new APIs have Zod validation and consistent error handling.
All new data changes have migrations and rollback notes.
Feature flags added where required.
Audit logs emitted for sensitive actions.

### Pre deploy gate
Run unit tests and integration tests.
Run build.
Run a basic security scan, dependency audit, secrets scan.
Test webhook idempotency paths.
Verify performance on key flows, booking search, matching, checkout, payout.

### Release gate
Feature flag on for internal users first.
Monitor error rates, latency, and guardrail metrics.
If guardrail metrics degrade, roll back by disabling feature flags.
Post release review within 7 days, capture lessons and update playbooks.

## Safe growth guardrails, required instrumentation
Expose these metrics in admin dashboards and logs.
Fill rate.
Time to fill, median and p90.
Late cancellations, carers and settings.
No show rate.
Compliance pass rate for active carers.
Dispute rate per 1,000 shifts.
Gross margin per hour.

## Growth rollout gates
Waitlist control is mandatory. Supply is onboarded first. Settings are invited only when postcode clusters meet minimum supply density thresholds.
Do not expand to a new city or postcode cluster unless all are true for the last 28 days.
Fill rate 90 percent plus for urgent shifts.
No show rate under 1 percent.
Late cancellation rate under 3 percent.
Compliance pass rate 98 percent plus for active carers.
Dispute rate under 0.5 percent of shifts.

## Payment and compliance safeguards
Subscriptions should default to Direct Debit in MVP.
Cards are acceptable for one off marketplace charges.
Payouts must support reserves and dispute holds, with a full audit trail.
Compliance expiries must auto notify and auto suspend when mandatory items lapse.
Admins can override only with reason, overrides are logged.

## Definition of done, global
User visible feature works end to end.
All acceptance criteria met.
Tests pass.
Lint and build pass.
No new high severity security findings.
Observability added, logs, metrics, audit trail.
Feature flags and rollback plan in place.
Documentation updated.

## Admin rollout dashboard requirements
Admin must have a postcode cluster coverage dashboard backed by materialised metrics.
The dashboard must auto flag clusters green, amber, red using explicit scoring logic.
All go live and override actions must be audit logged with mandatory reason.
A scheduled job must compute cluster_metrics and cluster_alerts, not the UI.

Minimum fields in cluster_metrics
waitlisted_settings_count
active_settings_count
verified_carers_count
active_carers_14d_count
available_carers_48h_count
projected_monthly_hours
expected_shifts_48h
fill_rate_28d
median_time_to_fill_28d
no_show_rate_28d
late_cancel_rate_28d
disputes_per_1000_28d
coverage_score
flag_state
updated_at

Auto pause safeguard
If a live cluster breaches guardrails for 7 days, auto pause the cluster and block new shift postings for that cluster.
