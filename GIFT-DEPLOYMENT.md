# Gift integration: deployment and verification

This branch starts at `main` (`32c340c`) and integrates selected engines from `feature/products-rebuild-4.0` (`c90a171`). The branch comparison and preserved prior work are in `GIFT-INTEGRATION.md`. Do not merge the earlier whole-storefront redesign PR #2.

## Preserved architecture

The original photography homepage, `/portfolios` and its category galleries, stories, booking, contact, saved styles, existing Supabase authentication, customer/storage integrations and all existing admin modules remain in place. Existing catalogue and cart storage keys are retained. The only added admin module is `/admin/gift-orders`; it uses the existing admin shell. `/products` redirects into the original `/gifts` section.

No existing Supabase migrations, production records, customer photos or authentication policies are changed. No production schema migration has been applied. The new Pages Functions use a separate gift-order database and private photo bucket. All local test orders and references are fictional.

## Connect gift ordering on Cloudflare Pages

Keep the existing photography/Supabase environment settings. Add these bindings and server-side values to the intended preview or production environment:

| Setting | Required value |
| --- | --- |
| `ORDER_DB` | Dedicated D1 database binding for gift orders |
| `ORDER_PHOTOS` | Private R2 bucket binding; do not enable public bucket access |
| `ORDER_UPLOAD_SECRET` | Random server-only secret, at least 32 characters |
| `TURNSTILE_SITE_KEY` | Public site key for the exact deployed hostname |
| `TURNSTILE_SECRET_KEY` | Matching server-only verification secret |
| `GIFT_CHECKOUT_ENABLED` | `true`, after the bindings and schema are ready |
| `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` | The existing authentication project; browser's corresponding `VITE_` values are also accepted by the owner API |
| `ACTIVE_MEDIA_BYTES_LIMIT` | Optional private photo storage cap; default 2 GB |

Apply `db/migrations/0001_web_orders.sql`, `0003_live_gifting_engine.sql`, `0004_payment_engine.sql`, then `0005_gift_asset_mapping.sql` to **ORDER_DB only**, after inspecting its current migration state. Do not replay `ALTER TABLE` migrations on a database that already has those columns. No legacy OS database or Supabase table is a migration target.

The existing main Supabase owner login and `admin` role authorize gift-order APIs. The server independently validates the access token with Supabase and reads the user's admin role. Demo admin identity never authorizes these APIs. Existing Cloudflare Access deployments may instead use `CF_ACCESS_ISSUER`, `CF_ACCESS_AUD`, `OWNER_EMAILS` and a valid signed Access assertion; protect both the admin page and `/api/owner/*` if using that option.

`GET /api/gifts/config` returns `enabled: false` until all required bindings and flags exist. Customer preview, saving and cart remain available; checkout clearly reports its unavailable connection. Database and storage failures return errors; they never become successful orders or verified payments.

## Prices, files and payment

Main's 107 seed records are unchanged. Three non-conflicting product records and the sample artwork come from the existing feature branch. Explicit variant prices take precedence. Only supported families use that branch's existing price rules; other items remain quotation-only. Main's `MAG-*` identifiers mean magnets and are never charged the source branch's magazine prices. Locally edited catalogue records are retained, but the order server always validates against its canonical catalogue; incompatible changes produce an error rather than an unverified charge. Confirm the inherited catalogue and pricing rules before activating live sales.

The existing direct UPI VPA and beneficiary are retained. A QR code, app launch or submitted UTR never marks payment paid. An authorized studio admin must reconcile the bank statement and record the actual amount received. Partial receipts, cash received at the counter, duplicate-reference protection and audit events are supported. Dispatch/collection requires the complete verified balance and the photo/print/customer review checks.

Customer photos remain in memory until order submission; only design instructions are stored with the existing browser cart. After refresh, reattach originals in their saved order. Once an order exists, a session receipt and private tracking link support resuming uploads without creating another order. Uploaded originals are private and linked to their exact design/slot; retried uploads are idempotent. No automatic deletion, public gallery publication or permanent image manipulation is introduced.

The visual engines show design approximations, not print-ready manufacturing proofs. Customers must replace illustrative sample artwork before saving a personal photo design. Selected devotional library artwork is an explicit alternative. Product variant size/price remains authoritative; extra preview finishes, phone-model availability and album specifications require studio confirmation. No invented reviews, promotions or sales claims were added.

## Reproduce verification

Use Node 22.12 or newer (pinned `.node-version`), then `npm ci`, `npm run typecheck`, `npm test`, `npm run build`. Both npm and Bun lockfiles are synchronized.

`node --import ./tests/json-imports.mjs tests/gift-browser.mjs` serves the production build against the actual Pages handlers, a migrated SQLite database and in-memory private object storage. It uses Edge by default (`EDGE_PATH` can override the executable). Only external Turnstile and authentication responses are simulated. It creates no live order or payment. Screenshots/report go to the sibling `integration-audit/browser` folder. Live Supabase sign-in, deployed D1/R2 permissions and real bank reconciliation still require a configured deployment and owner access.

Functions use plain JSON imports compatible with Cloudflare's Wrangler 3.114.17. The test-only preload supplies Node's required JSON import attributes; it is never imported by production Functions. Reproduce the deployed bundler with `npx wrangler@3.114.17 pages functions build --outdir ../integration-audit/worker-wrangler3`. The frontend build and Functions build are separate checks.

## Public catalogue prices

Bind a private R2 bucket as `CATALOGUE_STORE` in the Pages environment. If that binding is absent, the price API uses the existing private `STUDIO_PRIVATE_FILES` binding under a separate key prefix. In Admin → Product catalogue → Edit, publish prices for the registered variants. Blank values mean “Price on request.” The same server-side owner verification protects publishing.
