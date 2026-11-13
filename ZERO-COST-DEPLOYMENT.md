# Rajmoti Studio: zero-monthly-cost production foundation

This **development branch** adds a real intake pipeline to the current static Vite Sites frontend. It is **not published or merged**. The older demo dashboard remains present for local testing; in production its demo owner is denied by \`src/lib/use-auth.tsx\`. The separate \`/desk\` page is backed by private Cloudflare APIs.

## Working components
- Public \`/contact\`: real enquiry, gift shortlist and styles. Fail-closed if spam verification isn't configured. Clear consent and accurate non-payment messaging.
- Public photo uploads **after** accepted order, only with short-lived signed upload grant; JPG/PNG/WebP, 5 files, 10 MB each, private R2 bucket, separate original files. Client-side draft selection alone doesn't upload anything.
- Private D1 order database with order history, status, notes, amounts (stored as **integer paise**) and manual verified payment reference.
- Owner \`/desk\`: searchable real orders, job stages, outstanding balances, photo download and payment records. Requires Cloudflare Access app for \`/desk*\` and \`/api/owner/*\`, plus JWT verification inside APIs.
- No paid gateway or automatic payment capture; NEVER interpret customer screenshots or "paid" buttons as actual bank settlement.
- No auto-delete of customer originals: archive verification, retention and data export must be deployed and tested before enabling deletion.

## Cloudflare Pages setup
1. Connect private GitHub repo to **Cloudflare Pages**. Framework preset **Vite**, build **\`npm ci && npm run build\`**, directory **\`dist\`**, root \`/\`. Check the actual build locally first.
2. Create a D1 database, apply \`db/migrations/0001_web_orders.sql\`, and bind the database as **\`ORDER_DB\`** in **Pages → Settings → Functions → D1 bindings**.
3. Create a **private** R2 bucket (Standard storage) and bind as **\`ORDER_PHOTOS\`** in Pages Functions settings. R2 checkout may require a payment method and usage over free tiers can incur charges; Cloudflare budget alerts are not hard caps.
4. Create Turnstile site key for the **preview domain** and later the purchased domain; set public Vite build variable \`VITE_TURNSTILE_SITE_KEY\`. Set secret Pages Function variable \`TURNSTILE_SECRET_KEY\`.
5. Create \`ORDER_UPLOAD_SECRET\` as a random 32+ character secret (use \`openssl rand -hex 32\` locally). **Never** prefix secret variables with \`VITE_\`.
6. Set a Pages Function variable \`ACTIVE_MEDIA_BYTES_LIMIT=2000000000\` (2 GB safety cap on active uploads).
7. Set \`VITE_DATA_MODE=demo\` **for the static public gallery only** until real Supabase gallery migrations are verified. Production builds now **disable the demo owner**, even when public seed galleries are shown.
8. Protect both \`/desk*\` and \`/api/owner/*\` with Cloudflare Zero Trust Access, Allow policy limited to verified studio owner email(s). The **application itself** independently verifies the signed Access JWT. Set \`CF_ACCESS_ISSUER\` (https://YOURTEAM.cloudflareaccess.com), \`CF_ACCESS_AUD\` (the application's Audience Tag) and \`OWNER_EMAILS\` (exact allowlisted email(s)) as Pages Function environment variables.
9. Configure Pages **Functions** for the same project (not static hosting only). Ensure D1/R2 bindings and secrets exist for **every** deployment environment to be tested.
10. Test spam rejection, correct origin, fake/expired upload grants, outsider owner API rejection, order idempotency, image validation, owner balances and bank reference checks.

**Do not expose \`/admin\` from the demo as owner management.** Real \`/desk\` is the production owner intake desk. All other legacy admin modules require security and database migration before they are enabled.

## Important limitations
- No real Firebase Rajmoti OS sync yet. The OS source/Firestore schema must be reconciled before integration. D1 order entries are not automatically imported into the separate OS today.
- Current catalogue remains browser-local demonstration; prices, SKUs and variants must be approved and moved to a production collection before accepting paid checkout.
- No automatic UPI verification or gateway settlement. Owner records payments after checking bank transaction records.
- No fulfillment archive automation yet. Private customer media is retained pending explicit local archive verification and deployment of safe cleanup rules; monitor R2.
- The previous 38 Supabase migrations and customer records/photos are separate and **not** contained in GitHub.
- Pending order CSV/backup, job intake, automatic media cleanup, restoration QA and production monitoring still need engineering.
- This branch is not an instantly live website. Domain linking is only the last infrastructure step **after** Cloudflare configuration and end-to-end tests.

## APIs
\`POST /api/orders\` accepts validated customer details + Turnstile token and provides an order ID plus one-hour upload grant.
\`POST /api/orders/:id/photos\` accepts images with the signed grant.
\`GET /api/owner/orders\` returns all jobs to authenticated owners.
\`GET /api/owner/orders/:id\` returns job and private photo metadata to authenticated owners.
\`PATCH /api/owner/orders/:id\` changes stage, notes and manually verified payment.
\`GET /api/owner/orders/:id/photos/:photoId\` streams an original only for authenticated owners.

No service-role credentials belong in browser JS, a public repo, or Vite build variables.
