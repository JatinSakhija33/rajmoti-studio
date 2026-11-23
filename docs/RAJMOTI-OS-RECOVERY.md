# Rajmoti OS — production admin recovery runbook

> This is a **read-first runbook**, not a one-click migration. The production
> Supabase project currently requires independent schema verification. Do not
> run all historical migrations blindly against partially restored tables.

## Systems involved

- Production UI: `https://rajmotistudio.in/admin` (Cloudflare Pages / Vite SPA).
- Login and role checks: Supabase Auth + `public.has_role(auth.uid(), 'admin')`.
- Standard studio modules: Supabase Postgres with Row Level Security (RLS).
- Production jobs and private originals: `public.studio_jobs` plus private
  `storage.buckets['studio-job-files']`.
- Direct gift checkout payments: **separate** Cloudflare Pages Functions / D1
  / R2 configuration; these routes are not satisfied by creating Supabase
  `gift_orders` alone.
- Product catalogue manager: **browser local only** in current code. Its
  saved changes are not shared with other devices or automatically published.

The UI now includes `/admin/system` to show read-only checks for database
dependencies. A successful read is not proof that write RLS policies work.

## One-time preflight in Supabase SQL Editor (READ ONLY)

**Verify the SQL editor is running against the intended Rajmoti Supabase project.
Never run this in a separate app project's database.**

```sql
-- Confirm the role-check function and table without modifying anything.
select
  current_database() as database_name,
  to_regclass('public.user_roles') as roles_table,
  to_regprocedure('public.has_role(uuid,public.app_role)') as role_check_function;

-- Reveal missing business schema. NULL means the table does not exist.
with expected(table_name) as (
  values
    ('customers'), ('inquiries'), ('bookings'), ('studio_jobs'),
    ('contact_notes'), ('contact_tasks'), ('calendar_events'), ('studio_notes'),
    ('gift_orders'), ('categories'), ('subcategories'), ('images'),
    ('reels'), ('packages'), ('package_features'), ('site_content'),
    ('settings'), ('customer_dates'), ('reminders'), ('message_templates'),
    ('booking_services'), ('booking_packages'), ('booking_hours')
)
select table_name, to_regclass('public.' || table_name) is not null as exists_in_public
from expected
order by table_name;

-- For every existing public table, ensure RLS is enabled.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

If the role enum `public.app_role` is absent, the first query's
`to_regprocedure` may fail before reporting the missing function. Fix
the original roles schema first or use a separate `pg_proc` inspection.

## Recovery sequence

1. Take a database backup and export current Auth user IDs. Never overwrite
   existing records or passwords.
2. Compare actual schema and `supabase_migrations.schema_migrations` against
   the ordered SQL files under `supabase/migrations/`. The original schema
   begins with `20260622050420_35f6172f-f7a5-4529-957b-fb115969c72b.sql`.
3. Reconcile the manually created `app_role`, `user_roles` and `has_role`
   with the original migration **before** applying the original set in a
   temporary/staging Supabase project. The earliest migration uses plain
   `CREATE TYPE` and `CREATE TABLE` and will collide with a partial manual
   installation if executed directly.
4. Validate the base `customers`, `tg_set_updated_at`, bookings, contact,
   category, storage and media schemas. Then apply the later migration
   `20261112090000_gifts_and_studio_workflow.sql` only after its dependencies
   exist, including `customers` and `gift_orders`.
5. Check the private storage buckets, path permissions, and RLS write rules
   with an actual authorized admin account. Never expose customer uploads
   through a public bucket or anonymous SELECT.
6. Confirm the two authorized owner accounts exist in Supabase Auth, are
   verified, and have `admin` membership in `public.user_roles`. Confirm
   `public.has_role(auth.uid(), 'admin')` works for those sessions and denies
   unauthenticated/non-admin sessions.
7. Restore real data from an authorized backup when available. Schema migrations
   alone **do not restore Lovable customer contacts, bookings or images**.
8. Configure Cloudflare D1/R2/Turnstile independently before enabling gift
   uploads, payment receipt recording or order APIs.
9. Run `/admin/system` after preview deployment and check every module with
   real create/edit/reload tests. Do not count the feature as operational merely
   because the health check shows a reachable table.
10. After tests, publish the PR by merging to `main`. Cloudflare's main
    deployment should rebuild automatically when configured.

## Essential acceptance tests

- Unauthenticated visitor never reaches `/admin`.
- Valid non-admin account cannot view or mutate private studio records.
- Admin creates a new workflow job; refresh on another trusted device shows
  the same record and correct status.
- Offline job saved on this browser is clearly labelled **unsynced**, and
  later sync produces one database row without overwriting the original.
- Photo original uploads use a new private path and edited copy uses a
  different path; neither is public.
- A session, enquiry and customer follow-up can be saved and read back.
- Dashboard does **not** display zero records if a query fails.
- Pricing, payment and gift orders never show as confirmed without
  production integrations and independent payment reconciliation.
- Mobile navigation opens, closes, and reaches all owner modules.
