-- Migration: 0018_backfill_missing_dashboard_tables
-- Description: Backfills tables and columns that exist in migrations 0013/0015
--              but were not applied to production. Safe to re-run — every
--              statement uses IF NOT EXISTS or DROP CONSTRAINT IF EXISTS guards.
--
-- Missing pieces confirmed via information_schema query 2026-02-22:
--   staff_profiles.qualification_name          → col missing (0013)
--   staff_notification_preferences             → table missing (0015)
--   staff_unavailability                       → table missing (0015)
--
-- Reversibility:
--   alter table staff_profiles drop column if exists qualification_name;
--   drop table if exists staff_unavailability;
--   drop table if exists staff_notification_preferences;

-- ============================================================================
-- 1. qualification_name column on staff_profiles
-- ============================================================================
alter table staff_profiles
  add column if not exists qualification_name text;

comment on column staff_profiles.qualification_name is
  'Full name of the staff member''s primary childcare qualification (e.g. "CACHE Level 3 Diploma")';

-- ============================================================================
-- 2. Extend staff_verifications status to include request_changes
-- ============================================================================
alter table staff_verifications
  drop constraint if exists staff_verifications_status_check;

alter table staff_verifications
  add constraint staff_verifications_status_check
    check (status in ('incomplete', 'pending_review', 'verified', 'rejected', 'request_changes'));

-- ============================================================================
-- 3. staff_notification_preferences table
-- ============================================================================
create table if not exists staff_notification_preferences (
  staff_id   uuid primary key references staff_profiles(id) on delete cascade,
  email_on   boolean not null default true,
  sms_on     boolean not null default false,
  browser_on boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at_notification_prefs()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notification_prefs_updated_at on staff_notification_preferences;

create trigger trg_notification_prefs_updated_at
  before update on staff_notification_preferences
  for each row execute function set_updated_at_notification_prefs();

alter table staff_notification_preferences enable row level security;

drop policy if exists "staff_notification_prefs_select_own" on staff_notification_preferences;
drop policy if exists "staff_notification_prefs_insert_own" on staff_notification_preferences;
drop policy if exists "staff_notification_prefs_update_own" on staff_notification_preferences;

create policy "staff_notification_prefs_select_own"
  on staff_notification_preferences for select
  using (auth.uid() = staff_id);

create policy "staff_notification_prefs_insert_own"
  on staff_notification_preferences for insert
  with check (auth.uid() = staff_id);

create policy "staff_notification_prefs_update_own"
  on staff_notification_preferences for update
  using (auth.uid() = staff_id);

-- ============================================================================
-- 4. staff_unavailability table
-- ============================================================================
create table if not exists staff_unavailability (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references staff_profiles(id) on delete cascade,
  starts_on  date not null,
  ends_on    date not null,
  note       text,
  created_at timestamptz not null default now(),
  constraint chk_unavailability_dates check (ends_on >= starts_on)
);

create index if not exists idx_staff_unavailability_staff_starts
  on staff_unavailability(staff_id, starts_on);

alter table staff_unavailability enable row level security;

drop policy if exists "staff_unavailability_select_own" on staff_unavailability;
drop policy if exists "staff_unavailability_insert_own" on staff_unavailability;
drop policy if exists "staff_unavailability_delete_own" on staff_unavailability;

create policy "staff_unavailability_select_own"
  on staff_unavailability for select
  using (auth.uid() = staff_id);

create policy "staff_unavailability_insert_own"
  on staff_unavailability for insert
  with check (auth.uid() = staff_id);

create policy "staff_unavailability_delete_own"
  on staff_unavailability for delete
  using (auth.uid() = staff_id);

-- ============================================================================
-- 5. Reload PostgREST schema cache
-- ============================================================================
notify pgrst, 'reload schema';
