-- Migration: 0008_insert_staff_document_fn
-- Description:
--   1. Fix staff_documents RLS insert policy — the original policy used a
--      subquery `staff_id in (select id from staff_profiles where id = auth.uid())`
--      which caused "permission denied for table users" because the inner RLS
--      evaluation touches auth.users. Replace with a direct `auth.uid() = staff_id`
--      check — simpler, faster, and zero internal permission issues.
--
--   2. Add insert_staff_document() SECURITY DEFINER function as belt-and-braces
--      for callers that prefer RPC (avoids schema cache being stale on first deploy).
--
--   3. NOTIFY PostgREST to reload its schema cache immediately.

-- ============================================================================
-- 1. Fix staff_documents RLS insert policy
-- ============================================================================

-- Drop the old policy that references staff_profiles (which itself has RLS that
-- touches auth.users, causing the permission error cascade).
drop policy if exists "Users can insert own documents" on staff_documents;

-- New policy: direct uid comparison — no subquery, no auth.users reference.
drop policy if exists "Staff can insert own documents" on staff_documents;
create policy "Staff can insert own documents"
  on staff_documents for insert
  with check (auth.uid() = staff_id);

-- ============================================================================
-- 2. SECURITY DEFINER function (belt-and-braces / alternative call path)
-- ============================================================================

create or replace function insert_staff_document(
  p_staff_id          uuid,
  p_doc_type          text,
  p_storage_path      text,
  p_original_filename text,
  p_mime_type         text,
  p_size_bytes        bigint
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_id uuid;
begin
  -- Enforce: caller may only insert documents for their own staff record
  if auth.uid() <> p_staff_id then
    raise exception 'Permission denied: you can only upload documents for your own profile';
  end if;

  -- Validate doc_type
  if p_doc_type not in (
    'dbs_certificate',
    'safeguarding_certificate',
    'paediatric_first_aid',
    'right_to_work',
    'qualification_certificate'
  ) then
    raise exception 'Invalid doc_type: %', p_doc_type;
  end if;

  insert into staff_documents (
    staff_id,
    doc_type,
    storage_path,
    original_filename,
    mime_type,
    size_bytes,
    status,
    uploaded_at
  ) values (
    p_staff_id,
    p_doc_type,
    p_storage_path,
    p_original_filename,
    p_mime_type,
    p_size_bytes,
    'pending',
    now()
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

grant execute on function insert_staff_document to anon, authenticated;

-- ============================================================================
-- 3. Reload PostgREST schema cache so the new function is visible immediately
-- ============================================================================
notify pgrst, 'reload schema';
