import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

// createBrowserClient stores the session in cookies (not localStorage), so
// Next.js API routes can read it server-side via createSupabaseServerClient.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
