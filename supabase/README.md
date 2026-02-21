# Supabase Migrations

This directory contains SQL migration files for the Stafferoo database schema.

## Migration Files

Migrations are numbered sequentially and should be applied in order:

1. **0001_initial.sql** - Initial staff profiles, documents, and ID verifications tables
2. **0002_settings.sql** - Settings profiles and audit logs tables
3. **0003_staff_onboarding_complete.sql** - Extended staff profiles with full onboarding fields
4. **0004_postcode_gating.sql** - Postcode enablement for controlled rollout
5. **0005_staff_system_simplified.sql** - Staff verifications table and document status updates

## How to Apply Migrations

Since we are not using the Supabase CLI yet, migrations must be applied manually through the Supabase Dashboard.

### Steps to Apply a Migration

1. **Log in to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy Migration SQL**
   - Open the migration file you want to apply (e.g., `0005_staff_system_simplified.sql`)
   - Copy the entire contents

4. **Execute Migration**
   - Paste the SQL into the query editor
   - Click "Run" or press Ctrl+Enter
   - Wait for the query to complete
   - Check for any errors in the output

5. **Verify Migration**
   - Go to "Table Editor" to verify tables were created/updated
   - Check "Database" → "Policies" to verify RLS policies

### Migration Order

**IMPORTANT:** Always apply migrations in numerical order. Do not skip migrations.

If you are setting up a fresh database:
1. Apply 0001_initial.sql
2. Apply 0002_settings.sql
3. Apply 0003_staff_onboarding_complete.sql
4. Apply 0004_postcode_gating.sql
5. Apply 0005_staff_system_simplified.sql

### Checking Applied Migrations

To see which migrations have been applied, you can check:
- The existence of tables mentioned in each migration
- The structure of tables (columns, constraints)
- The presence of RLS policies

### Rollback

There are no automatic rollback scripts. If you need to undo a migration:
1. Manually write the reverse SQL operations
2. Test thoroughly in a development environment first
3. Apply carefully in production

## Environment Variables Required

After applying migrations, ensure these environment variables are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAIL_ALLOWLIST=admin@example.com,admin2@example.com
```

## Row Level Security (RLS)

All tables have RLS enabled. Key policies:

- **staff_profiles**: Staff can select/update their own row
- **staff_documents**: Staff can select/insert their own documents
- **staff_verifications**: Staff can select their own verification status
- **Admin access**: Admins (via service role key) can access all data

## Service Role Key Usage

The service role key bypasses RLS and should ONLY be used:
- In server-side API routes under `/api/admin/`
- Never exposed to the client
- Protected by admin email allowlist

## Troubleshooting

### Error: "relation already exists"
- The table was already created. This is usually safe to ignore.
- Check if the migration was partially applied before.

### Error: "permission denied"
- Ensure you are logged in as the project owner
- Check that RLS policies are correctly defined

### Error: "column does not exist"
- A previous migration may not have been applied
- Apply migrations in order from 0001 onwards

## Future Migrations

When creating new migrations:
1. Create a new file with the next number (e.g., `0006_feature_name.sql`)
2. Include a header comment with migration name, description, and date
3. Use `if not exists` clauses where appropriate to make migrations idempotent
4. Add comments explaining complex logic
5. Test in development before applying to production
6. Update this README with the new migration details
