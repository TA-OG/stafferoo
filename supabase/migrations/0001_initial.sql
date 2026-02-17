-- Migration: 0001_initial
-- Description: Create staff onboarding tables with RLS policies
-- Created: 2026-02-17

-- Enable UUID extension if not already enabled
create extension if not exists "pgcrypto";

-- ============================================================================
-- TABLE: staff_profiles
-- ============================================================================
create table if not exists staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  postcode text,
  travel_radius_miles integer not null default 10,
  transport_mode text,
  years_experience integer,
  qualification_level text,
  dbs_update_service boolean not null default false,
  criminal_conviction_declared boolean not null default false,
  health_adjustments text,
  verification_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- TABLE: staff_documents
-- ============================================================================
create table if not exists staff_documents (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff_profiles(id) on delete cascade,
  doc_type text not null,
  file_name text not null,
  storage_path text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- TABLE: id_verifications
-- ============================================================================
create table if not exists id_verifications (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff_profiles(id) on delete cascade,
  provider text not null default 'didit',
  provider_reference text,
  status text not null default 'pending',
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index if not exists idx_staff_profiles_email on staff_profiles(email);
create index if not exists idx_staff_profiles_verification_status on staff_profiles(verification_status);
create index if not exists idx_staff_documents_staff_id on staff_documents(staff_id);
create index if not exists idx_id_verifications_staff_id on id_verifications(staff_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_staff_profiles_updated_at
  before update on staff_profiles
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
alter table staff_profiles enable row level security;
alter table staff_documents enable row level security;
alter table id_verifications enable row level security;

-- staff_profiles policies
create policy "Users can select own profile"
  on staff_profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on staff_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on staff_profiles for update
  using (auth.uid() = id);

create policy "Admins can select all profiles"
  on staff_profiles for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- staff_documents policies
create policy "Users can select own documents"
  on staff_documents for select
  using (
    staff_id in (
      select id from staff_profiles where id = auth.uid()
    )
  );

create policy "Users can insert own documents"
  on staff_documents for insert
  with check (
    staff_id in (
      select id from staff_profiles where id = auth.uid()
    )
  );

create policy "Admins can select all documents"
  on staff_documents for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- id_verifications policies
create policy "Users can select own verifications"
  on id_verifications for select
  using (
    staff_id in (
      select id from staff_profiles where id = auth.uid()
    )
  );

create policy "Admins can select all verifications"
  on id_verifications for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
comment on table staff_profiles is 'Core staff member profiles and onboarding data';
comment on table staff_documents is 'Document uploads for staff verification (DBS, qualifications, etc)';
comment on table id_verifications is 'ID verification records from external providers like Didit';
comment on column staff_profiles.verification_status is 'Onboarding status: pending, approved, rejected, suspended';
comment on column staff_documents.doc_type is 'Document type: dbs_certificate, qualification, first_aid, safeguarding, right_to_work';
comment on column id_verifications.status is 'Verification status: pending, approved, declined, manual_review';
