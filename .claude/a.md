# DBS Update Service verification, production implementation plan

## Goal
Build a resilient DBS Update Service verification capability inside Stafferoo that can be used by onboarding automation.

The system must cross check the submitted DBS details, call the official multiple status check endpoint, and return an outcome that onboarding can rely on.

## Non negotiables
1. No browser automation, no agent clicking around the website.
2. Verification runs asynchronously via a queue and worker, not inside a user request.
3. Failed checks must never be treated as valid.
4. All inputs validated with Zod.
5. Full audit trail, plus a manual review path.

## Architecture overview
### Components
1. Next.js API routes
   1. Capture DBS details and explicit consent.
   2. Enqueue a verification job with idempotency.
   3. Expose verification status for onboarding and admin views.
2. Verification worker
   1. Polls a jobs table.
   2. Claims jobs with locking.
   3. Calls DBS multiple status check endpoint.
   4. Parses XML response and maps to outcomes.
   5. Persists results and audit events.
   6. Retries transient failures with backoff.
3. Database tables
   1. Carer DBS details and consent capture record.
   2. Verification jobs queue.
   3. Verification results history.
   4. Audit event log.
4. Observability
   1. Structured logs with correlation ids.
   2. Metrics, queue depth, latency, failures.
   3. Alerting on sustained failures and worker heartbeat.

## Data contracts
### Inputs to collect
1. DBS certificate number.
2. Applicant surname as shown on the certificate.
3. Applicant date of birth as shown on the certificate.
4. Any organisation identity values required by the DBS endpoint for multiple status checks, for example organisation name, checker employee forename and surname.
5. Explicit consent flag, captured and stored with timestamp and actor.

If you also collect an Update Service number, treat it as supplemental data unless the endpoint requires it.

### Output contract
Use a strict typed outcome and reason code.

1. Outcome values
   1. VALID
   2. INVALID
   3. NEEDS_REVIEW
2. Reason codes examples
   1. BLANK_NO_NEW_INFO
   2. NON_BLANK_NO_NEW_INFO
   3. NEW_INFO
   4. MISMATCH
   5. CONSENT_MISSING
   6. ENDPOINT_REJECTED
   7. TIMEOUT
   8. TRANSIENT_UPSTREAM
   9. PARSE_ERROR
   10. UNEXPECTED_RESPONSE

Mapping rules
1. BLANK_NO_NEW_INFO maps to VALID.
2. NON_BLANK_NO_NEW_INFO maps to VALID.
3. NEW_INFO maps to INVALID.
4. Anything else maps to NEEDS_REVIEW.

## Database schema
Use explicit tables and constraints.

### carers
1. id uuid primary key
2. first_name text
3. last_name text
4. dob date
5. created_at timestamptz
6. updated_at timestamptz

### carer_dbs_details
1. carer_id uuid primary key, foreign key to carers
2. certificate_number text, not null
3. surname_on_certificate text, not null
4. dob_on_certificate date, not null
5. update_service_number text, nullable
6. consent_captured_at timestamptz, not null
7. consent_captured_by_user_id uuid, nullable
8. consent_ip inet, nullable
9. created_at timestamptz
10. updated_at timestamptz

### dbs_verification_jobs
1. id uuid primary key
2. carer_id uuid, not null
3. idempotency_key text, not null, unique
4. status text, not null, values PENDING, RUNNING, SUCCEEDED, FAILED
5. attempts int, not null, default 0
6. max_attempts int, not null, default 5
7. run_after timestamptz, not null, default now()
8. locked_at timestamptz, nullable
9. locked_by text, nullable
10. last_error_code text, nullable
11. last_error_message text, nullable
12. created_at timestamptz
13. updated_at timestamptz

### dbs_verification_results
1. id uuid primary key
2. job_id uuid, not null
3. carer_id uuid, not null
4. outcome text, not null
5. reason_code text, not null
6. checked_at timestamptz, not null
7. upstream_status text, nullable
8. upstream_raw_encrypted bytea, nullable
9. upstream_response_hash text, not null
10. input_hash text, not null
11. correlation_id text, not null
12. created_at timestamptz

### audit_events
1. id uuid primary key
2. actor_type text, not null, values SYSTEM, ADMIN, USER
3. actor_id uuid, nullable
4. event_type text, not null
5. entity_type text, not null
6. entity_id uuid, not null
7. correlation_id text, not null
8. payload_json jsonb, not null
9. created_at timestamptz, not null

### Indexes
1. dbs_verification_jobs index on status and run_after
2. dbs_verification_results index on carer_id and checked_at descending
3. audit_events index on entity_type, entity_id, created_at descending

### Retention
1. Store outcome and hashes long term for audit traceability.
2. Store encrypted raw upstream responses only if required, and purge after a defined retention period, for example 90 days.

## Next.js API routes
### POST, submit DBS details and enqueue job
Endpoint
1. POST /api/carers/{carerId}/dbs

Request body fields
1. certificateNumber
2. surnameOnCertificate
3. dobOnCertificate, ISO date string
4. updateServiceNumber, optional
5. consent, must be true

Server behaviour
1. Validate request with Zod.
2. Enforce consent is true, otherwise return 400 and do not enqueue.
3. Upsert carer_dbs_details.
4. Create idempotency key based on carerId, certificateNumber, surnameOnCertificate, dobOnCertificate.
5. Insert dbs_verification_jobs if not exists for that idempotency key, otherwise return existing job.
6. Return job id and current status.

