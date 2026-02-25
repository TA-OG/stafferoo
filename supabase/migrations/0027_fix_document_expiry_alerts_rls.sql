-- Migration: 0027_fix_document_expiry_alerts_rls
-- Description: Enable RLS and add policies for document_expiry_alerts table
-- Created: 2026-02-25
-- Issue: Table was created with RLS disabled (security vulnerability)

-- Enable RLS on the table
alter table document_expiry_alerts enable row level security;

-- Policy: Admins can do everything
-- Uses JWT claim check (same pattern as other admin policies)
create policy "Admins can manage document expiry alerts"
  on document_expiry_alerts
  for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Policy: Users can view their own alerts
create policy "Users can view own document expiry alerts"
  on document_expiry_alerts
  for select
  using (auth.uid() = user_id);

-- Policy: System can insert alerts (for automated processes)
-- This allows the worker/service role to create alerts
create policy "System can insert document expiry alerts"
  on document_expiry_alerts
  for insert
  with check (true);

-- Add index for performance on user lookups
create index if not exists idx_document_expiry_alerts_user_id
  on document_expiry_alerts(user_id);

create index if not exists idx_document_expiry_alerts_staff_id
  on document_expiry_alerts(staff_id);

-- Add index for expiry date queries
create index if not exists idx_document_expiry_alerts_expires_at
  on document_expiry_alerts(expires_at);

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
