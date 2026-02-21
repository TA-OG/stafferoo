-- Migration: 0013_qualification_name_and_get_profile
-- Description:
--   1. Add qualification_name column to staff_profiles for capturing the
--      exact name of the staff member's qualification.
--   2. Update upsert_staff_profile to include qualification_name.
--   3. Add get_my_profile() SECURITY DEFINER function so the submit route
--      can reliably fetch the caller's own profile row without relying on RLS
--      (a plain .from() select through RLS can return no rows even when the
--      row exists if auth.uid() does not resolve in that query context).
-- Reversibility: remove column + drop functions.

-- ============================================================================
-- 1. Add qualification_name column
-- ============================================================================
alter table staff_profiles
  add column if not exists qualification_name text;

comment on column staff_profiles.qualification_name is
  'Full name of the staff member''s primary childcare qualification (e.g. "CACHE Level 3 Diploma")';

-- ============================================================================
-- 2. Update upsert_staff_profile to write qualification_name
-- ============================================================================
create or replace function upsert_staff_profile(
  p_id                          uuid,
  p_email                       text,
  p_full_name                   text,
  p_national_insurance_number   text,
  p_date_of_birth               date,
  p_phone                       text,
  p_address_line_1              text,
  p_address_line_2              text,
  p_city                        text,
  p_postcode                    text,
  p_travel_radius_miles         integer,
  p_transport_mode              text,
  p_years_experience            integer,
  p_qualification_level         text,
  p_qualification_name          text,
  p_criminal_conviction_declared boolean,
  p_criminal_conviction_details text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Enforce: caller may only write their own row
  if auth.uid() <> p_id then
    raise exception 'Permission denied: you can only update your own profile';
  end if;

  insert into staff_profiles (
    id,
    email,
    full_name,
    national_insurance_number,
    date_of_birth,
    phone,
    address_line_1,
    address_line_2,
    city,
    postcode,
    travel_radius_miles,
    transport_mode,
    years_experience,
    qualification_level,
    qualification_name,
    criminal_conviction_declared,
    criminal_conviction_details,
    updated_at
  ) values (
    p_id,
    p_email,
    p_full_name,
    p_national_insurance_number,
    p_date_of_birth::date,
    p_phone,
    p_address_line_1,
    p_address_line_2,
    p_city,
    p_postcode,
    p_travel_radius_miles,
    p_transport_mode,
    p_years_experience,
    p_qualification_level,
    p_qualification_name,
    p_criminal_conviction_declared,
    p_criminal_conviction_details,
    now()
  )
  on conflict (id) do update set
    -- preserve email if the caller passes empty string (email comes from auth, not the form)
    email                        = case when excluded.email <> '' then excluded.email else staff_profiles.email end,
    full_name                    = excluded.full_name,
    national_insurance_number    = excluded.national_insurance_number,
    date_of_birth                = excluded.date_of_birth,
    phone                        = excluded.phone,
    address_line_1               = excluded.address_line_1,
    address_line_2               = excluded.address_line_2,
    city                         = excluded.city,
    postcode                     = excluded.postcode,
    travel_radius_miles          = excluded.travel_radius_miles,
    transport_mode               = excluded.transport_mode,
    years_experience             = excluded.years_experience,
    qualification_level          = excluded.qualification_level,
    qualification_name           = excluded.qualification_name,
    criminal_conviction_declared = excluded.criminal_conviction_declared,
    criminal_conviction_details  = excluded.criminal_conviction_details,
    updated_at                   = now();
end;
$$;

grant execute on function upsert_staff_profile to anon, authenticated;


-- ============================================================================
-- 3. get_my_profile() — SECURITY DEFINER profile fetch for the submit route
--
-- The submit route creates a user-scoped Supabase client (anon key + JWT).
-- A plain .from('staff_profiles').select() through that client passes through
-- RLS. In some Supabase configurations auth.uid() does not resolve on plain
-- table queries made with the anon key even when a valid JWT is present,
-- causing the select to return zero rows and producing the false "profile not
-- found" error. This function runs as the definer (postgres role), bypasses
-- RLS entirely, and enforces ownership itself.
-- ============================================================================
create or replace function get_my_profile()
returns setof staff_profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select * from staff_profiles where id = auth.uid();
end;
$$;

grant execute on function get_my_profile to anon, authenticated;

comment on function get_my_profile is
  'Returns the caller''s own staff_profiles row, bypassing RLS. Used by the '
  'submit route to avoid false "not found" from RLS on plain table selects.';


-- ============================================================================
-- 4. submit_my_onboarding() — SECURITY DEFINER status update for submission
--
-- The submit route needs to set verification_status='pending' and submitted_at.
-- A plain .from().update() through the anon client uses the RLS UPDATE policy
-- "using (auth.uid() = id)". If auth.uid() does not resolve (same issue as
-- the select), the update silently updates 0 rows. This function enforces
-- ownership itself and performs the atomic status transition.
-- ============================================================================
create or replace function submit_my_onboarding()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from staff_profiles where id = auth.uid()) then
    raise exception 'Profile not found — please complete all onboarding steps first';
  end if;

  update staff_profiles set
    verification_status = 'pending',
    submitted_at        = now(),
    updated_at          = now()
  where id = auth.uid();
end;
$$;

grant execute on function submit_my_onboarding to anon, authenticated;

comment on function submit_my_onboarding is
  'Atomically sets verification_status=pending and submitted_at=now() for the '
  'authenticated staff member. SECURITY DEFINER so it works regardless of RLS '
  'auth.uid() resolution in the anon client context.';


-- ============================================================================
-- Reload PostgREST schema cache
-- ============================================================================
notify pgrst, 'reload schema';
