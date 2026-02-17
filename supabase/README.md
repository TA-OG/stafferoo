# Supabase Migrations

This directory contains SQL migrations for the REC-APP database schema.

## Applying Migrations

Since we are not using the Supabase CLI yet, apply migrations manually through the Supabase dashboard.

### Steps

1. Open your Supabase project dashboard at https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the migration file from `supabase/migrations/0001_initial.sql`
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click **Run** or press `Ctrl+Enter`
8. Verify success by checking the **Table Editor** for the new tables

### Migration Files

- `0001_initial.sql` - Creates staff_profiles, staff_documents, and id_verifications tables with RLS policies

## Verifying Tables

After running the migration, verify the tables exist:

```sql
select table_name 
from information_schema.tables 
where table_schema = 'public' 
and table_name in ('staff_profiles', 'staff_documents', 'id_verifications');
```

## Row Level Security

All tables have RLS enabled with the following access patterns:

- **staff_profiles**: Users can manage their own profile. Admins can view all.
- **staff_documents**: Users can view and upload their own documents. Admins can view all.
- **id_verifications**: Users can view their own verifications. Server-side insert only. Admins can view all.

## Admin Access

Admin users are identified by having `role: 'admin'` in their `auth.users.raw_user_meta_data` field.

To grant admin access to a user:

```sql
update auth.users
set raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
where email = 'admin@example.com';
```

## Future Migrations

When adding new migrations:

1. Create a new file with incrementing number: `0002_description.sql`
2. Add a comment header with description and date
3. Apply manually through the dashboard
4. Document in this README
