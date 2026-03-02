-- Migration: 0032_admin_metrics_schema
-- Description: Tables for admin dashboard metrics, cost tracking, fraud detection, and alerts

-- ============================================================================
-- 1. COST TRACKING - Per-entity cost accumulation
-- ============================================================================
create table if not exists cost_tracking (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('setting', 'staff', 'reference', 'booking')),
  entity_id uuid not null,
  cost_category text not null check (cost_category in (
    'sms', 'email', 'storage', 'api_call', 'compute', 'support_time', 'fraud_review'
  )),
  cost_amount decimal(10, 4) not null default 0,
  cost_currency text not null default 'GBP',
  quantity integer not null default 1, -- e.g., number of SMS sent, API calls made
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cost_tracking_entity on cost_tracking(entity_type, entity_id);
create index if not exists idx_cost_tracking_category on cost_tracking(cost_category, created_at);
create index if not exists idx_cost_tracking_date on cost_tracking(created_at);

-- ============================================================================
-- 2. SUPPORT TICKET TRACKING - Link tickets to entities for cost analysis
-- ============================================================================
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique not null,
  entity_type text not null check (entity_type in ('setting', 'staff', 'system')),
  entity_id uuid,
  category text not null check (category in (
    'onboarding', 'technical', 'billing', 'dispute', 'fraud_review', 'general'
  )),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'pending', 'resolved', 'closed')),
  time_spent_minutes integer default 0, -- For calculating support cost
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_entity on support_tickets(entity_type, entity_id);
create index if not exists idx_support_tickets_status on support_tickets(status, created_at);
create index if not exists idx_support_tickets_category on support_tickets(category, priority);

-- ============================================================================
-- 3. API USAGE TRACKING - Per-user API call metrics
-- ============================================================================
create table if not exists api_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  endpoint text not null,
  method text not null,
  status_code integer,
  response_time_ms integer,
  ip_address inet,
  user_agent text,
  is_scraping_suspicious boolean default false,
  request_hash text, -- For detecting duplicate requests
  created_at timestamptz not null default now()
);

create index if not exists idx_api_usage_user on api_usage(user_id, created_at);
create index if not exists idx_api_usage_endpoint on api_usage(endpoint, created_at);
create index if not exists idx_api_usage_suspicious on api_usage(is_scraping_suspicious, created_at) where is_scraping_suspicious = true;
create index if not exists idx_api_usage_ip on api_usage(ip_address, created_at);

-- ============================================================================
-- 4. FRAUD SIGNALS - Detected fraud/scraping signals
-- ============================================================================
create table if not exists fraud_signals (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('setting', 'staff', 'ip_address', 'device')),
  entity_id uuid,
  signal_type text not null check (signal_type in (
    'rapid_signup', 'duplicate_identity', 'suspicious_references', 'scraping_pattern',
    'multiple_accounts_same_ip', 'fake_location', 'chargeback_risk', 'velocity_abuse'
  )),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'reviewing', 'confirmed_fraud', 'false_positive', 'ignored')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_fraud_signals_entity on fraud_signals(entity_type, entity_id);
create index if not exists idx_fraud_signals_type on fraud_signals(signal_type, severity);
create index if not exists idx_fraud_signals_status on fraud_signals(status, created_at);

