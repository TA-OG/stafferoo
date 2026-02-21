-- Migration: 0009_fix_staff_documents_schema
-- Description:
--   Migration 0003 added `original_filename` and then tried to rename `file_name`
--   to `original_filename` in the same migration. The rename was silently skipped
--   because the `add column if not exists original_filename` already created the
--   column before the rename block ran. This left both columns present with
--   `file_name text not null` still enforced.
--
--   Fix:
--   1. Drop the NOT NULL constraint on file_name (make it a nullable legacy alias).
--   2. Backfill file_name from original_filename for any existing rows so the
--      data is consistent if anyone queries the old column.
--   3. Drop file_name entirely — original_filename is the canonical column.
--   4. Ensure original_filename carries a NOT NULL constraint going forward.
--   5. Re-create the insert_staff_document SECURITY DEFINER function to match
--      the final, canonical column set.
--   6. NOTIFY PostgREST to reload schema cache.

-- ============================================================================
-- 1. Backfill file_name → original_filename for any rows where it is null
-- ============================================================================
update staff_documents
set original_filename = file_name
where original_filename is null
  and file_name is not null;

-- ============================================================================
-- 2. Drop the legacy file_name column entirely
--    (safe: original_filename is the canonical column and is backfilled)
-- ============================================================================
alter table staff_documents drop column if exists file_name;

-- ============================================================================
-- 3. Ensure original_filename is NOT NULL going forward
-- ============================================================================
alter table staff_documents alter column original_filename set not null;

-- ============================================================================
-- 4. Re-create SECURITY DEFINER function with correct canonical column set
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
  if auth.uid() <> p_staff_id then
    raise exception 'Permission denied: you can only upload documents for your own profile';
  end if;

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
-- 5. Reload PostgREST schema cache
-- ============================================================================
notify pgrst, 'reload schema';
