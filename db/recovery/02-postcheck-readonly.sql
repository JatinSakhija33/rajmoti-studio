-- RAJMOTI STUDIO — POST-INSTALL VERIFICATION (READ ONLY)
-- Project: ujxecliohalltcglttsr. Run after 01-complete-schema-roles-existing.sql succeeds.
-- No data is changed in this file.

-- A. Check tables and RLS.
WITH expected(name) AS (VALUES
 ('user_roles'), ('profiles'), ('customers'), ('contact_notes'), ('contact_tasks'),
 ('inquiries'), ('bookings'), ('calendar_events'), ('studio_notes'), ('reminders'),
 ('customer_dates'), ('milestone_configs'), ('reminder_offers'), ('message_templates'),
 ('categories'), ('subcategories'), ('images'), ('packages'), ('package_features'),
 ('site_content'), ('settings'), ('reels'), ('gift_orders'), ('studio_jobs'),
 ('booking_services'), ('booking_packages'), ('booking_themes'), ('booking_poses'),
 ('booking_hours'), ('booking_blocked_dates'), ('booking_offers'),
 ('slug_redirects'), ('google_contact_accounts'), ('google_oauth_states')
)
SELECT name, to_regclass(format('public.%I',name)) IS NOT NULL AS exists,
       COALESCE(c.relrowsecurity,false) AS rls_enabled
FROM expected
LEFT JOIN pg_class c ON c.oid=to_regclass(format('public.%I',name))
ORDER BY name;

-- B. Authorized owners, WITHOUT reading/exposing passwords.
SELECT u.email, u.email_confirmed_at IS NOT NULL AS confirmed,
  EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=u.id AND r.role='admin'::public.app_role) AS admin_role
FROM auth.users u
WHERE lower(u.email) IN ('rajmotistudio@gmail.com', 'jatinsakhija@gmail.com')
ORDER BY u.email;

-- C. Ensure no public business tables were accidentally left without RLS.
SELECT c.relname AS table_without_rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relrowsecurity=false
ORDER BY c.relname;

-- D. Check tables have explicit authenticated API grants; RLS still controls rows.
SELECT t.table_name,
  has_table_privilege('authenticated', format('public.%I',t.table_name), 'SELECT') AS authenticated_can_query_table,
  has_table_privilege('anon', format('public.%I',t.table_name), 'SELECT') AS anonymous_can_query_table
FROM information_schema.tables t
WHERE t.table_schema='public' AND t.table_type='BASE TABLE'
ORDER BY t.table_name;

-- E. Read effective policies on sensitive customer and job tables.
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies WHERE schemaname='public'
AND tablename IN (
  'customers','contact_notes','contact_tasks','reminders',
  'bookings','studio_jobs','gift_orders','user_roles'
)
ORDER BY tablename, policyname;

-- F. Photo buckets should be private for customer originals.
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id IN ('gallery','reels','gift-order-photos','studio-job-files')
ORDER BY id;

-- G. No historical contacts/images are fabricated by schema creation.
-- These counts show NEW database rows, not what Lovable used to contain.
SELECT 'customers' AS name, COUNT(*) AS row_count FROM public.customers
UNION ALL SELECT 'bookings', COUNT(*) FROM public.bookings
UNION ALL SELECT 'studio_jobs', COUNT(*) FROM public.studio_jobs
UNION ALL SELECT 'images', COUNT(*) FROM public.images;

-- H. Check PostgREST sees the new schema after all scripts were committed.
-- Run the following separately if /admin still reports schema-cache errors:
-- NOTIFY pgrst, 'reload schema';
