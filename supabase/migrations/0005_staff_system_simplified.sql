-- Migration: 0005_staff_system_simplified
-- Description: Simplified staff onboarding system with core tables
-- Created: 2026-02-19

-- ============================================================================
-- TABLE: staff_verifications (new table for tracking verification status)
-- ============================================================================
create table if not exists staff_verifications (
  staff_id uuid primary key references staff_profiles(id) on delete cascade,
  status text not null default 'incomplete' check (status in ('incomplete', 'pending_review', 'verified', 'rejected')),
  last_reviewed_at timestamptz,
  last_reviewed_by uuid references auth.users(id),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add trigger for updated_at
create or replace function update_staff_verifications_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_staff_verifications_updated_at
  before update on staff_verifications
  for each row
  execute function update_staff_verifications_updated_at();

-- ============================================================================
-- UPDATE: staff_documents (add notes column if not exists)
-- ============================================================================
alter table staff_documents
  add column if not exists notes text;

-- Update status constraint to include approved/rejected
alter table staff_documents drop constraint if exists staff_documents_status_check;
alter table staff_documents
  add constraint staff_documents_status_check
  check (status in ('pending', 'approved', 'rejected'));

-- ============================================================================
-- INDEXES
-- ============================================================================
create index if not exists idx_staff_verifications_status on staff_verifications(status);
create index if not exists idx_staff_verifications_last_reviewed_at on staff_verifications(last_reviewed_at);
create index if not exists idx_staff_documents_status on staff_documents(status);

-- ============================================================================
-- ROW LEVEL SECURITY: staff_verifications
-- ============================================================================
alter table staff_verifications enable row level security;

-- Staff can select their own verification status
create policy "Staff can select own verification"
  on staff_verifications for select
  using (auth.uid() = staff_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================
comment on table staff_verifications is 'Tracks staff verification status through onboarding process';
comment on column staff_verifications.status is 'Verification status: incomplete, pending_review, verified, rejected';
comment on column staff_verifications.last_reviewed_at is 'Timestamp of last admin review';
comment on column staff_verifications.last_reviewed_by is 'Admin user who last reviewed this staff member';
comment on column staff_verifications.rejection_reason is 'Reason provided if status is rejected';
