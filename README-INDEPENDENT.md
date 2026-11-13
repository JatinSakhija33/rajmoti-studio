# Rajmoti Studio — independent website + gifting + studio production board

This is the **exported Lovable TanStack Start / React 19 app**, extended on 12 November 2026 with two new features:

- `/gifts` — public personalised photo gifts, private photo upload preview + Turnstile-verified gift request intake.
- `/admin/gifts` — private gift request inbox, 5-minute signed image previews, order stages and one-click conversion to a production job.
- `/admin/workflow` — owner-only production command centre: intake, 5 templates, customer matching, potential duplicates, print sizes, board, date plan, searchable table, payments, delivery, before/after checklist and browser-local offline metadata queue.
- `supabase/migrations/20261112090000_gifts_and_studio_workflow.sql` — database + protected buckets + RLS for both features.
- `supabase/functions/submit-gift-order/index.ts` — safe anonymous order/upload endpoint requiring Cloudflare Turnstile before service-role uploads.

## CRITICAL: what this ZIP does and does NOT contain

- Includes original site **source code** and 38 original SQL migration files, plus our new migration.
- **Does not include live table rows, customer contacts, user accounts or uploaded images/videos.** The database, auth and storage must be separately exported from Lovable Cloud and restored to your own Supabase project.
- The exported source had an `.env` file with public Supabase connection info. It has deliberately been **removed from this GitHub-ready package**. Copy `.env.example` to `.env`, use keys from YOUR new Supabase project, and keep secrets out of Git.
- Original project uses `@lovable.dev/vite-tanstack-config` and Nitro/Cloudflare. This is a **remaining Lovable NPM build dependency**; source is in your possession but a future cleanup should replace the build helper with upstream TanStack Start configuration. It does not require Lovable hosting or credits to publish if package builds independently.

## 1. Initialize GitHub (PRIVATE repo)

Make a new private repository on GitHub named `rajmoti-studio`, then in the extracted project folder:

```bash
git init
git branch -M main
git add .
git status --short  # VERIFY .env is NOT listed
git commit -m "Recover Rajmoti Studio and add gifts + owner workflow"
git remote add origin https://github.com/YOUR_USERNAME/rajmoti-studio.git
git push -u origin main
```

You must log into GitHub to push. **Do not upload the ORIGINAL Lovable ZIP directly to a public GitHub repo**, because it contains `.env`.

## 2. Backend recovery and migration

1. Recover the original PostgreSQL backup and ALL Supabase Storage buckets from Lovable (including gallery, reels). Verify counts and bytes; the source ZIP has neither records nor media.
2. Set up an independent Supabase project. Use the full SQL dump to restore data and auth with a suitable Supabase restore procedure. The 38 SQL migration files are for schema creation, NOT a replacement for a live data dump.
3. For a clean project without a database dump, apply the existing migrations in order **only after checking compatibility and original DB ownership**. Running schema migrations does not magically restore customer rows.
4. Apply `20261112090000_gifts_and_studio_workflow.sql` **only once** to the independently hosted database, after original tables/functions exist. It creates `studio_jobs`, `gift_orders` and two private storage buckets with admin-only RLS policies.
5. Restore original photos and reels preserving object paths. Recreate signed URLs where needed (the older app may persist time-limited signed URL strings).
6. Verify owner role: existing `public.user_roles` / `has_role` and `auth.users` need to be restored or re-established. Log in with the correct admin account. `src/lib/admin-auth.functions.ts` contains existing owner-specific logic and should be audited before go-live.
7. Audit row-level security and old gallery access policies before exposing public URLs.

## 3. Private gifting upload service

This remains **disabled** until properly configured, preventing public unauthenticated uploads to the bucket.

- Create a Cloudflare Turnstile widget for the new domain and add the **public** site key as `VITE_TURNSTILE_SITE_KEY` in the website build environment.
- In Supabase, set Edge Function secrets `TURNSTILE_SECRET_KEY` and `ALLOWED_SITE_ORIGINS` (comma-separated exact URL origins, e.g. `https://yourdomain.in,https://rajmoti.workers.dev`). The `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment secrets must also be present automatically or configured securely.
- Ensure `supabase/config.toml` has `[functions.submit-gift-order] verify_jwt = false`.
- Deploy via `supabase functions deploy submit-gift-order` to YOUR project. Since JWT checks are off, **Turnstile plus origin allowlist and strict file validation are mandatory**. Consider WAF/rate limits for production and purge uploaded private images on your retention schedule.
- Client form accepts 1–5 JPG/PNG/WebP files, max 10 MB each / 25 MB combined; function verifies file signatures, validates Turnstile, writes to **private** gift-order-photos and adds a gift order. Anonymous browsers cannot read gift photos or rows via RLS.
- Customers can still request products via WhatsApp while uploads are disabled. **They must attach photos to the WhatsApp message manually.**

## 4. Hosting

This is NOT a static HTML site: TanStack Start SSR needs a Worker/server runtime. Prefer Cloudflare Workers using the existing Vite/Nitro target. Check the project against current Cloudflare official TanStack Start docs: https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/ .

```bash
npm install
cp .env.example .env  # Windows: copy .env.example .env
npm run build
npm run dev
```

Create Cloudflare deployment using the Worker output emitted by the **actual** successful `npm run build`, not by assuming `dist/` is a static site. Set all required environment variables at build/runtime (public VITE_ values only in frontend; `SUPABASE_SERVICE_ROLE_KEY` **server-only**). Do not host a static SPA build because server functions and auth middleware would fail.

> **Build verification status:** This package was modified without access to a working dependency installation in this environment. Do not treat it as tested in production until `npm install`, `npm run build`, database migrations, Supabase Edge Function and photo upload flows pass.

## 5. Offline and identity protection limitations

- Production job **metadata** and edits are cached/queued in `localStorage` per logged-in user in this browser. Keep this as a trusted owner-only device. Photos are NOT cached offline; image upload and signed previews require connectivity.
- If the database goes offline, new jobs/updates remain in a local pending queue and sync when the connection resumes. This is best-effort, single-owner, **last-write-wins**; don't edit the same record on multiple offline devices. Always use a reliable database backup and never clear browser data before pending changes sync.
- The UI requires completing five review checks before a job may be marked delivered. It does not modify photos, and does not itself guarantee pixel-level identity preservation. That requires the human editor and visual approval.
- Do not overwrite originals. Uploads use unique paths for every version.
- Customer forms never guess memorial name/date/tithi; any unknowns are explicitly kept as editable assumptions.

## 6. Before switching the domain

1. Verify restored row counts for customers, images, inquiries, bookings and all remaining CMS tables.
2. Verify gallery and reel Storage object counts and path mappings; test sample customer `/photo/<short_id>` links.
3. Test admin authentication and role-based access to the new workflow/gift inbox.
4. Test a real photo gift submission with Turnstile and verify signed media access is admin-only.
5. Test fresh browser, offline queue and resume/reconnect sync.
6. Test payment status, before/after photos, delivery checklists, contact dedupe and admin roles.
7. Add a privacy notice, image retention policy and consent handling consistent with your local legal obligations.
8. Only then connect your independent domain and launch publicly.
