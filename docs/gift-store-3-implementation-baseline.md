# Gift Store 3.0 — Implementation Baseline (2026-11-27)

Status: AUDIT PARTIAL, first safe storefront change committed on feature branch. No production release.

## Scope and verified source findings

- The repository uses React, TypeScript and TanStack Start with dedicated gifts routes `src/routes/gifts.tsx` and `src/routes/gifts_.$productSlug.tsx`.
- `src/features/catalogue/catalogue.tsx` drives the interactive gifts directory. `GiftDiscovery.tsx` supplies occasion/recipient/budget discovery. Directory filters use a product's minimum gift price when applying the budget ceiling.
- `src/features/catalogue/GiftCart.tsx` includes variant/cart selection, personalized photo attachment, order submission through `/api/orders`, and a separate photo-upload endpoint. Order receipt recovery uses browser session storage; photo files are held in memory and may require reattachment.
- `functions/api/gifts/config.js` checks Cloudflare flags `GIFT_CHECKOUT_ENABLED`, `GIFT_PRODUCTION_APPROVED`, bindings `ORDER_DB` and `ORDER_PHOTOS`, upload secret, and Turnstile credentials. A separate Supabase `gift_orders` table is *not* sufficient evidence that this checkout is enabled.
- `src/routes/admin.catalogue.tsx` explicitly describes catalogue detail edits as browser-local drafts. Public price publication is a separate workflow. Replacing this with authoritative, audited product publishing is a priority.
- `src/routes/gifts_.$productSlug.tsx` draws descriptive SEO pages from `src/lib/search-pages.json` and links to the interactive gift configuration flow. Validate real SKU identity/variant pricing before integrating direct purchase controls.
- Existing `src/features/catalogue/PhotoPersonalizer.tsx`, live-preview components, and `GiftCart.tsx` must be audited and preserved, not rewritten blindly.
- Existing D1/Cloudflare order API and Supabase catalogue/storage paths need a documented ownership and reconciliation map before any migration.
- The Android operational backend is the named Firestore database, not Supabase. A future handoff must be idempotent and use Android-compatible field contracts.

## First safe improvement

Budget navigation now exposes the planned local-market ceilings ₹399, ₹799, ₹1,499, ₹2,999, ₹5,799 instead of the prior ₹499, ₹999, ₹1,499. It retains existing directory filter semantics and an All budgets reset. This changes UI discoverability only; it does not change prices or product records.

## Outstanding before production

1. Verify current Cloudflare deployment commit, runtime/bindings and which checkout environment is active.
2. Inventory production catalogue and its authoritative persistence layer. Export before migration.
3. Inspect the full order API/DB schema, confirm the relationship to Supabase `gift_orders`, and run non-production checkout tests.
4. Audit customer photo handling for privacy and storage lifecycle.
5. Compare product URL coverage, redirects, image alt text, variant structured data and crawlable content.
6. Prepare server-owned product/variant publishing, immutable order snapshots and change log.
7. Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` on the branch with its pinned dependencies.
8. Verify a private Cloudflare preview before considering merge or release.

## Release gate

Do not deploy to production or change payment, customer, Firestore, or Supabase records until explicit preview approval. Keep source data unchanged and provide rollback to current main.
