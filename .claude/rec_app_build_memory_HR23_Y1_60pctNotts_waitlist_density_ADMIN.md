# Rec app build memory, persistent context

## Purpose
Build a regulated staffing marketplace for early years and adjacent settings, focused on short notice cover, compliant onboarding, reliable fulfilment, and strong unit economics. MVP first, production grade code, no shortcuts that create compliance or payout risk.

## Business goals
Primary business target
30,000 settings nationwide on monthly or annual subscription.

Rollout sequence
MVP, 20 settings
Nottingham, 60 settings, target is 60 percent of Nottingham settings
Then Derby, Leicester, Sheffield, Chesterfield, Lincolnshire, Northampton
Then London, Birmingham, Manchester, Liverpool
Then nationwide

Growth principle
Density before geography, do not expand to new clusters until reliability gates are met.

## Growth control mechanism, waitlist and density
Growth is controlled via a waitlist.
Onboard staff first, build verified supply density in specific postcode clusters.
Invite settings only after a cluster meets minimum supply thresholds.
Prioritise high staff density locations to protect fulfilment and service quality.
## Pricing, current model assumptions
Settings subscriptions
Pilot, £99 per month
Full, £249 per month
Annual plan option, pay 10 months equivalent per year

Marketplace hourly pricing
Charge settings, £23 per hour
Pay carers, £15.50 per hour
Gross margin per hour, £7.50 per hour

Payments fees modelling
Baseline assumption used in forecasts, 0.75 percent of total revenue
Strategy, implement Direct Debit for subscriptions in MVP
Keep card payments for one off marketplace charges, negotiate PSP rates at volume, consider second PSP only if needed

## Definitions
Setting
A buyer organisation that posts shifts and pays for cover.

Compliance, minimum for carers
Identity verification
Right to work evidence
DBS evidence and expiry tracking
Safeguarding certificate evidence and expiry tracking
Any other mandatory certificates defined by policy

Compliance, minimum for settings
Verified organisation details
Ofsted URN capture where applicable
Billing active, Direct Debit for subscriptions preferred
Policy acknowledgement

## Safe growth guardrails, required product controls
Core metrics
Fill rate, shifts filled divided by shifts posted
Time to fill, median and p90
Late cancellations, carer and setting
No show rate
Compliance pass rate, active carers with all mandatory docs valid
Dispute rate, disputes per 1,000 shifts
Gross margin per hour

City or cluster expansion gates, must be true for last 28 days
Fill rate, 90 percent plus for urgent shifts
No show rate, under 1 percent
Late cancellation rate, under 3 percent
Compliance pass rate, 98 percent plus for active carers
Dispute rate, under 0.5 percent of shifts

If any gate fails, pause expansion and fix reliability and quality.

## Safe growth build slices, ship behind feature flags
SG1 Compliance enforcement rails
Mandatory docs rules, expiry reminders, auto suspension, full audit log, admin override with reason

SG2 Payments safety and cash flow controls
Direct Debit subscriptions in MVP
Card for marketplace one off charges
Webhook idempotency and retries
Payout safety with optional rolling reserve
Dispute and refund workflow with audit trail

SG3 Reliability scoring and ranking
Scores for carers and settings, based on attendance, cancellations, punctuality, ratings
Matching ranks by reliability and proximity

SG4 Cancellation policy engine
Configurable windows and penalties, both sides
Penalty waivers require admin action and logged reason

SG5 Staged activation and throttles
Setting activation states, pending, verified, active
Booking caps for new settings
City and postcode cluster feature flags, allowlist expansion only

SG6 Supply density planner
Coverage metrics by postcode cluster, minimum supply thresholds
Warnings when below coverage

SG7 Quality and incident workflow
Shift linked incident reporting, severity levels, escalation checklist
Auto suspension for severe incidents, audit ready records

## Engineering standards, non negotiable
Production grade only, no MVP shortcuts that break security or compliance.
TypeScript strict typing, robust error handling, Zod validation for inputs.
Small PR sized slices, each slice has acceptance criteria and tests.
Decision gates for each slice, design, implementation, pre deploy, release.
Observability is first class, structured logs, metrics for guardrails, audit logs for sensitive actions.
Feature flags by default for risky or growth affecting functionality.
Webhook processing must be idempotent.
No silent failures, standardised error taxonomy.

## Infra and profitability strategy
Start with managed infra, optimise cost by architecture and usage, not by moving to unmanaged servers.
After around 18 months, focus on infra optimisation, right sizing, caching, queueing, log sampling, storage lifecycle.
Payments, reduce blended fees by shifting subscriptions to Direct Debit, negotiate PSP rates at real volume, add second PSP only if Stripe does not meet target rate.

## Forecast headline intent
Five year model aims to support national scale, with settings ramping to 30,000 by Year 5.
Model outputs should always separate subscription revenue from hourly revenue, and separate payment fees by rail when Direct Debit is implemented.

## Data and market sizing approach
Base regulated childcare providers from Ofsted datasets.
Expand addressable settings with DfE GIAS schools and colleges datasets.
Add wraparound, holiday clubs, leisure and hospitality childcare like employers via public directories and business listings, de duplicate with URN, provider id, and name plus postcode.

## Admin dashboard, cluster rollout and density control
Admin must have a Coverage and rollout dashboard that tracks postcode clusters and automatically flags supply and demand density.

Cluster leaderboard, one row per cluster
Demand metrics
Waitlisted settings count
Active settings count
Projected monthly hours
New settings signups last 7 days

Supply metrics
Verified carers in cluster
Active carers last 14 days
Available carers next 48 hours
Carers onboarding in progress
Carer churn last 30 days

Quality and risk metrics
Fill rate last 28 days
Median time to fill last 28 days
No show rate last 28 days
Late cancellations last 28 days, carers and settings
Disputes per 1,000 shifts
Average rating

Decision outputs
Cluster status, planned, recruiting, live, paused
Coverage score, 0 to 100
Flag state, green, amber, red
Recommended action text

Automatic flag logic, must be explicit and testable
Coverage ratio uses available carers next 48 hours divided by expected shifts next 48 hours
Density score combines carers per setting, availability, fill rate, time to fill, cancellations, disputes
Flag thresholds
Green score 75 plus and all guardrails pass
Amber score 50 to 74 or one guardrail near limit
Red score under 50 or any guardrail fails

Go live gate
Cluster cannot be made live unless minimum supply thresholds are met
Admin override allowed only with a mandatory reason, all overrides are audit logged

Auto pause rule
If a live cluster breaches guardrails for 7 days, automatically pause the cluster and stop new shift postings in that cluster

Data model requirements
postcode_clusters
postcode_cluster_members
cluster_metrics materialised metrics updated by scheduled job
cluster_alerts for system generated flags
audit_log for all sensitive actions including overrides

Metrics computation
Do not compute live in the admin page
Use a scheduled job every 5 minutes for counts, availability, expected shifts, coverage score, flag state, alert generation
Use nightly aggregation for 28 day rates and percentiles
