/**
 * Supabase admin client for the worker process.
 *
 * Self-contained — does not import from app/lib/supabase-server.ts to avoid
 * pulling in any Next.js-specific runtime code.
 *
 * Reads the same env vars used by the Next.js app.
 * Requires Node >= 20.6 with --env-file=.env.local in the worker npm script.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createWorkerAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('[worker] Missing env var: NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!key) {
    throw new Error('[worker] Missing env var: SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
