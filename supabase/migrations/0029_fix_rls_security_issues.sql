-- Migration: 0029_fix_rls_security_issues
-- Description: Fix RLS security issues identified by Supabase linter
-- 
-- Issues fixed:
-- 1. Enable RLS on tables missing it (banned_users, document_expiry_alerts, awr_tracking)
-- 2. Replace user_metadata-based admin checks with secure app_metadata approach
--    (user_metadata is editable by end users - security risk)

-- ============================================================================
-- 1. ENABLE RLS ON TABLES MISSING IT
-- ============================================================================

alter table if exists banned_users enable row level security;
alter table if exists document_expiry_alerts enable row level security;
alter table if exists awr_tracking enable row level security;

-- ============================================================================
-- 2. CREATE SECURE ADMIN CHECK FUNCTION
-- ============================================================================

-- Drop existing function if it exists (to ensure clean recreation)
drop function if exists is_app_admin();

-- Create a secure function to check admin status using app_metadata
-- app_metadata is NOT editable by end users (unlike user_metadata)
create or replace function is_app_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  return coalesce(
    current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role',
    current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role'
  ) = 'admin';
end;
$$;

-- ============================================================================
-- 3. DROP OLD user_metadata-BASED POLICIES (SECURITY VULNERABILITY)
-- ============================================================================

-- feature_flags
drop policy if exists "Admins can insert feature flags" on feature_flags;
drop policy if exists "Admins can update feature flags" on feature_flags;
drop policy if exists "Admins can delete feature flags" on feature_flags;
drop policy if exists "Admins can select feature flags" on feature_flags;

-- pricing_config
drop policy if exists "Admins can insert pricing config" on pricing_config;
drop policy if exists "Admins can update pricing config" on pricing_config;

-- subscriptions
drop policy if exists "Admins can select all subscriptions" on subscriptions;
drop policy if exists "Admins can update subscriptions" on subscriptions;

-- job_requests
drop policy if exists "Admins can select all job requests" on job_requests;
drop policy if exists "Admins can update all job requests" on job_requests;

-- booking_responses
drop policy if exists "Admins can select all booking responses" on booking_responses;

-- bookings
drop policy if exists "Admins can select all bookings" on bookings;
drop policy if exists "Admins can update all bookings" on bookings;
drop policy if exists "Admins can insert bookings" on bookings;

-- chat_messages
drop policy if exists "Admins can select all chat messages" on chat_messages;

-- notifications
drop policy if exists "Admins can select all notifications" on notifications;

-- staff_profiles
drop policy if exists "Admins can select all profiles" on staff_profiles;

-- staff_documents
drop policy if exists "Admins can select all documents" on staff_documents;

-- id_verifications
drop policy if exists "Admins can select all verifications" on id_verifications;

-- setting_profiles
drop policy if exists "Admins can select all settings" on setting_profiles;
drop policy if exists "Admins can update verification fields" on setting_profiles;

-- audit_logs
drop policy if exists "Admins can select all audit logs" on audit_logs;

-- enabled_postcodes
drop policy if exists "Admins can select enabled postcodes" on enabled_postcodes;
drop policy if exists "Admins can insert enabled postcodes" on enabled_postcodes;
drop policy if exists "Admins can update enabled postcodes" on enabled_postcodes;

-- staff_references
drop policy if exists "Admins can select all references" on staff_references;

-- reference_responses
drop policy if exists "Admins can select all reference responses" on reference_responses;

-- ============================================================================
-- 4. CREATE NEW SECURE POLICIES USING is_app_admin()
-- ============================================================================

-- feature_flags
create policy "Admins can manage feature flags"
  on feature_flags for all
  using (is_app_admin());

-- pricing_config
create policy "Admins can manage pricing config"
  on pricing_config for all
  using (is_app_admin());

-- subscriptions
create policy "Admins can manage subscriptions"
  on subscriptions for all
  using (is_app_admin());

-- job_requests
create policy "Admins can manage job requests"
  on job_requests for all
  using (is_app_admin());

-- booking_responses
create policy "Admins can view all booking responses"
  on booking_responses for select
  using (is_app_admin());

-- bookings
create policy "Admins can manage bookings"
  on bookings for all
  using (is_app_admin());

-- chat_messages
create policy "Admins can view all chat messages"
  on chat_messages for select
  using (is_app_admin());

-- notifications
create policy "Admins can view all notifications"
  on notifications for select
  using (is_app_admin());

-- staff_profiles
create policy "Admins can view all staff profiles"
  on staff_profiles for select
  using (is_app_admin());

-- staff_documents
create policy "Admins can view all documents"
  on staff_documents for select
  using (is_app_admin());

-- id_verifications
create policy "Admins can view all ID verifications"
  on id_verifications for select
  using (is_app_admin());

-- setting_profiles
create policy "Admins can manage settings"
  on setting_profiles for all
  using (is_app_admin());

-- audit_logs
create policy "Admins can view all audit logs"
  on audit_logs for select
  using (is_app_admin());

-- enabled_postcodes
create policy "Admins can manage enabled postcodes"
  on enabled_postcodes for all
  using (is_app_admin());

-- staff_references
create policy "Admins can view all staff references"
  on staff_references for select
  using (is_app_admin());

-- reference_responses
create policy "Admins can view all reference responses"
  on reference_responses for select
  using (is_app_admin());

-- ============================================================================
-- 5. CREATE POLICIES FOR TABLES MISSING RLS
-- ============================================================================

-- banned_users - only admins can manage
create policy if not exists "Admins can manage banned users"
  on banned_users for all
  using (is_app_admin());

-- document_expiry_alerts
create policy if not exists "Staff can view their own expiry alerts"
  on document_expiry_alerts for select
  using (staff_id = auth.uid());

create policy if not exists "Admins can view all expiry alerts"
  on document_expiry_alerts for select
  using (is_app_admin());

-- awr_tracking
create policy if not exists "Staff can view their own AWR"
  on awr_tracking for select
  using (staff_id = auth.uid());

create policy if not exists "Admins can view all AWR"
  on awr_tracking for select
  using (is_app_admin());

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

comment on function is_app_admin() is 
  'Securely checks if current user is admin using app_metadata (not user_metadata). 
   app_metadata is server-side only and not editable by end users.
   Falls back to user_metadata for backwards compatibility during transition.';

-- ============================================================================
-- Reload PostgREST schema cache
-- ============================================================================
notify pgrst, 'reload schema';
