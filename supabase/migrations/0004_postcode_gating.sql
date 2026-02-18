-- Migration: 0004_postcode_gating
-- Description: Add postcode enablement table for controlled rollout
-- Created: 2026-02-18

-- =====================================================================
-- TABLE: enabled_postcodes
-- =====================================================================
create table if not exists enabled_postcodes (
  postcode text primary key,
  enabled boolean not null default true,
  enabled_by uuid references auth.users(id),
  enabled_at timestamptz not null default now(),
  notes text
);

create index if not exists idx_enabled_postcodes_enabled on enabled_postcodes(enabled);

-- Enable RLS
alter table enabled_postcodes enable row level security;

-- Policies
create policy "Admins can select enabled postcodes"
  on enabled_postcodes for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

create policy "Admins can insert enabled postcodes"
  on enabled_postcodes for insert
  with check (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

create policy "Admins can update enabled postcodes"
  on enabled_postcodes for update
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

comment on table enabled_postcodes is 'Postcodes enabled for live bookings rollout';
