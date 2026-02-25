-- Migration: 0021_personal_reference_urn
-- Description: Adds optional setting_urn support to personal references.
--              Recreates upsert_staff_references with a new p_personal_setting_urn
--              parameter (default ''), stored as NULL when blank.
--
-- Reversibility:
--   drop function upsert_staff_references(text,text,text,text,text,text,text,text,text,text,text);
--   Then restore the 10-parameter version from migration 0014.

-- Drop the old 10-parameter signature before replacing it
drop function if exists upsert_staff_references(text,text,text,text,text,text,text,text,text,text) cascade;

create or replace function upsert_staff_references(
  p_professional_referee_name     text,
  p_professional_referee_position text,
  p_professional_referee_email    text,
  p_professional_email_domain     text,
  p_professional_setting_urn      text,
  p_professional_setting_name     text,
  p_personal_referee_name         text,
  p_personal_referee_position     text,
  p_personal_referee_email        text,
  p_personal_email_domain         text,
  p_personal_setting_urn          text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prof_id  uuid;
  v_pers_id  uuid;
  v_user_id  uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from staff_profiles where id = v_user_id) then
    raise exception 'Profile not found — please complete earlier onboarding steps first';
  end if;

  -- Upsert professional reference
  insert into staff_references (
    staff_user_id, type,
    referee_name, referee_position, referee_email, referee_email_domain,
    setting_urn, setting_name, status
  ) values (
    v_user_id, 'professional',
    p_professional_referee_name, p_professional_referee_position,
    p_professional_referee_email, p_professional_email_domain,
    p_professional_setting_urn, p_professional_setting_name,
    'draft'
  )
  on conflict (staff_user_id, type) do update set
    referee_name         = excluded.referee_name,
    referee_position     = excluded.referee_position,
    referee_email        = excluded.referee_email,
    referee_email_domain = excluded.referee_email_domain,
    setting_urn          = excluded.setting_urn,
    setting_name         = excluded.setting_name,
    updated_at           = now()
  returning id into v_prof_id;

  -- Upsert personal reference (setting_urn is optional — NULL when blank)
  insert into staff_references (
    staff_user_id, type,
    referee_name, referee_position, referee_email, referee_email_domain,
    setting_urn, status
  ) values (
    v_user_id, 'personal',
    p_personal_referee_name, p_personal_referee_position,
    p_personal_referee_email, p_personal_email_domain,
    nullif(p_personal_setting_urn, ''),
    'draft'
  )
  on conflict (staff_user_id, type) do update set
    referee_name         = excluded.referee_name,
    referee_position     = excluded.referee_position,
    referee_email        = excluded.referee_email,
    referee_email_domain = excluded.referee_email_domain,
    setting_urn          = excluded.setting_urn,
    updated_at           = now()
  returning id into v_pers_id;

  return jsonb_build_object(
    'professional_id', v_prof_id,
    'personal_id',     v_pers_id
  );
end;
$$;

grant execute on function upsert_staff_references to anon, authenticated;

notify pgrst, 'reload schema';
