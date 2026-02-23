import { createBrowserClient } from '@supabase/ssr';

// NEXT_PUBLIC_* variables are baked in at build time by Next.js.
// Both must be configured in your Vercel project environment variables.
// If either is missing the app will throw here rather than silently
// connecting to a wrong endpoint.
function mustPublicEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

// createBrowserClient stores the session in cookies (not localStorage), so
// Next.js API routes can read it server-side via createSupabaseServerClient.
export const supabase = createBrowserClient(
  mustPublicEnv('NEXT_PUBLIC_SUPABASE_URL'),
  mustPublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
);
