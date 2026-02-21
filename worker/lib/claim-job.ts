/**
 * Atomic job claiming via the claim_next_job() Postgres function.
 *
 * The DB function uses FOR UPDATE SKIP LOCKED so multiple worker instances
 * can run safely without double-processing the same job.
 */

import { type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Job row schema — must match the `jobs` table from migration 0014
// ---------------------------------------------------------------------------

export const jobRowSchema = z.object({
  id:           z.string().uuid(),
  type:         z.string(),
  payload:      z.record(z.unknown()),
  status:       z.enum(['pending', 'running', 'completed', 'failed']),
  attempts:     z.number().int(),
  max_attempts: z.number().int(),
  run_at:       z.string(),
  created_at:   z.string(),
});

export type JobRow = z.infer<typeof jobRowSchema>;

// ---------------------------------------------------------------------------
// Claim
// ---------------------------------------------------------------------------

/**
 * Claims the next eligible job from the queue.
 * Returns null if no jobs are available.
 * Throws if the RPC call itself fails.
 */
export async function claimNextJob(db: SupabaseClient): Promise<JobRow | null> {
  const { data, error } = await db.rpc('claim_next_job');

  if (error) {
    throw new Error(`[worker] claim_next_job RPC failed: ${error.message}`);
  }

  if (!data) return null;

  const parsed = jobRowSchema.safeParse(data);
  if (!parsed.success) {
    console.error('[worker] claim_next_job returned malformed row', {
      event:  'worker.claim.malformed',
      issues: parsed.error.issues,
      raw:    data,
    });
    return null;
  }

  return parsed.data;
}
