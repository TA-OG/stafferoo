-- Migration: Update drugs_alcohol_declaration to boolean
-- Changes the field from text to boolean for Yes/No question

-- 1. Update the column type in staff_profiles
alter table staff_profiles
  alter column drugs_alcohol_declaration type boolean
  using (drugs_alcohol_declaration is not null and drugs_alcohol_declaration != '');

-- 2. Set default value
alter table staff_profiles
  alter column drugs_alcohol_declaration set default false;

-- 3. Drop and recreate the upsert_staff_health_safety function with updated signature
drop function if exists upsert_staff_health_safety;

create or replace function upsert_staff_health_safety(
  p_id                              uuid,
  p_emergency_contact_1_name        text,
  p_emergency_contact_1_phone       text,
  p_emergency_contact_1_relationship text,
  p_emergency_contact_2_name        text,
  p_emergency_contact_2_phone       text,
  p_emergency_contact_2_relationship text,
  p_gp_name                         text,
  p_gp_address                      text,
  p_health_declaration              jsonb,
  p_smoking_declaration             text,
  p_drugs_alcohol_declaration       boolean,  -- Changed from text to boolean
  p_disqualified_person_declaration boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() <> p_id then
    raise exception 'Permission denied: you can only update your own profile';
  end if;

  if not exists (select 1 from staff_profiles where id = p_id) then
    raise exception 'Profile not found — please complete Step 2 first';
  end if;

  -- Note: We allow saving with true values, but submission will be blocked
  -- The UI and final submit endpoint enforce the hard stops

  update staff_profiles set
    emergency_contact_1_name         = p_emergency_contact_1_name,
    emergency_contact_1_phone        = p_emergency_contact_1_phone,
    emergency_contact_1_relationship = p_emergency_contact_1_relationship,
    emergency_contact_2_name         = p_emergency_contact_2_name,
    emergency_contact_2_phone        = p_emergency_contact_2_phone,
    emergency_contact_2_relationship = p_emergency_contact_2_relationship,
    gp_name                          = p_gp_name,
    gp_address                       = p_gp_address,
    health_declaration               = p_health_declaration,
    smoking_declaration              = p_smoking_declaration,
    drugs_alcohol_declaration        = p_drugs_alcohol_declaration,
    disqualified_person_declaration  = p_disqualified_person_declaration,
    updated_at                       = now()
  where id = p_id;
end;
$$;

grant execute on function upsert_staff_health_safety to anon, authenticated;

-- Add comment
comment on column staff_profiles.drugs_alcohol_declaration is 
  'Boolean: true = has issues (hard stop), false = no issues (can proceed)';
