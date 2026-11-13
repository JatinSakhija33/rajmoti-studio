# Zero-cost production foundation — deployment and QA

## Current implementation

On this branch, the customer-facing Vite website remains intact and adds:
- `/contact`: live enquiry submission (only when Turnstile + D1 are configured), saved selection of gift variants and photography styles, no payment charge or fake booking confirmations.
- Optional private original-file uploads **after** order submission (up to 5 JPG/PNG/WebP files, maximum 10 MB each), with short-lived HMAC upload grants and object-signature checks.
- `/track/:id?token=...`: HMAC-protected progress-only tracking for 30 days, with no names, phone numbers or photo URLs returned.
- `/desk`: owner-only order queue and search, quick walk-in intake, 10 print-size presets, editing notes, priority, due dates, memorial name/date/tithi, review checklist, production states, manual payment ledger, storage usage and verified archive controls.
- Real D1 private order and audit records; separate private R2 originals; data export and explicit archive-purge controls.
- Existing demo admin account cannot access `/admin` when built for production with demo mode. Real Supabase-managed admin modules remain separate and require their own migrations and security review.

Current CI: install locked dependencies, Vite production build, TypeScript check, security unit tests and check for committed `.env` files.

## Free-tier architecture

- GitHub private repository; Cloudflare Pages static assets + Pages Functions.
- D1 database binding **ORDER_DB**, schema `db/migrations/0001_web_orders.sql`.
- R2 private bucket binding **ORDER_PHOTOS**; no public bucket URL or public read access.
- Turnstile for public submissions; Cloudflare Zero Trust Access for owner page and APIs.
- Private Function environment secrets; never embed private values in client JS.
- Application media cap: `ACTIVE_MEDIA_BYTES_LIMIT=2000000000` (2 GB), leaving margin below the R2 free storage allowance. This limit does not cap every Cloudflare billing dimension, such as operation requests or server-side usage.
- No paid gateway, AI service, automated WhatsApp service, or third-party hosting subscription is required for this pilot. Any usage over free thresholds and domain fees are separate risks.

## Setup sequence (no domain required yet)

1. In the Cloudflare dashboard, connect GitHub `JatinSakhija33/rajmoti-studio` as **Cloudflare Pages**. Use a preview deployment from this development branch first; **do not use production `main` yet**.
2. Build command: `npm ci && npm run build`. Build output directory: `dist`, project root: `/`. The build script generates `robots.txt` and a sitemap when a trusted `VITE_PUBLIC_SITE_URL` or `CF_PAGES_URL` is present.
3. Create a D1 database in Cloudflare and apply `db/migrations/0001_web_orders.sql` to the **remote** D1 instance using the Cloudflare dashboard or Wrangler. Bind it to Pages Functions as **ORDER_DB**. No live Lovable customer database is restored by this action.
4. Create a private R2 Standard bucket, bind it as **ORDER_PHOTOS**. **Do not publish an R2 bucket URL.** Check R2's checkout, payment-method requirement and your billing alerts before enabling uploads. Free usage is not a hard billing cap.
5. Create a Turnstile widget for the Pages preview hostname, adding the future domain later. Set build-time public variable `VITE_TURNSTILE_SITE_KEY`, and secret Pages Function variable `TURNSTILE_SECRET_KEY`.
6. Set Pages Function secret `ORDER_UPLOAD_SECRET` to a cryptographically random string of at least 32 characters (e.g. `openssl rand -hex 32`). Do not use a `VITE_` prefix for secrets.
7. Set Pages Function `ACTIVE_MEDIA_BYTES_LIMIT=2000000000`. Do not set an unlimited upload quota.
8. **Configure Cloudflare Access before sharing the owner URL.** Create an Access application/policy protecting `/desk*` and `/api/owner/*`, limited to owner accounts. Set Pages Function variables:
   - `CF_ACCESS_ISSUER=https://YOUR-TEAM.cloudflareaccess.com` (no trailing slash)
   - `CF_ACCESS_AUD` = your Access application Audience Tag, or **comma-separated audience tags** if owner website and owner APIs use separate Access applications
   - `OWNER_EMAILS` = comma-separated verified owner email addresses
   Every owner API validates the signed Access JWT, issuer, audience, expiry and owner email **on the server**. A login form or hidden link alone is not access control.
