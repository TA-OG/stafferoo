-- Migration: 0002_settings
-- Description: Create setting_profiles and audit_logs tables with RLS policies
-- Created: 2026-02-17

-- ============================================================================
-- TABLE: setting_profiles
-- ============================================================================
create table if not exists setting_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  setting_name text not null,
  ofsted_urn text unique not null,
  ofsted_rating text check (ofsted_rating in ('Outstanding', 'Good', 'Requires Improvement', 'Inadequate')),
  email text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  postcode text not null,
  has_parking boolean default false,
  number_of_children integer,
  team_size integer,
  operation_hours_start time,
  operation_hours_end time,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  verification_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- TABLE: audit_logs
-- ============================================================================
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index if not exists idx_setting_profiles_ofsted_urn on setting_profiles(ofsted_urn);
create index if not exists idx_setting_profiles_verification_status on setting_profiles(verification_status);
create index if not exists idx_audit_logs_entity on audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_actor on audit_logs(actor_user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
create trigger update_setting_profiles_updated_at
  before update on setting_profiles
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
alter table setting_profiles enable row level security;
alter table audit_logs enable row level security;

-- setting_profiles policies
create policy "Settings can select own profile"
  on setting_profiles for select
  using (auth.uid() = id);

create policy "Settings can insert own profile"
  on setting_profiles for insert
  with check (auth.uid() = id);

create policy "Settings can update own profile"
  on setting_profiles for update
  using (auth.uid() = id);

create policy "Admins can select all settings"
  on setting_profiles for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

create policy "Admins can update verification fields"
  on setting_profiles for update
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- audit_logs policies
create policy "Admins can select all audit logs"
  on audit_logs for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

create policy "System can insert audit logs"
  on audit_logs for insert
  with check (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
comment on table setting_profiles is 'Childcare settings (customers) profiles and verification status';
comment on table audit_logs is 'Audit trail for admin actions and system events';
comment on column setting_profiles.verification_status is 'Verification status: pending, approved, rejected';
comment on column setting_profiles.ofsted_urn is 'Ofsted Unique Reference Number (URN)';
