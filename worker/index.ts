/**
 * Stafferoo background job worker.
 *
 * Polls the `jobs` table every 5 seconds, claims one job atomically,
 * dispatches it to the appropriate handler, and marks it completed or failed.
 *
 * Run with:
 *   npm run worker
 *
 * Requires Node >= 20.6 (for --env-file support).
 * Reads .env.local for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { type SupabaseClient } from '@supabase/supabase-js';
import { createWorkerAdminClient } from './lib/db';
import { claimNextJob, type JobRow } from './lib/claim-job';
import { handleReferenceRequestEmail } from './handlers/reference-request-email';

const POLL_INTERVAL_MS = 5_000;

// ---------------------------------------------------------------------------
// Job dispatcher — register new job types here
// ---------------------------------------------------------------------------

type JobHandler = (db: SupabaseClient, payload: Record<string, unknown>) => Promise<void>;

const HANDLERS: Record<string, JobHandler> = {
  reference_request_email: handleReferenceRequestEmail,
};

// ---------------------------------------------------------------------------
// Execute one job — marks completed or failed in DB
// ---------------------------------------------------------------------------

async function executeJob(db: SupabaseClient, job: JobRow): Promise<void> {
  const handler = HANDLERS[job.type];

  if (!handler) {
    // Unknown type — fail permanently (no retry point in retrying an unknown type)
    await db.from('jobs').update({
      status:     'failed',
      failed_at:  new Date().toISOString(),
      last_error: `Unknown job type: ${job.type}`,
      updated_at: new Date().toISOString(),
    }).eq('id', job.id);

    console.error('[worker] unknown job type — marked failed permanently', {
      event:  'worker.job.unknown_type',
      jobId:  job.id,
      type:   job.type,
    });
    return;
  }

  try {
    await handler(db, job.payload);

    await db.from('jobs').update({
      status:       'completed',
      completed_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    }).eq('id', job.id);

    console.log('[worker] job completed', {
      event:    'worker.job.completed',
      jobId:    job.id,
      type:     job.type,
      attempts: job.attempts,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isPermanentFailure = job.attempts >= job.max_attempts;

    await db.from('jobs').update({
      status:     'failed',
      failed_at:  new Date().toISOString(),
      last_error: message,
      updated_at: new Date().toISOString(),
    }).eq('id', job.id);

    console.error('[worker] job failed', {
      event:     'worker.job.failed',
      jobId:     job.id,
      type:      job.type,
      attempts:  job.attempts,
      maxAttempts: job.max_attempts,
      permanent: isPermanentFailure,
      error:     message,
    });
  }
}

// ---------------------------------------------------------------------------
// One poll tick — claim and execute at most one job per tick
// ---------------------------------------------------------------------------

async function tick(db: SupabaseClient): Promise<void> {
  const job = await claimNextJob(db);
  if (!job) return; // nothing pending

  console.log('[worker] job claimed', {
    event:    'worker.job.claimed',
    jobId:    job.id,
    type:     job.type,
    attempts: job.attempts,
  });

  await executeJob(db, job);
}

// ---------------------------------------------------------------------------
// Main — poll loop with graceful shutdown
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('[worker] starting', {
    event: 'worker.start',
    pid:   process.pid,
    pollIntervalMs: POLL_INTERVAL_MS,
  });

  const db = createWorkerAdminClient(); // throws early if env vars missing

  let isShuttingDown = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function poll(): Promise<void> {
    if (isShuttingDown) return;

    try {
      await tick(db);
    } catch (err) {
      console.error('[worker] poll error', {
        event: 'worker.poll.error',
        error: err instanceof Error ? err.message : String(err),
      });
    }

    if (!isShuttingDown) {
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }
  }

  function shutdown(signal: string): void {
    if (isShuttingDown) return;
    isShuttingDown = true;

    if (timer) clearTimeout(timer);

    console.log('[worker] shutting down', { event: 'worker.shutdown', signal });

    // Give any in-flight DB write up to 2 seconds to complete before exiting.
    setTimeout(() => {
      console.log('[worker] exit', { event: 'worker.exit' });
      process.exit(0);
    }, 2_000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // Start polling immediately
  await poll();
}

main().catch((err) => {
  console.error('[worker] fatal error — exiting', {
    event: 'worker.fatal',
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
