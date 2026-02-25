-- Migration: 0019_ofsted_new_grades
-- Description: Update ofsted_rating check constraint to Ofsted's new 5-point
--              inspection grade scale, effective 10 November 2025.
--              Old grades: Outstanding, Good, Requires Improvement, Inadequate
--              New grades: Exceptional, Strong, Expected Standard,
--                          Needs Attention, Urgent Improvement
-- Created: 2026-02-25

-- Drop the old constraint
alter table setting_profiles
  drop constraint if exists setting_profiles_ofsted_rating_check;

-- Add new constraint for the 5-point scale plus retain existing stored values
-- during transition (rows with old grades will not be blocked on read, only on
-- new inserts/updates via this constraint).
alter table setting_profiles
  add constraint setting_profiles_ofsted_rating_check
  check (
    ofsted_rating in (
      'Exceptional',
      'Strong',
      'Expected Standard',
      'Needs Attention',
      'Urgent Improvement'
    )
  );

-- Down (reversible):
-- alter table setting_profiles drop constraint setting_profiles_ofsted_rating_check;
-- alter table setting_profiles add constraint setting_profiles_ofsted_rating_check
--   check (ofsted_rating in ('Outstanding', 'Good', 'Requires Improvement', 'Inadequate'));
