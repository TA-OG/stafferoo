-- Migration: 0026_marketplace_backfill
-- Description: Seeds pricing_config with MVP defaults from the business model,
--              seeds essential feature flags, and creates a SECURITY DEFINER
--              helper to check subscription gating for job posting/booking.
--
-- Reversibility:
--   delete from pricing_config where key in (
--     'setting_hourly_rate', 'staff_hourly_rate',
--     'subscription_standard_monthly', 'subscription_multi_site_base',
--     'subscription_multi_site_extra', 'annual_discount_months',
--     'emergency_cover_bonus'
--   );
--   delete from feature_flags where key in (
--     'marketplace_live', 'stripe_billing', 'dbs_auto_verify',
--     'sms_notifications', 'chat_enabled'
--   );
--   drop function if exists check_setting_subscription(uuid);

-- ============================================================================
-- 1. SEED PRICING DEFAULTS
-- ============================================================================
insert into pricing_config (key, value, currency, label) values
  ('setting_hourly_rate',           23,    'GBP', 'Charge to settings per hour of staff cover'),
  ('staff_hourly_rate',             15.50, 'GBP', 'Pay to staff per hour worked'),
  ('subscription_standard_monthly', 249,   'GBP', 'Standard single-site monthly subscription'),
  ('subscription_multi_site_base',  249,   'GBP', 'Multi-site base monthly subscription'),
  ('subscription_multi_site_extra', 99,    'GBP', 'Multi-site per-additional-location monthly'),
  ('annual_discount_months',        10,    'GBP', 'Annual plan = pay this many months for 12'),
  ('emergency_cover_bonus',         10,    'GBP', 'Bonus paid to secondary staff when mobilised for no-show cover')
on conflict (key) do nothing;

-- ============================================================================
-- 2. SEED FEATURE FLAGS
-- ============================================================================
insert into feature_flags (key, enabled, description) values
  ('marketplace_live',  false, 'Master switch for the job posting and booking marketplace loop'),
  ('stripe_billing',    false, 'Enable Stripe subscription and payment processing'),
  ('dbs_auto_verify',   false, 'Automated DBS Update Service verification via background worker'),
  ('sms_notifications', false, 'Send SMS notifications (Textlocal) in addition to email'),
  ('chat_enabled',      false, 'Enable in-app chat between booking participants')
on conflict (key) do nothing;

-- ============================================================================
-- 3. SUBSCRIPTION GATE HELPER
-- ============================================================================
create or replace function check_setting_subscription(p_setting_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub subscriptions%rowtype;
begin
  select * into v_sub
  from subscriptions
  where setting_id = p_setting_id
    and status = 'active'
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'has_active_subscription', false,
      'tier', null,
      'message', 'An active subscription is required to post jobs and confirm bookings.'
    );
  end if;

  return jsonb_build_object(
    'has_active_subscription', true,
    'tier',                    v_sub.tier,
    'current_period_end',      v_sub.current_period_end,
    'subscription_id',         v_sub.id
  );
end;
$$;

grant execute on function check_setting_subscription to authenticated;

-- ============================================================================
-- 4. BACKFILL: ensure every existing setting_profiles row has postcode
--    populated on job_requests (safe no-op if no settings exist yet)
-- ============================================================================
-- No data backfill required at this point — job_requests, bookings, etc.
-- are brand-new tables with no pre-existing rows.
-- This section is reserved for future backfill operations if the schema
-- is extended or defaults change.

-- ============================================================================
-- Reload PostgREST schema cache
-- ============================================================================
notify pgrst, 'reload schema';
