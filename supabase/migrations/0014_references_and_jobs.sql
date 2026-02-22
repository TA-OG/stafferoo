-- Migration: 0014_references_and_jobs
-- Description:
--   1. jobs table — generic background job queue for all async work.
--   2. staff_references — stores reference details for each applicant.
--   3. reference_requests — one-time tokenised links sent to referees.
--   4. reference_responses — referee answers stored as JSONB.
--   5. SECURITY DEFINER RPCs for the references workflow.
-- Reversibility: drop tables in reverse order, drop functions.
--
-- NOTE: This migration is idempotent. If a previous attempt partially ran,
-- the DROP IF EXISTS / CREATE IF NOT EXISTS guards allow it to be re-applied.

-- ============================================================================
-- Clean up any partial state from a previous failed attempt
-- (safe no-ops if nothing exists)
-- ============================================================================
drop function if exists get_my_references()           cascade;
drop function if exists submit_reference_response(text, jsonb) cascade;
drop function if exists resolve_reference_token(text) cascade;
drop function if exists create_reference_request(uuid, text, timestamptz) cascade;
drop function if exists upsert_staff_references(text,text,text,text,text,text,text,text,text,text) cascade;

drop table if exists reference_responses  cascade;
drop table if exists reference_requests   cascade;
drop table if exists staff_references     cascade;
drop table if exists jobs                 cascade;


