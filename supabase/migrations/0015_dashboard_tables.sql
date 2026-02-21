-- 0015_dashboard_tables.sql
-- Staff dashboard: notification preferences, unavailability blocks,
-- and extends staff_verifications status to include 'request_changes'.

-- ── 1. Extend staff_verifications status enum ────────────────────────────────
alter table staff_verifications
  drop constraint if exists staff_verifications_status_check;

alter table staff_verifications
  add constraint staff_verifications_status_check
    check (status in ('incomplete', 'pending_review', 'verified', 'rejected', 'request_changes'));

-- ── 2. Notification preferences ─────────────────────────────────────────────
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

create trigger trg_notification_prefs_updated_at
  before update on staff_notification_preferences
  for each row execute function set_updated_at_notification_prefs();

-- ── 3. Unavailability blocks ─────────────────────────────────────────────────
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

-- ── 4. RLS: notification preferences ────────────────────────────────────────
alter table staff_notification_preferences enable row level security;

create policy "staff_notification_prefs_select_own"
  on staff_notification_preferences for select
  using (auth.uid() = staff_id);

create policy "staff_notification_prefs_insert_own"
  on staff_notification_preferences for insert
  with check (auth.uid() = staff_id);

create policy "staff_notification_prefs_update_own"
  on staff_notification_preferences for update
  using (auth.uid() = staff_id);

-- ── 5. RLS: unavailability ───────────────────────────────────────────────────
alter table staff_unavailability enable row level security;

create policy "staff_unavailability_select_own"
  on staff_unavailability for select
  using (auth.uid() = staff_id);

create policy "staff_unavailability_insert_own"
  on staff_unavailability for insert
  with check (auth.uid() = staff_id);

create policy "staff_unavailability_delete_own"
  on staff_unavailability for delete
  using (auth.uid() = staff_id);

-- ── Rollback notes ───────────────────────────────────────────────────────────
-- drop table if exists staff_unavailability;
-- drop table if exists staff_notification_preferences;
-- alter table staff_verifications drop constraint staff_verifications_status_check;
-- alter table staff_verifications add constraint staff_verifications_status_check
--   check (status in ('incomplete','pending_review','verified','rejected'));
