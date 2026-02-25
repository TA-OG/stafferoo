-- Migration: 0010_upsert_step_fns
-- Description:
--   Add SECURITY DEFINER functions for Steps 3, 4, and 5 of staff onboarding.
--   Each function patches only the columns relevant to that step, preserving
--   data written by earlier steps. All enforce auth.uid() = p_id.

-- ============================================================================
-- upsert_staff_compliance  (Step 3 — DBS details)
-- ============================================================================
create or replace function upsert_staff_compliance(
  p_id                       uuid,
  p_dbs_update_service       boolean,
  p_dbs_certificate_number   text,
  p_dbs_issue_date           date,
  p_dbs_surname_on_certificate text
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

  -- Profile row must already exist (created in Step 2). If not, raise a clear error.
  if not exists (select 1 from staff_profiles where id = p_id) then
    raise exception 'Profile not found — please complete Step 2 first';
  end if;

  update staff_profiles set
    dbs_update_service          = p_dbs_update_service,
    dbs_certificate_number      = p_dbs_certificate_number,
    dbs_issue_date              = p_dbs_issue_date,
    dbs_surname_on_certificate  = p_dbs_surname_on_certificate,
    updated_at                  = now()
  where id = p_id;
end;
$$;

grant execute on function upsert_staff_compliance(uuid, boolean, text, date, text) to anon, authenticated;


-- ============================================================================
-- upsert_staff_health_safety  (Step 4 — emergency contacts, GP, health, lifestyle)
-- ============================================================================
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
  p_drugs_alcohol_declaration       text,
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

  if p_disqualified_person_declaration = true then
    raise exception 'Disqualified persons cannot complete onboarding';
  end if;

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

grant execute on function upsert_staff_health_safety(uuid, text, text, text, text, text, text, text, text, jsonb, text, text, boolean) to anon, authenticated;


-- ============================================================================
-- upsert_staff_signature  (Step 5 — digital signature)
-- ============================================================================
create or replace function upsert_staff_signature(
  p_id                    uuid,
  p_digital_signature_svg text
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

  update staff_profiles set
    digital_signature_svg      = p_digital_signature_svg,
    digital_signature_signed_at = now(),
    updated_at                  = now()
  where id = p_id;
end;
$$;

grant execute on function upsert_staff_signature(uuid, text) to anon, authenticated;


-- ============================================================================
-- Reload PostgREST schema cache
-- ============================================================================
notify pgrst, 'reload schema';