-- ============================================================================
-- 5. POSTCODE METRICS - Unit economics per geography
-- ============================================================================
create table if not exists postcode_metrics (
  id uuid primary key default gen_random_uuid(),
  postcode_district text not null unique, -- e.g., "SW1", "E1", "M1"
  staff_count integer not null default 0,
  setting_count integer not null default 0,
  total_bookings integer not null default 0,
  filled_bookings integer not null default 0,
  cancelled_bookings integer not null default 0,
  total_hours decimal(10, 2) default 0,
  total_gmv decimal(10, 2) default 0, -- Gross Merchandise Value
  avg_fill_rate decimal(5, 4) generated always as (
    case when total_bookings > 0 then filled_bookings::decimal / total_bookings else 0 end
  ) stored,
  avg_response_time_minutes integer,
  last_calculated_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_postcode_metrics_fill_rate on postcode_metrics(avg_fill_rate);
create index if not exists idx_postcode_metrics_staff on postcode_metrics(staff_count);

-- Auto-update timestamp
drop trigger if exists update_postcode_metrics_updated_at on postcode_metrics;
create trigger update_postcode_metrics_updated_at
  before update on postcode_metrics
  for each row execute function update_updated_at_column();

-- ============================================================================
-- 6. CONVERSION FUNNEL - Track free to paid progression
-- ============================================================================
create table if not exists conversion_events (
  id uuid primary key default gen_random_uuid(),
  setting_id uuid not null references setting_profiles(id) on delete cascade,
  event_type text not null check (event_type in (
    'registered', 'verified', 'first_job_posted', 'first_booking_made',
    'subscription_started', 'subscription_cancelled', 'churned'
  )),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversion_events_setting on conversion_events(setting_id, created_at);
create index if not exists idx_conversion_events_type on conversion_events(event_type, created_at);

-- ============================================================================
-- 7. ADMIN ALERTS - Configurable threshold alerts
-- ============================================================================
create table if not exists admin_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_type text not null check (alert_type in (
    'low_conversion_rate', 'high_support_cost', 'fraud_detected', 'scraping_detected',
    'low_fill_rate', 'supply_demand_imbalance', 'cost_spike', 'revenue_drop'
  )),
  severity text not null check (severity in ('info', 'warning', 'critical')),
  title text not null,
  description text not null,
  entity_type text, -- e.g., 'postcode', 'setting', 'system'
  entity_id uuid,
  metric_value decimal(10, 4),
  threshold_value decimal(10, 4),
  acknowledged_by uuid references auth.users(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_alerts_status on admin_alerts(resolved_at, severity);
create index if not exists idx_admin_alerts_type on admin_alerts(alert_type, created_at);

-- ============================================================================
-- 8. DAILY AGGREGATES - Pre-computed daily metrics for fast dashboard queries
-- ============================================================================
create table if not exists daily_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null,
  metric_category text not null check (metric_category in (
    'conversion', 'cost', 'support', 'api_usage', 'fraud', 'postcode', 'revenue'
  )),
  metric_name text not null,
  metric_value decimal(15, 4) not null,
  dimensions jsonb default '{}'::jsonb, -- e.g., {"postcode": "SW1", "tier": "standard"}
  created_at timestamptz not null default now(),
  unique(metric_date, metric_category, metric_name, dimensions)
);

create index if not exists idx_daily_metrics_lookup on daily_metrics(metric_date, metric_category, metric_name);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
alter table cost_tracking enable row level security;
alter table support_tickets enable row level security;
alter table api_usage enable row level security;
alter table fraud_signals enable row level security;
alter table postcode_metrics enable row level security;
alter table conversion_events enable row level security;
alter table admin_alerts enable row level security;
alter table daily_metrics enable row level security;

-- Only admins can access these tables
drop policy if exists "Admins can view cost_tracking" on cost_tracking;
create policy "Admins can view cost_tracking"
  on cost_tracking for select using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can view support_tickets" on support_tickets;
create policy "Admins can view support_tickets"
  on support_tickets for select using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can view api_usage" on api_usage;
create policy "Admins can view api_usage"
  on api_usage for select using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can view fraud_signals" on fraud_signals;
create policy "Admins can view fraud_signals"
  on fraud_signals for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can view postcode_metrics" on postcode_metrics;
create policy "Admins can view postcode_metrics"
  on postcode_metrics for select using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can view conversion_events" on conversion_events;
create policy "Admins can view conversion_events"
  on conversion_events for select using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can manage admin_alerts" on admin_alerts;
create policy "Admins can manage admin_alerts"
  on admin_alerts for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can view daily_metrics" on daily_metrics;
create policy "Admins can view daily_metrics"
  on daily_metrics for select using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ============================================================================
-- FUNCTIONS FOR METRIC CALCULATIONS
-- ============================================================================

-- Function to calculate cost per free account
create or replace function calculate_free_account_cost(
  p_start_date date,
  p_end_date date
) returns table (
  setting_id uuid,
  total_cost decimal(10, 2),
  sms_count bigint,
  api_calls bigint,
  support_minutes bigint
) as $$
begin
  return query
  select 
    s.id as setting_id,
    coalesce(sum(ct.cost_amount), 0) as total_cost,
    coalesce(sum(case when ct.cost_category = 'sms' then ct.quantity else 0 end), 0) as sms_count,
    coalesce(sum(case when ct.cost_category = 'api_call' then ct.quantity else 0 end), 0) as api_calls,
    coalesce(sum(st.time_spent_minutes), 0) as support_minutes
  from setting_profiles s
  left join cost_tracking ct on ct.entity_id = s.id 
    and ct.entity_type = 'setting'
    and ct.created_at between p_start_date and (p_end_date + interval '1 day')
  left join support_tickets st on st.entity_id = s.id
    and st.entity_type = 'setting'
    and st.created_at between p_start_date and (p_end_date + interval '1 day')
  left join subscriptions sub on sub.setting_id = s.id and sub.status = 'active'
  where sub.id is null  -- Only free accounts
  group by s.id;
end;
$$ language plpgsql security definer;

-- Function to detect scraping patterns
create or replace function detect_scraping_patterns(
  p_lookback_minutes integer default 60,
  p_threshold_requests integer default 100
) returns table (
  user_id uuid,
  ip_address inet,
  request_count bigint,
  unique_endpoints bigint,
  avg_response_time_ms bigint,
  is_scraping boolean
) as $$
begin
  return query
  select 
    au.user_id,
    au.ip_address,
    count(*) as request_count,
    count(distinct au.endpoint) as unique_endpoints,
    avg(au.response_time_ms)::bigint as avg_response_time_ms,
    (count(*) > p_threshold_requests and count(distinct au.endpoint) < 5) as is_scraping
  from api_usage au
  where au.created_at > now() - (p_lookback_minutes || ' minutes')::interval
  group by au.user_id, au.ip_address
  having count(*) > p_threshold_requests;
end;
$$ language plpgsql security definer;

-- Function to calculate conversion rate
create or replace function calculate_conversion_rate(
  p_start_date date,
  p_end_date date
) returns table (
  cohort_date date,
  registered_count bigint,
  converted_count bigint,
  conversion_rate decimal(5, 4)
) as $$
begin
  return query
  with cohorts as (
    select 
      date(ce.created_at) as cohort_date,
      ce.setting_id,
      exists (
        select 1 from conversion_events ce2 
        where ce2.setting_id = ce.setting_id 
        and ce2.event_type = 'subscription_started'
      ) as did_convert
    from conversion_events ce
    where ce.event_type = 'registered'
    and date(ce.created_at) between p_start_date and p_end_date
  )
  select 
    cohort_date,
    count(*) as registered_count,
    count(*) filter (where did_convert) as converted_count,
    case 
      when count(*) > 0 then count(*) filter (where did_convert)::decimal / count(*)
      else 0
    end as conversion_rate
  from cohorts
  group by cohort_date
  order by cohort_date;
end;
$$ language plpgsql security definer;

notify pgrst, 'reload schema';
