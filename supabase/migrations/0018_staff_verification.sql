-- Migration: 0018_staff_verification
-- Description: Add staff verification table and admin verification fields
-- Created: 2026-02-24

-- ============================================================================
-- TABLE: staff_verifications
-- ============================================================================

create table if not exists staff_verifications (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null unique references staff_profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'verified', 'pending_review', 'rejected')),
  last_reviewed_at timestamptz,
  last_reviewed_by uuid references auth.users(id),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- ALTER TABLE: staff_profiles (add verification fields)
-- ============================================================================

alter table staff_profiles
  add column if not exists verified_by uuid references auth.users(id),
  add column if not exists verified_at timestamptz,
  add column if not exists verification_notes text;

-- ============================================================================
-- INDEXES
-- ============================================================================

create index if not exists idx_staff_verifications_staff_id on staff_verifications(staff_id);
create index if not exists idx_staff_verifications_status on staff_verifications(status);
create index if not exists idx_staff_verifications_reviewed_by on staff_verifications(last_reviewed_by);
create index if not exists idx_staff_profiles_verified_by on staff_profiles(verified_by);
create index if not exists idx_staff_profiles_verified_at on staff_profiles(verified_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

create trigger update_staff_verifications_updated_at
  before update on staff_verifications
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table staff_verifications is 'Tracks staff verification history and status';
comment on column staff_profiles.verified_by is 'User ID of admin who verified this staff member';
comment on column staff_profiles.verified_at is 'Timestamp when staff was verified (approved or rejected)';
comment on column staff_profiles.verification_notes is 'Admin notes for rejection or approval conditions';
