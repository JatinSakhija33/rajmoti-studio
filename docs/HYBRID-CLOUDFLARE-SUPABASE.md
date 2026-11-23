# Rajmoti Studio: Hybrid Cloudflare + Supabase (no duplicate public-photo transfer)

## What this actually achieves

This change makes the existing 385 approved public portfolio photographs readable
in **Supabase production mode** directly from the static manifest already
hosted on Cloudflare Pages. They do not need to be uploaded to Supabase or R2.

- **Cloudflare Pages:** existing 385 published/consented photos (1,155 WebP
  variants), static product imagery, and site pages. The 41 ZIP batches are
  unpacked during Vite's production build; their display-photo bytes already
  live on Cloudflare after deploy.
- **Supabase Postgres/Auth:** future single source of truth for customer
  records, CRM, bookings, payment metadata, workflow jobs and private admin roles.
  The app still needs the proper Supabase schema and RLS.
- **Cloudflare R2 (optional opt-in):** PRIVATE storage for *new* original/edited
  workflow photo attachments. An owner-validated Cloudflare Pages Function is
  the only read/upload gateway; never bind a public R2 custom domain.
- **Supabase Storage:** existing `studio-job-files` references remain readable,
  even after new uploads switch to R2. Nothing is silently moved or deleted.
- **Cloudflare D1:** the existing gift-order Functions already use
  `ORDER_DB` and `ORDER_PHOTOS`. These stay separate until a deliberate
  cross-system reconciliation is implemented. D1 is NOT a mirror of the CRM.

**No automatic migration:** Old Lovable database rows, Auth users, Storage
objects, local IndexedDB photos and browser-local catalogue edits do not exist
inside Cloudflare Pages assets. If you want those historical records, you MUST
restore/export them from their actual original source. Changing providers or
running this hybrid client code cannot recover information that is absent.

## Current status of code

The hybrid public photo read path is automatic in both demo and Supabase modes.
No new environment variable is needed to keep existing Cloudflare photos visible.

**Private R2 uploads are OFF by default.** Existing Supabase Storage continues
to handle new workflow photos until the Cloudflare configuration is validated
and the following explicit build setting is enabled.

## Activate new private R2 workflow file uploads

1. In Cloudflare dashboard → R2 → create a PRIVATE bucket, e.g.
   `rajmoti-private-workflow`. R2 may require billing details. Set usage
   alerts/limits; do not assume zero spending above the free tier.
2. Workers & Pages → `rajmoti-studio` → Settings → Bindings →
   add **R2 bucket binding** with exact variable name
   `STUDIO_PRIVATE_FILES`, pointing to that bucket.
   The binding is accessed SERVER-SIDE by the Pages Function only.
   This is independent of the already configured `ORDER_PHOTOS` bucket.
3. For the same Pages deployment environment, expose the already known
   public Supabase values (not secrets) to Pages Functions:
   - `VITE_SUPABASE_URL=https://ujxecliohalltcglttsr.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=<your publishable key>`
   Cloudflare's Function uses those values to validate Supabase Auth
   `/auth/v1/user` and verify the user's `admin` role with Supabase
   `/rest/v1/user_roles`. **No Supabase service-role key is needed**.
4. TEST on a Cloudflare PREVIEW deployment with valid owner and non-admin
   sessions. The `public.user_roles` table must exist, have RLS, and allow
   authenticated users to read their own role, without allowing updates.
5. Once verified, add the production **build variable**
   `VITE_STUDIO_MEDIA_PROVIDER=r2` and trigger a NEW production build.
   Client-side Vite settings only update after rebuild.
6. Create a test studio job; attach a small JPG and save/reload the job.
   Verify `original_path` starts `r2://studio-jobs/`. Attach an edited
   copy and verify both can be viewed only when signed in as admin.
7. Verify the old `studio-job-files` Supabase attachment references still
   preview correctly. No file migration is required by this provider change.

### Security rules

- R2 bucket MUST NOT be public. No r2.dev access, public custom domain or
  globally readable bucket token for customer originals.
- `/api/owner/studio-files` requires a verified Supabase user and a
  Supabase admin role; each read is authenticated.
- Uploads are limited to 20 MB per image and JPG/PNG/WebP/TIFF magic bytes.
  Every upload creates a fresh UUID-based immutable object key; old original
  files and old edits are not overwritten.
- Private previews are fetched with a Bearer token, converted into a browser
  Blob URL, and revoked when the studio editor closes. There are no public
  permanent links to private R2 photos.
- New R2 uploads are *opt-in*. If enabled without the R2 binding, upload
  fails clearly; it does not secretly divert files into another provider.
- No SQL table or Auth user is modified by this GitHub change.
- Back up R2 objects independently; free tiers are not archival backups.
- A Supabase `service_role` or `sb_secret_*` value must NEVER go into
  `VITE_*`, GitHub or browser code.

### Site/published photo limitation

The 385 bundled photographs are intentionally PUBLIC static files. They
cannot be hidden or retracted by setting `public.images.hidden` in Supabase:
remove them from the static photo manifest AND the built asset bundle and
redeploy. Future photos managed exclusively in Supabase can use admin CMS
hide/publish settings and RLS.

The existing `/admin/images` editor manages **Supabase images only**;
the built-in Cloudflare images are shown on the public portfolio but are
not independently editable from that admin page without migrating their
metadata. The prior separate PR #8 contains an *optional, metadata-only*
import, retaining Cloudflare image URLs, if editable admin management is
needed later.

## Acceptance tests before production merge

- Public `/portfolios/baby`, `/portfolios/maternity`,
  `/portfolios/family` show 301 / 44 / 40 already-approved photos even
  when business tables are missing.
- Public `/photo/<existing published id>` retains its URL.
- Live Supabase login roles, enquiries, contacts and workflow writes still
  use authenticated Supabase. No demo owner fallback.
- New Supabase CMS photos continue to appear in public categories and
  don't duplicate bundled `/portfolio/` URLs.
- Unauthorized R2 upload/read returns 403; absent R2 binding returns 503.
- Existing Supabase workflow file paths continue to work.
- Conversion of older Supabase gallery photos no longer deletes source objects.
- `/admin/storage` never presents database metadata bytes as measured R2 usage.

## Outstanding blockers not solved by hybrid photo hosting

- `PGRST205: public.customers` missing and other absent Supabase business
  tables: run read-only preflight, back up, apply reviewed schema as needed.
- Recover old Lovable customer records, bookings and private files from an
  authorized export. They cannot be inferred from source code or Cloudflare.
- Confirm R2 bucket and Pages binding, then turn on the opt-in variable.
- Validate Cloudflare D1 gift-order bindings separately; no automatic sync
  exists between D1 and Supabase.

## Official integration references

- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
- https://supabase.com/docs/guides/auth/jwts
- https://supabase.com/docs/guides/database/postgres/row-level-security
