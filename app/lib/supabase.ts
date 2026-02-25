import { createBrowserClient } from '@supabase/ssr';

// NEXT_PUBLIC_* variables are baked in at build time by Next.js.
// Both must be configured in your Vercel project environment variables.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if env vars are missing (log warning but don't crash)
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error(
    '[Stafferoo] Missing Supabase environment variables. ' +
    'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.'
  );
}

// createBrowserClient stores the session in cookies (not localStorage), so
// Next.js API routes can read it server-side via createSupabaseServerClient.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