9. Set **`VITE_DATA_MODE=demo` temporarily for public demonstration portfolio/catalogue data only**. The production owner bypass is disabled. The legacy `/admin` section will not function in this mode; use `/desk` for actual orders. For real legacy gallery management later, separately configure Supabase with properly verified roles and migrations.
10. Use `VITE_PUBLIC_SITE_URL=https://YOUR-SITE.pages.dev` during preview, and change it to `https://rajmotistudio.in` (if purchased and connected) for production. Add DNS and a custom domain **last**.

Pages Functions secrets and D1/R2 bindings must exist for the exact environment (preview vs production) where you test.

## End-to-end acceptance criteria

- Static build and all CI checks pass.
- Public site is readable; `/admin` has no demo owner access.
- With missing secrets, order intake fails closed and no personal data is accepted into local browser storage.
- Test Turnstile success, failure, expiration and wrong host.
- Test live customer order, duplicate client request key, customer order tracking, optional original upload and 5-file cap.
- Check R2 files remain private; other customers cannot open a photo via a guessed URL.
- Test Access denial, forged or expired JWT, and unrelated email denial on **every owner API**.
- Create walk-in jobs with all supported sizes and verify memorial fields; review steps must be checked before stage `ready` or `delivered`.
- Verify payments **against bank records** before entering received funds. No customer "paid" selection can mark a payment verified.
- Download originals and verify both the primary and secondary local archives. Mark archive verified, then test that cloud deletion is blocked until at least 30 days after delivery and an explicit typed confirmation.
- Export private order data and test that it can be restored. Keep exports encrypted and off GitHub.
- Monitor Cloudflare request/operation counts and R2 storage; your 2 GB application cap is not a formal billing cap.
- Confirm the final products, real prices, shipping/refund terms, customer consent, and contact privacy notice before accepting actual paid work.

## Current limitations and blockers

**This is a connected pilot, not a fully launched store.** Your final domain is only one dependency. The connected Cloudflare services and production secrets must be provisioned and tested.

- Catalogue products and price variations are demonstrations; edits in the existing demo catalogue are browser-local. Supplier-confirmed offerings, shared inventory and production pricing need a proper authoritative data service before checkout.
- There is no payment gateway or automatic UPI settlement; owner payment entry is manual and requires bank verification.
- Rajmoti OS web/Android Firestore integration is not completed because the current OS source and canonical data mapping are not available in this repository. Do **not** independently duplicate customer balances across D1 and Firestore until synchronization is designed and tested.
- Original Lovable customer contacts, gallery and user accounts are not in this repository; they need independent backup/restoration.
- Existing real admin photo CMS, secure legacy media permissions and reprinting history still need external migration.
- Customer originals remain private until delivered, backed up and manually purged. Automatic expiry is deliberately not enabled, to avoid accidental deletion of the only copy.

## Owner API

- `POST /api/orders` — verified customer request, ID, one-hour photo-upload grant, signed 30-day tracking grant.
- `POST /api/orders/:id/photos` — temporary private originals, max 5 files.
- `GET /api/track/:id?token=...` — only public stage/balance, no private content.
- `GET /api/owner/orders` — private queue.
- `POST /api/owner/orders` — real walk-in intake.
- `GET /api/owner/orders/:id` — private order with photo metadata.
- `PATCH /api/owner/orders/:id` — status, priority, review, print size, memorial details, verified payment amounts.
- `GET /api/owner/orders/:id/photos/:photoId` — protected original download.
- `POST /api/owner/orders/:id/archive` — verified double-backup acknowledgment (owner).
- `POST /api/owner/orders/:id/purge` — deliberate eligible cloud deletion 30 days after delivery.
- `GET /api/owner/usage` — D1-recorded photo consumption vs application cap.
- `GET /api/owner/export` — private JSON order backup, without original photo bytes.

No auto-deployment to customers has been enabled by this branch.
