-- Rajmoti Studio: READ-ONLY PRE-FLIGHT
-- Run in the Supabase SQL Editor for project ujxecliohalltcglttsr.
-- No database writes. This tells you whether the guarded full installer is safe.
WITH required(name) AS (
  VALUES ('profiles'),('user_roles'),('categories'),('subcategories'),('images'),
    ('packages'),('package_features'),('inquiries'),('testimonials'),('settings'),
    ('image_favorites'),('image_faces'),('image_similar_groups'),('image_similar_members'),
    ('site_content'),('booking_slots'),('booking_services'),('booking_packages'),
    ('booking_themes'),('booking_poses'),('booking_hours'),('booking_blocked_dates'),
    ('booking_offers'),('customers'),('customer_dates'),('milestone_configs'),
    ('reminder_offers'),('message_templates'),('reminders'),('calendar_events'),
    ('studio_notes'),('slug_redirects'),('google_contact_accounts'),
    ('google_oauth_states'),('contact_notes'),('contact_tasks'),('bookings'),
    ('reels'),('gift_orders'),('studio_jobs')
)
SELECT name AS expected_table, to_regclass(format('public.%I', name)) IS NOT NULL AS exists,
       COALESCE((SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = to_regclass(format('public.%I', name))), false) AS rls_enabled
FROM required
ORDER BY name;

-- Existing role grants (no account IDs or secrets printed).
SELECT u.email, u.email_confirmed_at IS NOT NULL AS email_confirmed,
       EXISTS (SELECT 1 FROM public.user_roles r
               WHERE r.user_id=u.id AND r.role::text='admin') AS has_admin_role
FROM auth.users u
WHERE lower(u.email) IN ('rajmotistudio@gmail.com','jatinsakhija@gmail.com')
ORDER BY u.email;

-- Check the main role-check function without calling it.
SELECT n.nspname AS schema, p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname='has_role';

-- Check any existing public table without RLS.
SELECT c.relname AS unsecured_public_table
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT c.relrowsecurity
ORDER BY c.relname;

-- Source migrations tracked as applied in this project, if table exists:
-- SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;
