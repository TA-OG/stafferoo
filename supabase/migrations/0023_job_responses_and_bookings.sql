-- Migration: 0023_job_responses_and_bookings
-- Description: Staff respond to open job_requests via booking_responses;
--              once a setting selects primary (and optional secondary) staff
--              the booking row is created. Supports the full no-show protocol
--              data model from day one (primary + secondary + assigned).
--
-- Reversibility:
--   drop table if exists bookings          cascade;
--   drop table if exists booking_responses cascade;

-- ============================================================================
-- 1. BOOKING_RESPONSES TABLE
-- ============================================================================
create table if not exists booking_responses (
  id              uuid primary key default gen_random_uuid(),
  job_request_id  uuid not null references job_requests(id) on delete cascade,
  staff_id        uuid not null references staff_profiles(id) on delete cascade,
  status          text not null default 'pending'
                    check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  message         text,
  responded_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint booking_responses_unique_per_job unique (job_request_id, staff_id)
);

create index if not exists idx_booking_responses_job     on booking_responses(job_request_id);
create index if not exists idx_booking_responses_staff   on booking_responses(staff_id);
create index if not exists idx_booking_responses_status  on booking_responses(status);

drop trigger if exists update_booking_responses_updated_at on booking_responses;
create trigger update_booking_responses_updated_at
  before update on booking_responses
  for each row execute function update_updated_at_column();

alter table booking_responses enable row level security;

-- Staff manage their own responses
drop policy if exists "Staff can select own responses" on booking_responses;
create policy "Staff can select own responses"
  on booking_responses for select
  using (auth.uid() = staff_id);

drop policy if exists "Staff can insert own responses" on booking_responses;
create policy "Staff can insert own responses"
  on booking_responses for insert
  with check (auth.uid() = staff_id);

drop policy if exists "Staff can update own responses" on booking_responses;
create policy "Staff can update own responses"
  on booking_responses for update
  using (auth.uid() = staff_id);

-- Settings can see responses to their jobs
drop policy if exists "Settings can select responses to own jobs" on booking_responses;
create policy "Settings can select responses to own jobs"
  on booking_responses for select
  using (
    exists (
      select 1 from job_requests jr
      where jr.id = booking_responses.job_request_id
        and jr.setting_id = auth.uid()
    )
  );

-- Admins full read
drop policy if exists "Admins can select all booking responses" on booking_responses;
create policy "Admins can select all booking responses"
  on booking_responses for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

comment on table booking_responses is 'Staff availability responses to open job requests.';
comment on column booking_responses.status is 'pending (created but no action), accepted, declined, withdrawn';


-- ============================================================================
-- 2. BOOKINGS TABLE
-- ============================================================================
create table if not exists bookings (
  id                   uuid primary key default gen_random_uuid(),
  job_request_id       uuid not null references job_requests(id) on delete cascade,
  setting_id           uuid not null references setting_profiles(id) on delete cascade,
  primary_staff_id     uuid not null references staff_profiles(id),
  secondary_staff_id   uuid references staff_profiles(id),
  assigned_staff_id    uuid references staff_profiles(id),
  status               text not null default 'confirmed'
                         check (status in (
                           'confirmed', 'in_progress', 'completed',
                           'cancelled', 'no_show'
                         )),
  check_in_time        timestamptz,
  check_out_time       timestamptz,
  check_in_verified    boolean,
  actual_hours         numeric,
  emergency_bonus_paid boolean not null default false,
  cancellation_reason  text,
  cancelled_by         text check (cancelled_by is null or cancelled_by in ('setting', 'staff', 'admin')),
  cancelled_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_bookings_job_request  on bookings(job_request_id);
create index if not exists idx_bookings_setting      on bookings(setting_id);
create index if not exists idx_bookings_primary      on bookings(primary_staff_id);
create index if not exists idx_bookings_secondary    on bookings(secondary_staff_id)
  where secondary_staff_id is not null;
create index if not exists idx_bookings_status       on bookings(status);

drop trigger if exists update_bookings_updated_at on bookings;
create trigger update_bookings_updated_at
  before update on bookings
  for each row execute function update_updated_at_column();

alter table bookings enable row level security;

-- Settings see their own bookings
drop policy if exists "Settings can select own bookings" on bookings;
create policy "Settings can select own bookings"
  on bookings for select
  using (auth.uid() = setting_id);

drop policy if exists "Settings can update own bookings" on bookings;
create policy "Settings can update own bookings"
  on bookings for update
  using (auth.uid() = setting_id);

-- Staff see bookings they are part of (primary, secondary, or assigned)
drop policy if exists "Staff can select own bookings" on bookings;
create policy "Staff can select own bookings"
  on bookings for select
  using (
    auth.uid() in (primary_staff_id, secondary_staff_id, assigned_staff_id)
  );

-- Staff can update bookings they are assigned to (check-in/out)
drop policy if exists "Staff can update assigned bookings" on bookings;
create policy "Staff can update assigned bookings"
  on bookings for update
  using (
    auth.uid() in (primary_staff_id, secondary_staff_id, assigned_staff_id)
  );

-- Admins full access
drop policy if exists "Admins can select all bookings" on bookings;
create policy "Admins can select all bookings"
  on bookings for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update all bookings" on bookings;
create policy "Admins can update all bookings"
  on bookings for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can insert bookings" on bookings;
create policy "Admins can insert bookings"
  on bookings for insert
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Settings can insert bookings (when confirming a booking)
drop policy if exists "Settings can insert own bookings" on bookings;
create policy "Settings can insert own bookings"
  on bookings for insert
  with check (auth.uid() = setting_id);

comment on table bookings is 'Confirmed shift placements with primary/secondary staff support for no-show protocol.';
comment on column bookings.primary_staff_id is 'Staff member confirmed for the shift';
comment on column bookings.secondary_staff_id is 'Backup staff on standby — mobilised if primary no-shows';
comment on column bookings.assigned_staff_id is 'Staff member who actually worked the shift (may differ from primary after no-show)';
comment on column bookings.status is 'confirmed → in_progress → completed | cancelled | no_show';
comment on column bookings.emergency_bonus_paid is 'True if secondary was mobilised and received the emergency cover bonus';


-- ============================================================================
-- Reload PostgREST schema cache
-- ============================================================================
notify pgrst, 'reload schema';
