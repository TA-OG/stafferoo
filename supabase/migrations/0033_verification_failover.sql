-- Migration: 0033_verification_failover
-- Description: Manual verification fallback system when email fails

-- ============================================================================
-- 1. MANUAL VERIFICATION REQUESTS
-- ============================================================================
create table if not exists verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('staff', 'setting')),
  
  -- Request details
  request_type text not null default 'email_failed' check (request_type in (
    'email_failed', 'email_timeout', 'spam_folder', 'no_access', 'admin_override'
  )),
  request_reason text,
  request_metadata jsonb default '{}'::jsonb,
  
  -- Status tracking
  status text not null default 'pending' check (status in (
    'pending', 'under_review', 'approved', 'rejected', 'auto_approved'
  )),
  
  -- Grace period access (allow limited access while pending)
  grace_period_ends_at timestamptz,
  grace_period_used boolean default false,
  
  -- Admin review
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  
  -- SMS fallback (if user provides phone)
  phone_number text,
  sms_code text,
  sms_code_expires_at timestamptz,
  sms_verified_at timestamptz,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_verification_requests_user on verification_requests(user_id);
create index if not exists idx_verification_requests_status on verification_requests(status, created_at);
create index if not exists idx_verification_requests_email on verification_requests(email);

drop trigger if exists update_verification_requests_updated_at on verification_requests;
create trigger update_verification_requests_updated_at
  before update on verification_requests
  for each row execute function update_updated_at_column();

-- ============================================================================
-- 2. TRUSTED DOMAINS (Auto-approve these domains)
-- ============================================================================
create table if not exists trusted_email_domains (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  description text,
  auto_approve boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 3. VERIFICATION AUDIT LOG
-- ============================================================================
create table if not exists verification_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in (
    'email_sent', 'email_confirmed', 'manual_requested', 'sms_sent', 
    'sms_confirmed', 'admin_approved', 'admin_rejected', 'grace_period_started',
    'auto_approved_domain', 'expired'
  )),
  performed_by uuid references auth.users(id), -- null if system action
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_verification_audit_user on verification_audit_log(user_id, created_at);

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================
alter table verification_requests enable row level security;
alter table trusted_email_domains enable row level security;
alter table verification_audit_log enable row level security;

-- Users can view their own requests
drop policy if exists "Users can view own verification requests" on verification_requests;
create policy "Users can view own verification requests"
  on verification_requests for select
  using (auth.uid() = user_id);

-- Users can insert their own request (one per user)
drop policy if exists "Users can create own verification request" on verification_requests;
create policy "Users can create own verification request"
  on verification_requests for insert
  with check (auth.uid() = user_id);

-- Admins can view all
drop policy if exists "Admins can view all verification requests" on verification_requests;
create policy "Admins can view all verification requests"
  on verification_requests for select
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can update verification requests" on verification_requests;
create policy "Admins can update verification requests"
  on verification_requests for update
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can manage trusted domains" on trusted_email_domains;
create policy "Admins can manage trusted domains"
  on trusted_email_domains for all
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can view audit log" on verification_audit_log;
create policy "Admins can view audit log"
  on verification_audit_log for select
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Function to request manual verification
create or replace function request_manual_verification(
  p_user_id uuid,
  p_email text,
  p_role text,
  p_request_type text default 'email_failed',
  p_request_reason text default null,
  p_phone_number text default null
) returns uuid as $$
declare
  v_request_id uuid;
  v_domain text;
  v_trusted boolean;
begin
  -- Extract domain from email
  v_domain := split_part(p_email, '@', 2);
  
  -- Check if domain is trusted
  select exists(
    select 1 from trusted_email_domains 
    where domain = v_domain and auto_approve = true
  ) into v_trusted;

  -- Insert request
  insert into verification_requests (
    user_id,
    email,
    role,
    request_type,
    request_reason,
    phone_number,
    status,
    grace_period_ends_at
  ) values (
    p_user_id,
    p_email,
    p_role,
    p_request_type,
    p_request_reason,
    p_phone_number,
    case when v_trusted then 'auto_approved' else 'pending' end,
    case when v_trusted then null else now() + interval '24 hours' end
  )
  returning id into v_request_id;

  -- If trusted domain, auto-approve
  if v_trusted then
    -- Update auth user to confirmed
    update auth.users
    set email_confirmed_at = now()
    where id = p_user_id;
    
    -- Log the auto-approval
    insert into verification_audit_log (user_id, action, metadata)
    values (p_user_id, 'auto_approved_domain', jsonb_build_object('domain', v_domain));
  else
    -- Log the request
    insert into verification_audit_log (user_id, action, metadata)
    values (p_user_id, 'manual_requested', jsonb_build_object('request_id', v_request_id));
  end if;

  return v_request_id;
end;
$$ language plpgsql security definer;

-- Function to approve verification (admin)
create or replace function approve_verification(
  p_request_id uuid,
  p_admin_id uuid,
  p_notes text default null
) returns boolean as $$
declare
  v_user_id uuid;
begin
  -- Get the user_id from request
  select user_id into v_user_id
  from verification_requests
  where id = p_request_id and status = 'pending';

  if v_user_id is null then
    return false;
  end if;

  -- Update request
  update verification_requests
  set status = 'approved',
      reviewed_by = p_admin_id,
      reviewed_at = now(),
      review_notes = p_notes
  where id = p_request_id;

  -- Confirm the user's email in auth
  update auth.users
  set email_confirmed_at = now()
  where id = v_user_id;

  -- Log the approval
  insert into verification_audit_log (user_id, action, performed_by, metadata)
  values (v_user_id, 'admin_approved', p_admin_id, jsonb_build_object('request_id', p_request_id));

  return true;
end;
$$ language plpgsql security definer;

-- Function to generate SMS code
create or replace function generate_sms_verification_code(
  p_request_id uuid
) returns text as $$
declare
  v_code text;
begin
  -- Generate 6-digit code
  v_code := lpad(floor(random() * 1000000)::int::text, 6, '0');
  
  update verification_requests
  set sms_code = v_code,
      sms_code_expires_at = now() + interval '10 minutes'
  where id = p_request_id;

  return v_code;
end;
$$ language plpgsql security definer;

-- Function to verify SMS code
create or replace function verify_sms_code(
  p_request_id uuid,
  p_code text
) returns boolean as $$
declare
  v_request verification_requests%rowtype;
begin
  select * into v_request
  from verification_requests
  where id = p_request_id;

  if v_request is null then
    return false;
  end if;

  if v_request.sms_code != p_code then
    return false;
  end if;

  if v_request.sms_code_expires_at < now() then
    return false;
  end if;

  -- Mark as verified
  update verification_requests
  set sms_verified_at = now(),
      status = 'approved'
  where id = p_request_id;

  -- Confirm user's email
  update auth.users
  set email_confirmed_at = now()
  where id = v_request.user_id;

  -- Log
  insert into verification_audit_log (user_id, action, metadata)
  values (v_request.user_id, 'sms_confirmed', jsonb_build_object('request_id', p_request_id));

  return true;
end;
$$ language plpgsql security definer;

-- Function to check if user has grace period access
create or replace function has_grace_period_access(p_user_id uuid)
returns boolean as $$
declare
  v_request verification_requests%rowtype;
begin
  select * into v_request
  from verification_requests
  where user_id = p_user_id
    and status in ('pending', 'under_review')
    and grace_period_ends_at > now()
  order by created_at desc
  limit 1;

  return v_request is not null;
end;
$$ language plpgsql security definer;

notify pgrst, 'reload schema';
