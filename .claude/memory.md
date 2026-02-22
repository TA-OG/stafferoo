# Stafferoo (rec-app) Persistent Memory

## Architecture Decisions

### Auth
- Supabase JS client stores session in localStorage (not cookies).
- All API routes must accept Bearer token from Authorization header.
- Never rely on cookie-based auth for API routes.

### DB Writes from API Routes
- Use SECURITY DEFINER Postgres functions called via `.rpc()` — this is the gold standard pattern.
- It bypasses RLS permission issues without needing the service role key.
- Enforces row-level security inside the function itself (auth.uid() = p_id check).

### Service Role Key
- SUPABASE_SERVICE_ROLE_KEY: Not yet set in .env.local.
- Required for admin operations only.
- Do not use for user-facing writes.

### Migration Pattern
- New SQL functions go in supabase/migrations/ with next sequence number.
- Always grant execute to anon and authenticated roles.

### Error Display
- Use inline ErrorBanner component (in onboarding page), never alert().
- API errors return: `{ ok: false, error: { code, message, details } }`

### Gates
- npm run gate = lint + build + test.
- Must pass before marking anything done.