Response body
1. jobId
2. jobStatus
3. latestOutcome, optional
4. lastCheckedAt, optional

### GET, fetch verification status
Endpoint
1. GET /api/carers/{carerId}/dbs/status

Response body
1. latestOutcome
2. reasonCode
3. checkedAt
4. jobStatus
5. lastErrorCode, optional
6. lastErrorMessage, optional
7. nextAction text, for example Request new DBS, Manual review, None

### POST, admin recheck
Endpoint
1. POST /api/admin/carers/{carerId}/dbs/recheck

Behaviour
1. Require admin authorisation.
2. Enqueue a new job with a fresh idempotency key that includes a timestamp or counter.
3. Return new job id.

## Worker design
### Deployment options
1. Dedicated Node worker process deployed as a separate service.
2. Scheduled function running every minute that claims and processes a batch of jobs.

### Core worker loop
1. Poll for jobs where status is PENDING and run_after is in the past.
2. Claim jobs using an atomic update with lock fields.
3. For each job
   1. Load carer_dbs_details.
   2. Validate required fields exist.
   3. Compute input_hash.
   4. Call DBS endpoint with a strict timeout, for example 15 seconds.
   5. Parse XML response.
   6. Map upstream status to outcome and reason_code.
   7. Encrypt raw response if stored.
   8. Insert dbs_verification_results and audit_events.
   9. Mark job SUCCEEDED.
4. Errors
   1. Transient errors, timeout, network, 5xx
      1. attempts plus one
      2. if attempts less than max_attempts, set status PENDING and run_after to now plus backoff
      3. else set status FAILED and store NEEDS_REVIEW result with TRANSIENT_UPSTREAM
   2. Permanent errors, consent missing, required data missing, mismatch
      1. set job FAILED
      2. store NEEDS_REVIEW result with specific reason code
5. Lock sweeper
   1. If a job is RUNNING and locked_at older than a threshold, for example 10 minutes, reset to PENDING, increment attempts, record audit event.

### Concurrency and rate limiting
1. Start with low concurrency, for example 3 to 5 parallel checks.
2. Apply a hard per minute rate limit to avoid upstream protections and lockouts.

## Security
1. Store endpoint credentials only in environment variables.
2. Never log certificate number or date of birth in plaintext.
3. Use correlation ids for tracing across API route and worker.
4. Encrypt raw upstream responses at rest if stored.
5. Maintain append only audit_events for tamper resistance.

## Tests
### Unit tests
1. Zod validation for API request body.
2. XML parsing for each upstream status and error response.
3. Mapping rules from upstream status to outcome and reason code.
4. Retry classifier, transient vs permanent.
5. Idempotency key stability and queue dedupe.

### Integration tests
1. Insert a pending job, run worker against a mocked HTTP endpoint returning XML, assert results persisted.
2. Simulate timeout, verify retries and run_after backoff.
3. Simulate mismatch rejection, verify FAILED job and NEEDS_REVIEW result.
4. Simulate abandoned lock, verify sweeper resets and retries.

### End to end staging smoke test
1. Submit DBS details with consent.
2. Confirm job created.
3. Confirm worker processes.
4. Confirm status appears in admin UI and onboarding automation uses the outcome correctly.

## Observability
1. Structured logs fields
   1. correlation_id
   2. job_id
   3. carer_id
   4. event
   5. duration_ms
   6. outcome
   7. reason_code
   8. attempts
2. Metrics
   1. total checks by outcome
   2. failures by reason code
   3. latency
   4. queue depth
3. Alerts
   1. sustained failure rate above threshold
   2. queue depth above threshold
   3. worker heartbeat stale

## Feature flags and rollout
Feature flags
1. dbs_verification_enabled
2. dbs_store_raw_response_enabled
3. dbs_auto_block_on_invalid_enabled

Rollout steps
1. Deploy with verification disabled by default.
2. Enable for internal staff testing.
3. Enable for a small percentage of onboarding flows.
4. Monitor mismatch and error rates.
5. Enable for all carers.
6. Enable auto blocking once outcomes are stable.

## Implementation slices with definition of done
### Slice 1, schema and migrations
Done when
1. All tables, constraints, and indexes exist.
2. Migrations apply cleanly locally and in staging.

### Slice 2, API submit and enqueue
Done when
1. Zod validation and consent enforcement complete.
2. Idempotent job enqueue works.
3. Unit tests pass.

### Slice 3, worker skeleton and job claiming
Done when
1. Worker can claim jobs safely.
2. Locking and sweeper logic implemented.
3. Integration test for claim and complete passes.

### Slice 4, endpoint client and XML parser
Done when
1. HTTP client has strict timeouts.
2. XML parsing robust to expected shapes.
3. Mapping rules implemented.
4. Unit tests cover all mappings.

### Slice 5, persistence and status endpoint
Done when
1. Results persisted correctly.
2. GET status returns latest outcome and next action.
3. Admin UI can show the status.

### Slice 6, audit and observability
Done when
1. audit_events written for started, completed, failed.
2. Logs are structured and exclude sensitive values.
3. Metrics and heartbeat available.

### Slice 7, admin recheck and manual review workflow
Done when
1. Admin can trigger recheck.
2. NEEDS_REVIEW shows clear next actions and internal notes.
3. Access control verified.

### Slice 8, retention and hardening
Done when
1. Raw response retention purge job exists and is tested.
2. Secrets are validated on startup.
3. No sensitive data appears in logs.

