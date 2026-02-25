-- Migration: 0007_storage_buckets
-- Description: Create storage buckets for staff document uploads
-- Created: 2026-02-19

-- Create the staff-documents bucket (private, 10MB limit, allowed mime types)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'staff-documents',
  'staff-documents',
  false,
  10485760, -- 10MB in bytes
  array[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do nothing;

-- ============================================================================
-- STORAGE RLS POLICIES (idempotent — drop before create)
-- ============================================================================

drop policy if exists "Staff can upload own documents"  on storage.objects;
drop policy if exists "Staff can read own documents"    on storage.objects;
drop policy if exists "Staff can delete own documents"  on storage.objects;
drop policy if exists "Admins can read all documents"   on storage.objects;

-- Allow authenticated users to upload to their own folder (user_id/...)
create policy "Staff can upload own documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'staff-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to read their own documents
create policy "Staff can read own documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'staff-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own documents
create policy "Staff can delete own documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'staff-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow admins to read all documents
create policy "Admins can read all documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'staff-documents'
    and exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
