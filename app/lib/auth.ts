/**
 * Shared server-side auth helper.
 * Decodes the Bearer JWT locally (no network call) and returns a user-scoped
 * Supabase client. Works regardless of whether cookies are present.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function decodeJwt(token: string): { sub: string; email?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    const parsed = JSON.parse(payload) as { sub?: string; email?: string };
    if (!parsed.sub) return null;
    return { sub: parsed.sub, email: parsed.email };
  } catch {
    return null;
  }
}

export function userScopedClient(token: string): SupabaseClient {
  return createClient(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );
}

export type AuthResult =
  | { ok: true; user: { id: string; email: string }; token: string; supabase: SupabaseClient }
  | { ok: false; status: 401; code: string; message: string };

/**
 * Extract and decode the Bearer token from a request.
 * Returns user id + email from JWT claims, and a user-scoped Supabase client.
 * Call this at the top of every API route handler.
 */
export function getAuthFromRequest(req: NextRequest): AuthResult {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, code: "UNAUTHORIZED", message: "You must be signed in" };
  }
  const token = authHeader.slice(7);
  const claims = decodeJwt(token);
  if (!claims) {
    return { ok: false, status: 401, code: "UNAUTHORIZED", message: "Session expired — please sign in again" };
  }
  return {
    ok: true,
    user: { id: claims.sub, email: claims.email ?? "" },
    token,
    supabase: userScopedClient(token),
  };
}
