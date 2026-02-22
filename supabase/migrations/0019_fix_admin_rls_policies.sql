-- Migration: 0019_fix_admin_rls_policies
-- Description: Replaces every admin RLS policy that queries auth.users directly
--              (which fails with "permission denied for table users") with the
--              correct approach: reading the role claim straight from the JWT
--              via auth.jwt() — no table access required.
--
-- Root cause: exists(select 1 from auth.users where ... raw_user_meta_data...)
--             The authenticated role cannot SELECT from auth.users.
--
-- Fix:        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
--             Uses the JWT already present in the request — no table access.
--
-- Reversibility: re-run 0001/0002/0004/0007/0014 migrations to restore
--                the original (broken) policies, or just drop these tables.

-- ============================================================================
-- Helper: reusable admin check expression (comment only — used inline below)
-- (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
-- ============================================================================

-- ── staff_profiles ──────────────────────────────────────────────────────────
drop policy if exists "Admins can select all profiles" on staff_profiles;

create policy "Admins can select all profiles"
  on staff_profiles for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ── staff_documents ──────────────────────────────────────────────────────────
drop policy if exists "Admins can select all documents" on staff_documents;

create policy "Admins can select all documents"
  on staff_documents for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ── id_verifications ─────────────────────────────────────────────────────────
drop policy if exists "Admins can select all verifications" on id_verifications;

create policy "Admins can select all verifications"
  on id_verifications for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ── setting_profiles ─────────────────────────────────────────────────────────
drop policy if exists "Admins can select all settings" on setting_profiles;

create policy "Admins can select all settings"
  on setting_profiles for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update verification fields" on setting_profiles;

create policy "Admins can update verification fields"
  on setting_profiles for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ── audit_logs ────────────────────────────────────────────────────────────────
drop policy if exists "Admins can select all audit logs" on audit_logs;

create policy "Admins can select all audit logs"
  on audit_logs for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ── enabled_postcodes ─────────────────────────────────────────────────────────
drop policy if exists "Admins can select enabled postcodes" on enabled_postcodes;

create policy "Admins can select enabled postcodes"
  on enabled_postcodes for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can insert enabled postcodes" on enabled_postcodes;

create policy "Admins can insert enabled postcodes"
  on enabled_postcodes for insert
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update enabled postcodes" on enabled_postcodes;

create policy "Admins can update enabled postcodes"
  on enabled_postcodes for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ── storage.objects ───────────────────────────────────────────────────────────
drop policy if exists "Admins can read all documents" on storage.objects;

create policy "Admins can read all documents"
  on storage.objects for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ── staff_references ──────────────────────────────────────────────────────────
drop policy if exists "Admins can select all references" on staff_references;

create policy "Admins can select all references"
  on staff_references for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ── reference_responses ───────────────────────────────────────────────────────
drop policy if exists "Admins can select all reference responses" on reference_responses;

create policy "Admins can select all reference responses"
  on reference_responses for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ── Reload PostgREST schema cache ─────────────────────────────────────────────
notify pgrst, 'reload schema';
