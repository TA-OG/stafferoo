-- Migration: 0022_marketplace_schema
-- Description: Core marketplace foundation tables — feature_flags for safe rollout,
--              pricing_config for configurable rates, subscriptions for setting billing,
--              and job_requests for the shift-posting flow.
--
--              Also cleans up stale tables from a prior schema approach
--              (childcare_settings, staff, setting_subscription_config,
--              setting_locations, marketplace_id bridge columns) that were
--              partially applied to the remote database.
--
-- Reversibility:
--   drop table if exists job_requests   cascade;
--   drop table if exists subscriptions  cascade;
--   drop table if exists pricing_config cascade;
--   drop table if exists feature_flags  cascade;

-- ============================================================================
-- 0. CLEAN UP STALE TABLES FROM PRIOR SCHEMA APPROACH
-- ============================================================================
drop table if exists setting_locations         cascade;
drop table if exists setting_subscription_config cascade;
drop table if exists job_requests              cascade;
drop table if exists staff                     cascade;
drop table if exists childcare_settings        cascade;

alter table setting_profiles drop column if exists marketplace_id;
alter table staff_profiles   drop column if exists marketplace_id;


-- ============================================================================
-- 1. FEATURE_FLAGS TABLE
-- ============================================================================
create table if not exists feature_flags (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  enabled     boolean not null default false,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_feature_flags_key on feature_flags(key);

drop trigger if exists update_feature_flags_updated_at on feature_flags;
create trigger update_feature_flags_updated_at
  before update on feature_flags
  for each row execute function update_updated_at_column();

alter table feature_flags enable row level security;

drop policy if exists "Anyone can read feature flags" on feature_flags;
create policy "Anyone can read feature flags"
  on feature_flags for select
  using (true);

drop policy if exists "Admins can insert feature flags" on feature_flags;
create policy "Admins can insert feature flags"
  on feature_flags for insert
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update feature flags" on feature_flags;
create policy "Admins can update feature flags"
  on feature_flags for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

comment on table feature_flags is 'Feature flag registry for safe, auditable rollout of new capabilities.';
comment on column feature_flags.key is 'Unique machine-readable flag identifier, e.g. marketplace_live, dbs_auto_verify';


-- ============================================================================
-- 2. PRICING_CONFIG TABLE
-- ============================================================================
create table if not exists pricing_config (
  key        text primary key,
  value      numeric not null,
  currency   text not null default 'GBP',
  label      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_pricing_config_updated_at on pricing_config;
create trigger update_pricing_config_updated_at
  before update on pricing_config
  for each row execute function update_updated_at_column();

alter table pricing_config enable row level security;

drop policy if exists "Anyone can read pricing config" on pricing_config;
create policy "Anyone can read pricing config"
  on pricing_config for select
  using (true);

drop policy if exists "Admins can insert pricing config" on pricing_config;
create policy "Admins can insert pricing config"
  on pricing_config for insert
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update pricing config" on pricing_config;
create policy "Admins can update pricing config"
  on pricing_config for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

comment on table pricing_config is 'Server-side configurable pricing values — never hard-coded in UI.';
comment on column pricing_config.key is 'e.g. setting_hourly_rate, staff_hourly_rate, subscription_standard_monthly';


-- ============================================================================
-- 3. SUBSCRIPTIONS TABLE
-- ============================================================================
create table if not exists subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  setting_id             uuid not null references setting_profiles(id) on delete cascade,
  tier                   text not null default 'standard'
                           check (tier in ('standard', 'multi_site', 'enterprise')),
  status                 text not null default 'pending'
                           check (status in ('pending', 'active', 'past_due', 'cancelled', 'trialing')),
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  renewal_day            integer not null default 28
                           check (renewal_day between 1 and 28),
  stripe_subscription_id text,
  stripe_customer_id     text,
  cancelled_at           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_subscriptions_setting_id on subscriptions(setting_id);
create index if not exists idx_subscriptions_status     on subscriptions(status);
create index if not exists idx_subscriptions_stripe_sub on subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

drop trigger if exists update_subscriptions_updated_at on subscriptions;
create trigger update_subscriptions_updated_at
  before update on subscriptions
  for each row execute function update_updated_at_column();

alter table subscriptions enable row level security;

drop policy if exists "Settings can select own subscription" on subscriptions;
create policy "Settings can select own subscription"
  on subscriptions for select
  using (auth.uid() = setting_id);

drop policy if exists "Admins can select all subscriptions" on subscriptions;
create policy "Admins can select all subscriptions"
  on subscriptions for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update subscriptions" on subscriptions;
create policy "Admins can update subscriptions"
  on subscriptions for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

comment on table subscriptions is 'Setting subscription lifecycle — gates job posting and booking confirmation.';
comment on column subscriptions.tier is 'standard = single site; multi_site = base + extra per location; enterprise = custom';
comment on column subscriptions.status is 'pending -> active | trialing -> past_due -> cancelled';
comment on column subscriptions.renewal_day is 'Day of month for billing alignment (default 28th per business rules)';


-- ============================================================================
-- 4. JOB_REQUESTS TABLE
-- ============================================================================
create table if not exists job_requests (
  id              uuid primary key default gen_random_uuid(),
  setting_id      uuid not null references setting_profiles(id) on delete cascade,
  title           text not null,
  description     text,
  job_date        date not null,
  start_time      timestamptz not null,
  end_time        timestamptz not null,
  role_required   text not null,
  hourly_rate     numeric not null,
  estimated_total numeric not null,
  status          text not null default 'draft'
                    check (status in ('draft', 'open', 'filled', 'cancelled', 'completed')),
  postcode        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint chk_job_times check (end_time > start_time)
);

create index if not exists idx_job_requests_setting_id on job_requests(setting_id);
create index if not exists idx_job_requests_status     on job_requests(status);
create index if not exists idx_job_requests_date       on job_requests(job_date)
  where status in ('open', 'filled');

drop trigger if exists update_job_requests_updated_at on job_requests;
create trigger update_job_requests_updated_at
  before update on job_requests
  for each row execute function update_updated_at_column();

alter table job_requests enable row level security;

drop policy if exists "Settings can select own job requests" on job_requests;
create policy "Settings can select own job requests"
  on job_requests for select
  using (auth.uid() = setting_id);

drop policy if exists "Settings can insert own job requests" on job_requests;
create policy "Settings can insert own job requests"
  on job_requests for insert
  with check (auth.uid() = setting_id);

drop policy if exists "Settings can update own job requests" on job_requests;
create policy "Settings can update own job requests"
  on job_requests for update
  using (auth.uid() = setting_id);

drop policy if exists "Verified staff can select open jobs" on job_requests;
create policy "Verified staff can select open jobs"
  on job_requests for select
  using (
    status = 'open'
    and exists (
      select 1 from staff_verifications sv
      where sv.staff_id = auth.uid()
        and sv.status = 'verified'
    )
  );

drop policy if exists "Admins can select all job requests" on job_requests;
create policy "Admins can select all job requests"
  on job_requests for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update all job requests" on job_requests;
create policy "Admins can update all job requests"
  on job_requests for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

comment on table job_requests is 'Shift requests posted by settings — the demand side of the marketplace.';
comment on column job_requests.role_required is 'e.g. nursery_nurse, room_leader, supervisor, manager';
comment on column job_requests.status is 'draft -> open -> filled | cancelled; completed after shift ends';
comment on column job_requests.hourly_rate is 'Rate charged to the setting per hour (from pricing_config)';
comment on column job_requests.estimated_total is 'hourly_rate x estimated hours — final amount may differ based on actual hours';


-- ============================================================================
-- Reload PostgREST schema cache
-- ============================================================================
notify pgrst, 'reload schema';
