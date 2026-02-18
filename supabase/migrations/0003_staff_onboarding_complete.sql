-- Migration: 0003_staff_onboarding_complete
-- Description: Expand staff_profiles and staff_documents for full onboarding spec
-- Created: 2026-02-17

-- ============================================================================
-- ALTER TABLE: staff_profiles (add missing columns)
-- ============================================================================

alter table staff_profiles
  add column if not exists national_insurance_number text,
  add column if not exists date_of_birth date,
  add column if not exists address_line_1 text,
  add column if not exists address_line_2 text,
  add column if not exists city text,
  add column if not exists latitude numeric(10, 7),
  add column if not exists longitude numeric(10, 7),
  add column if not exists dbs_certificate_number text,
  add column if not exists dbs_issue_date date,
  add column if not exists dbs_surname_on_certificate text,
  add column if not exists criminal_conviction_details text,
  add column if not exists emergency_contact_1_name text,
  add column if not exists emergency_contact_1_phone text,
  add column if not exists emergency_contact_1_relationship text,
  add column if not exists emergency_contact_2_name text,
  add column if not exists emergency_contact_2_phone text,
  add column if not exists emergency_contact_2_relationship text,
  add column if not exists gp_name text,
  add column if not exists gp_address text,
  add column if not exists health_declaration jsonb,
  add column if not exists smoking_declaration text,
  add column if not exists drugs_alcohol_declaration text,
  add column if not exists disqualified_person_declaration boolean not null default false,
  add column if not exists digital_signature_svg text,
  add column if not exists digital_signature_signed_at timestamptz,
  add column if not exists available_now boolean not null default false,
  add column if not exists availability_schedule jsonb,
  add column if not exists submitted_at timestamptz;

-- Update verification_status to use enum-like check constraint
alter table staff_profiles drop constraint if exists staff_profiles_verification_status_check;
alter table staff_profiles
  add constraint staff_profiles_verification_status_check
  check (verification_status in ('draft', 'pending', 'approved', 'rejected'));

-- Update default for new profiles
alter table staff_profiles
  alter column verification_status set default 'draft';

-- ============================================================================
-- ALTER TABLE: staff_documents (add missing columns for file metadata)
-- ============================================================================

alter table staff_documents
  add column if not exists original_filename text,
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint;

-- Rename file_name to original_filename if needed (idempotent)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'staff_documents' and column_name = 'file_name'
  ) and not exists (
    select 1 from information_schema.columns
    where table_name = 'staff_documents' and column_name = 'original_filename'
  ) then
    alter table staff_documents rename column file_name to original_filename;
  end if;
end $$;

-- Add uploaded_at column
alter table staff_documents
  add column if not exists uploaded_at timestamptz not null default now();

-- Update created_at to be uploaded_at semantically
comment on column staff_documents.uploaded_at is 'Timestamp when file was uploaded to storage';

-- Add doc_type constraint
alter table staff_documents drop constraint if exists staff_documents_doc_type_check;
alter table staff_documents
  add constraint staff_documents_doc_type_check
  check (doc_type in (
    'dbs_certificate',
    'safeguarding_certificate',
    'paediatric_first_aid',
    'right_to_work',
    'qualification_certificate'
  ));

-- ============================================================================
-- INDEXES
-- ============================================================================

create index if not exists idx_staff_profiles_postcode on staff_profiles(postcode);
create index if not exists idx_staff_profiles_submitted_at on staff_profiles(submitted_at);
create index if not exists idx_staff_documents_doc_type on staff_documents(doc_type);

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on column staff_profiles.national_insurance_number is 'UK National Insurance Number';
comment on column staff_profiles.date_of_birth is 'Date of birth for age verification';
comment on column staff_profiles.latitude is 'Geocoded latitude from postcode (nullable, geocoding done later)';
comment on column staff_profiles.longitude is 'Geocoded longitude from postcode (nullable, geocoding done later)';
comment on column staff_profiles.dbs_certificate_number is 'DBS certificate number';
comment on column staff_profiles.dbs_issue_date is 'Date DBS certificate was issued';
comment on column staff_profiles.dbs_surname_on_certificate is 'Surname as it appears on DBS certificate';
comment on column staff_profiles.criminal_conviction_details is 'Details if criminal_conviction_declared is true';
comment on column staff_profiles.health_declaration is 'JSONB storing 14 health conditions and notes';
comment on column staff_profiles.smoking_declaration is 'Smoking status declaration';
comment on column staff_profiles.drugs_alcohol_declaration is 'Drugs and alcohol declaration';
comment on column staff_profiles.disqualified_person_declaration is 'Declaration that person is not disqualified from working with children';
comment on column staff_profiles.digital_signature_svg is 'SVG or base64 representation of digital signature';
comment on column staff_profiles.digital_signature_signed_at is 'Timestamp when signature was captured';
comment on column staff_profiles.available_now is 'Whether staff member is currently available for bookings';
comment on column staff_profiles.availability_schedule is 'JSONB storing weekly availability schedule';
comment on column staff_profiles.submitted_at is 'Timestamp when onboarding was submitted for review';
comment on column staff_profiles.verification_status is 'Onboarding status: draft, pending, approved, rejected';

comment on column staff_documents.original_filename is 'Original filename as uploaded by user';
comment on column staff_documents.mime_type is 'MIME type of the uploaded file';
comment on column staff_documents.size_bytes is 'File size in bytes';
comment on column staff_documents.doc_type is 'Document type: dbs_certificate, safeguarding_certificate, paediatric_first_aid, right_to_work, qualification_certificate';
