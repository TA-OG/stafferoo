-- Migration: 0028_auto_enable_rls_trigger
-- Description: Automatically enable RLS on all new tables created in public schema
-- Zero user friction - works behind the scenes
-- Source: Supabase best practices

-- Create the function that enables RLS on new tables
CREATE OR REPLACE FUNCTION public.enable_rls_on_new_table()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE command_tag = 'CREATE TABLE'
  LOOP
    -- Enable RLS on the newly created table
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', obj.schema_name, obj.object_name);
    
    -- Log for audit purposes (silent, no user impact)
    RAISE NOTICE 'Auto-enabled RLS on table: %.%', obj.schema_name, obj.object_name;
  END LOOP;
END;
$$;

-- Drop the trigger if it exists (idempotent)
DROP EVENT TRIGGER IF EXISTS auto_enable_rls_trigger;

-- Create the event trigger
CREATE EVENT TRIGGER auto_enable_rls_trigger
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION public.enable_rls_on_new_table();

-- Also fix any existing tables that might have been missed
DO $$
DECLARE
  tbl record;
BEGIN
  FOR tbl IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND rowsecurity = false
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE '_realtime%'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', tbl.schemaname, tbl.tablename);
    RAISE NOTICE 'Fixed RLS on existing table: %.%', tbl.schemaname, tbl.tablename;
  END LOOP;
END $$;

COMMENT ON FUNCTION public.enable_rls_on_new_table() IS 
  'Automatically enables RLS on all new tables. Zero user impact, maximum security.';
