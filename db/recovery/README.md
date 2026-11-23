# Rajmoti Studio — database recovery SQL package

**Target only:** Supabase project `ujxecliohalltcglttsr`.
**Safety status:** Generated and source-reviewed from GitHub; **not executed or
integration-tested against the owner's Supabase database**. The connected
Supabase account cannot access this project.

## What the screenshot means

`PGRST205: Could not find table public.customers in the schema cache` is
consistent with a missing base `customers` table. The earlier SQL error
`42P01: public.user_roles does not exist` confirms the new project was at
least partially uninitialized. Run the read-only preflight before deciding
whether this is a missing table or a stale PostgREST schema cache.

## Files (run in this order, ONLY after inspection)

1. `00-preflight-readonly.sql` — list expected tables, RLS and existing
   admin accounts. **Run first and review the results**. No writes.
2. `01-complete-schema-roles-existing.sql` — **conditionally applicable
   only if public contains public.user_roles and no other business tables**.
   One transaction with early guards and RLS security assertions. It
   preserves existing Supabase Auth users and roles. NOT compatible with
   partially installed business tables or an existing dataset. Back up before
   executing. This installs structure, *not* old customer/gallery records.
3. `02-postcheck-readonly.sql` — confirm expected tables, RLS, Auth grants,
   owner access, and private storage buckets. No writes.
4. `03-performance-indexes.sql` — optional performance indexes for contact
   search, follow-ups and active work queues. Run separately after migration,
   preferably when studio traffic is quiet.

## Crucial historical source deviations

The original 41 migration files are retained unchanged in
`supabase/migrations/`; this recovery installer reads them in order but
intentionally **excludes five dangerous or test-only changes**:

- `20260622050558`: auto-admin assignment based on a hard-coded email.
- `20260622052051`: anonymous execution grant for the role-check RPC.
- `20260818095631`: creates/deletes test images and assumes seeded categories.
- `20260826141001`: permissive `USING (true)` access to private customer,
  contact, task and reminder records by any signed-in user.
- `20260826152147`: rewrites admin-only policies to any signed-in user.

The installer also deliberately removes **unapproved price seeds** from the
original packages and reels migrations. The original source's pricing was
unverified and may be far above the Jetpur studio's real prices.

A single-transaction installer cannot recreate customer contacts, bookings,
uploaded originals, Google OAuth tokens or old Lovable Supabase rows. Those
must be separately migrated from authorized backups. No customer data is
uploaded or modified by the package itself.

## Do not run the full installer if...

- The preflight finds **any** business table other than `public.user_roles`
  (examples: `profiles`, `customers`, `images`, `studio_jobs`).
- Original schema migrations have already been partially applied.
- The roles table, RLS or `public.has_role` function is missing.
- The project already contains real customer records or media metadata.
- You have not backed up the current project and cannot restore it.

In those cases, compare the output against migrations and prepare a
custom **incremental** schema diff instead. Do not bypass the guards or disable
RLS to make a query succeed.

## After schema setup

- SQL Editor can read the tables, but website access still depends on Data
  API exposure, `GRANT` permissions and RLS; the postcheck covers this.
- After writes, `NOTIFY pgrst, 'reload schema';` refreshes the PostgREST
  schema cache. Do not assume it creates missing tables.
- Test `/admin/contacts`, `/admin/workflow`, bookings, CRM, settings and
  media with authorized login and a clearly labelled test record; delete only
  that test record after confirmation.
- Open `/admin/system` from the admin-OS preview PR after it is deployed.
- Gift orders through Cloudflare D1/R2/Pages Functions are a **separate**
  backend. The `/admin/catalogue` page currently saves browser-local data.
  Neither is made fully production-ready solely by this Supabase schema.

## Security acceptance criteria

- Exactly the intended admin accounts are authorized (no email-based
  automatic admin assignment for future signups).
- A non-admin authenticated user cannot read or write private contacts,
  bookings, payments, workflows or customer photos.
- No customer image bucket is publicly readable.
- No public `service_role` key is included in Vite/Cloudflare public settings.
- Unapproved seed prices or orders are not presented as real.
- A status of `success` in the SQL editor is not equivalent to verified
  functioning admin pages; perform real save/read-back tests.

## Research sources

- Supabase official migration guidance:
  https://supabase.com/docs/guides/deployment/database-migrations
- Supabase Postgres RLS:
  https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase cache reload:
  https://supabase.com/kb/troubleshooting/refresh-postgrest-schema
