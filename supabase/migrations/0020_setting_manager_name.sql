-- Migration: 0020_setting_manager_name
-- Description: Adds manager_name column to setting_profiles.
--              The manager is the designated contact responsible for the setting.
--
-- Reversibility:
--   alter table setting_profiles drop column if exists manager_name;

alter table setting_profiles
  add column if not exists manager_name text;

comment on column setting_profiles.manager_name is
  'Full name of the setting manager / designated person responsible for staffing';

notify pgrst, 'reload schema';
