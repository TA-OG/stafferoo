-- Migration: 0006_upsert_staff_profile_fn
-- Description: Add a security-definer function so the anon client can upsert
-- staff_profiles without needing a service role key. The function enforces
-- that the caller can only write their own row (auth.uid() = p_id).

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
    p_criminal_conviction_declared,
    p_criminal_conviction_details,
    now()
  )
  on conflict (id) do update set
    email                        = excluded.email,
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
    criminal_conviction_declared = excluded.criminal_conviction_declared,
    criminal_conviction_details  = excluded.criminal_conviction_details,
    updated_at                   = now();
end;
$$;

-- Grant execute to the anon and authenticated roles so the client can call it
grant execute on function upsert_staff_profile to anon, authenticated;