-- ============================================================================
-- 1. JOBS TABLE
-- ============================================================================
create table jobs (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,
  payload      jsonb not null default '{}',
  status       text not null default 'pending'
                 check (status in ('pending', 'running', 'completed', 'failed')),
  attempts     integer not null default 0,
  max_attempts integer not null default 3,
  run_at       timestamptz not null default now(),
  started_at   timestamptz,
  completed_at timestamptz,
  failed_at    timestamptz,
  last_error   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_jobs_status_run_at on jobs(status, run_at)
  where status in ('pending', 'failed');

-- Use the shared trigger function defined in 0001_initial
create trigger update_jobs_updated_at
  before update on jobs
  for each row execute function update_updated_at_column();

-- RLS: service role only writes; no user-facing read policy needed.
alter table jobs enable row level security;

comment on table jobs is 'Generic background job queue — picked up by Node worker process.';
comment on column jobs.type is 'Job type identifier, e.g. reference_request_email';
comment on column jobs.status is 'Job lifecycle: pending → running → completed | failed';
comment on column jobs.max_attempts is 'Maximum retry attempts before marking failed permanently';


-- ============================================================================
-- 2. STAFF_REFERENCES TABLE
-- ============================================================================
create table staff_references (
  id                   uuid primary key default gen_random_uuid(),
  staff_user_id        uuid not null references staff_profiles(id) on delete cascade,
  type                 text not null check (type in ('professional', 'personal')),
  referee_name         text not null,
  referee_position     text,
  referee_email        text not null,
  referee_email_domain text not null,
  setting_urn          text,
  setting_name         text,
  status               text not null default 'draft'
                         check (status in ('draft', 'sent', 'viewed', 'submitted', 'expired', 'cancelled')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- Each applicant has exactly one slot per reference type (enables ON CONFLICT upsert)
  constraint staff_references_staff_user_id_type_unique unique (staff_user_id, type),

  -- Professional references must have a setting URN
  constraint professional_requires_urn check (
    type <> 'professional' or (setting_urn is not null and setting_urn <> '')
  )
);

create index idx_staff_references_staff_user_id on staff_references(staff_user_id);
create index idx_staff_references_status        on staff_references(status);

create trigger update_staff_references_updated_at
  before update on staff_references
  for each row execute function update_updated_at_column();

alter table staff_references enable row level security;

create policy "Staff can select own references"
  on staff_references for select
  using (auth.uid() = staff_user_id);

create policy "Staff can insert own references"
  on staff_references for insert
  with check (auth.uid() = staff_user_id);

create policy "Admins can select all references"
  on staff_references for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

comment on table staff_references is 'Reference details provided by staff applicants during onboarding.';
comment on column staff_references.type is 'professional = most recent childcare employer; personal = any other referee';
comment on column staff_references.referee_email_domain is 'Domain extracted from referee_email; stored for future Ofsted cross-check';
comment on column staff_references.setting_urn is 'Ofsted URN of setting (required for professional references)';
comment on column staff_references.status is 'draft → sent → viewed → submitted | expired | cancelled';


-- ============================================================================
-- 3. REFERENCE_REQUESTS TABLE
-- ============================================================================
create table reference_requests (
  id                 uuid primary key default gen_random_uuid(),
  staff_reference_id uuid not null references staff_references(id) on delete cascade,
  token_hash         text not null unique,  -- SHA-256 hex of raw token; raw token NEVER stored
  expires_at         timestamptz not null,
  sent_at            timestamptz not null default now(),
  viewed_at          timestamptz,
  submitted_at       timestamptz,
  superseded_at      timestamptz,          -- set when a resend creates a newer request
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_reference_requests_token_hash    on reference_requests(token_hash);
create index idx_reference_requests_reference_id  on reference_requests(staff_reference_id);

create trigger update_reference_requests_updated_at
  before update on reference_requests
  for each row execute function update_updated_at_column();

-- RLS: all access via SECURITY DEFINER RPCs
alter table reference_requests enable row level security;

create policy "Staff can select own reference requests"
  on reference_requests for select
  using (
    exists (
      select 1 from staff_references sr
      where sr.id = reference_requests.staff_reference_id
        and sr.staff_user_id = auth.uid()
    )
  );

comment on table reference_requests is 'Tokenised one-use links sent to referees. Token stored as SHA-256 hash only.';
comment on column reference_requests.token_hash is 'SHA-256 hex digest of the raw token sent in the referee URL. Never store the raw token.';
comment on column reference_requests.superseded_at is 'Set when this request is replaced by a newer resend. Null = still active.';


-- ============================================================================
-- 4. REFERENCE_RESPONSES TABLE
-- ============================================================================
create table reference_responses (
  id                   uuid primary key default gen_random_uuid(),
  reference_request_id uuid not null unique references reference_requests(id) on delete cascade,
  answers_json         jsonb not null,
  created_at           timestamptz not null default now()
);

create index idx_reference_responses_request_id on reference_responses(reference_request_id);

-- RLS: only accessible via SECURITY DEFINER RPCs
alter table reference_responses enable row level security;

create policy "Admins can select all reference responses"
  on reference_responses for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

create policy "Staff can select own reference responses"
  on reference_responses for select
  using (
    exists (
      select 1 from reference_requests rr
      join staff_references sr on sr.id = rr.staff_reference_id
      where rr.id = reference_responses.reference_request_id
        and sr.staff_user_id = auth.uid()
    )
  );

comment on table reference_responses is 'Answers submitted by referees via their tokenised link.';
comment on column reference_responses.answers_json is 'Free-form JSONB storing questionnaire answers. Schema validated at API layer.';


-- ============================================================================
-- 5. SECURITY DEFINER RPCs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- upsert_staff_references
-- Idempotently creates or updates BOTH reference slots for the caller.
-- Uses ON CONFLICT (staff_user_id, type) so each applicant has exactly one
-- professional and one personal reference row.
-- ----------------------------------------------------------------------------
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
  p_personal_email_domain         text
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

  -- Upsert personal reference
  insert into staff_references (
    staff_user_id, type,
    referee_name, referee_position, referee_email, referee_email_domain,
    status
  ) values (
    v_user_id, 'personal',
    p_personal_referee_name, p_personal_referee_position,
    p_personal_referee_email, p_personal_email_domain,
    'draft'
  )
  on conflict (staff_user_id, type) do update set
    referee_name         = excluded.referee_name,
    referee_position     = excluded.referee_position,
    referee_email        = excluded.referee_email,
    referee_email_domain = excluded.referee_email_domain,
    updated_at           = now()
  returning id into v_pers_id;

  return jsonb_build_object(
    'professional_id', v_prof_id,
    'personal_id',     v_pers_id
  );
end;
$$;

grant execute on function upsert_staff_references(text,text,text,text,text,text,text,text,text,text) to anon, authenticated;


-- ----------------------------------------------------------------------------
-- create_reference_request
-- Creates a tokenised link for a reference. Supersedes any prior active
-- (un-submitted, un-superseded) requests so old links stop working.
-- ----------------------------------------------------------------------------
create or replace function create_reference_request(
  p_staff_reference_id uuid,
  p_token_hash         text,
  p_expires_at         timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_user_id    uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Verify the reference belongs to the caller
  if not exists (
    select 1 from staff_references
    where id = p_staff_reference_id and staff_user_id = v_user_id
  ) then
    raise exception 'Reference not found or access denied';
  end if;

  -- Supersede any prior active requests (preserves submitted_at audit trail)
  update reference_requests set
    superseded_at = now(),
    updated_at    = now()
  where staff_reference_id = p_staff_reference_id
    and submitted_at  is null
    and superseded_at is null;

  -- Create the new request
  insert into reference_requests (
    staff_reference_id, token_hash, expires_at, sent_at
  ) values (
    p_staff_reference_id, p_token_hash, p_expires_at, now()
  )
  returning id into v_request_id;

  -- Advance reference status to 'sent'
  update staff_references set
    status     = 'sent',
    updated_at = now()
  where id = p_staff_reference_id;

  return v_request_id;
end;
$$;

grant execute on function create_reference_request to anon, authenticated;


-- ----------------------------------------------------------------------------
-- resolve_reference_token
-- Used by the referee landing page (server component, no user session).
-- Validates the token, records viewed_at on first call, returns request data.
-- Superseded tokens return TOKEN_NOT_FOUND so the referee sees the same error
-- as an invalid link (they should use the newer link in their inbox).
-- ----------------------------------------------------------------------------
create or replace function resolve_reference_token(
  p_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req  reference_requests%rowtype;
  v_ref  staff_references%rowtype;
  v_prof staff_profiles%rowtype;
begin
  select * into v_req
  from reference_requests
  where token_hash = p_token_hash;

  if not found then
    raise exception 'TOKEN_NOT_FOUND';
  end if;

  -- Superseded links are treated as not found
  if v_req.superseded_at is not null then
    raise exception 'TOKEN_NOT_FOUND';
  end if;

  if v_req.submitted_at is not null then
    raise exception 'TOKEN_ALREADY_USED';
  end if;

  if v_req.expires_at < now() then
    update staff_references set status = 'expired', updated_at = now()
    where id = v_req.staff_reference_id
      and status not in ('submitted', 'cancelled');
    raise exception 'TOKEN_EXPIRED';
  end if;

  -- Record first view (idempotent)
  if v_req.viewed_at is null then
    update reference_requests set viewed_at = now(), updated_at = now()
    where id = v_req.id;

    update staff_references set status = 'viewed', updated_at = now()
    where id = v_req.staff_reference_id
      and status = 'sent';
  end if;

  select * into v_ref from staff_references where id = v_req.staff_reference_id;
  select * into v_prof from staff_profiles   where id = v_ref.staff_user_id;

  return jsonb_build_object(
    'request_id',       v_req.id,
    'reference_id',     v_ref.id,
    'reference_type',   v_ref.type,
    'referee_name',     v_ref.referee_name,
    'referee_position', v_ref.referee_position,
    'applicant_name',   v_prof.full_name,
    'expires_at',       v_req.expires_at
  );
end;
$$;

grant execute on function resolve_reference_token to service_role, authenticated;


-- ----------------------------------------------------------------------------
-- submit_reference_response
-- Called by POST /api/r/reference/[token]/submit (public endpoint).
-- Validates token, stores answers, marks submitted.
-- ----------------------------------------------------------------------------
create or replace function submit_reference_response(
  p_token_hash  text,
  p_answers     jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req reference_requests%rowtype;
begin
  select * into v_req
  from reference_requests
  where token_hash = p_token_hash;

  if not found then
    raise exception 'TOKEN_NOT_FOUND';
  end if;

  if v_req.superseded_at is not null then
    raise exception 'TOKEN_NOT_FOUND';
  end if;

  if v_req.submitted_at is not null then
    raise exception 'TOKEN_ALREADY_USED';
  end if;

  if v_req.expires_at < now() then
    raise exception 'TOKEN_EXPIRED';
  end if;

  -- Store the response
  insert into reference_responses (reference_request_id, answers_json)
  values (v_req.id, p_answers);

  -- Mark request submitted
  update reference_requests set
    submitted_at = now(),
    updated_at   = now()
  where id = v_req.id;

  -- Advance parent reference status
  update staff_references set
    status     = 'submitted',
    updated_at = now()
  where id = v_req.staff_reference_id;
end;
$$;

grant execute on function submit_reference_response to service_role, authenticated;


-- ----------------------------------------------------------------------------
-- get_my_references
-- Returns current references + latest request status for the applicant UI.
-- ----------------------------------------------------------------------------
create or replace function get_my_references()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_result  jsonb;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'id',            sr.id,
      'type',          sr.type,
      'referee_name',  sr.referee_name,
      'referee_email', sr.referee_email,
      'status',        sr.status,
      'setting_urn',   sr.setting_urn,
      'setting_name',  sr.setting_name,
      'latest_request', (
        select jsonb_build_object(
          'id',           rr.id,
          'sent_at',      rr.sent_at,
          'viewed_at',    rr.viewed_at,
          'submitted_at', rr.submitted_at,
          'expires_at',   rr.expires_at
        )
        from reference_requests rr
        where rr.staff_reference_id = sr.id
          and rr.superseded_at is null   -- only the active request
        order by rr.created_at desc
        limit 1
      )
    )
    order by sr.type  -- 'personal' before 'professional' alphabetically; adjust if needed
  )
  into v_result
  from staff_references sr
  where sr.staff_user_id = v_user_id;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

grant execute on function get_my_references to anon, authenticated;


-- ============================================================================
-- Reload PostgREST schema cache
-- ============================================================================
notify pgrst, 'reload schema';
