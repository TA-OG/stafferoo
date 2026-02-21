/**
 * Background jobs helper.
 *
 * Jobs are stored in the `jobs` table and picked up by a Node worker process.
 * This module provides typed helpers to enqueue jobs.
 *
 * The jobs table is created in migration 0014.
 *
 * Job types:
 *   reference_request_email — sends a referee invitation email
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Job type catalogue
// ---------------------------------------------------------------------------

export interface ReferenceRequestEmailPayload {
  referenceRequestId: string;
  applicantName: string;
  refereeFirstName: string;
  refereeName: string;
  refereeEmail: string;
  referenceLink: string;
  expiresAt: string; // ISO string
}

export type JobPayload =
  | { type: 'reference_request_email'; data: ReferenceRequestEmailPayload };

// ---------------------------------------------------------------------------
// Enqueue
// ---------------------------------------------------------------------------

/**
 * Insert a job record into the jobs table.
 * Returns the job id on success or throws.
 *
 * Uses the caller's Supabase client — the jobs table uses a service-role insert
 * policy so callers must use an admin client or a SECURITY DEFINER RPC.
 * In API routes we pass the admin client from createAdminClient().
 */
export async function enqueueJob(
  db: SupabaseClient,
  job: JobPayload,
  opts: { maxAttempts?: number; runAt?: Date } = {}
): Promise<string> {
  const { data, error } = await db
    .from('jobs')
    .insert({
      type:         job.type,
      payload:      job.data,
      status:       'pending',
      max_attempts: opts.maxAttempts ?? 3,
      run_at:       (opts.runAt ?? new Date()).toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to enqueue job ${job.type}: ${error?.message ?? 'unknown'}`);
  }

  console.log('[jobs] enqueued', { type: job.type, id: data.id });
  return data.id as string;
}
