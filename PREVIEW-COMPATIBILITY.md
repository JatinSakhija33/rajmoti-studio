# Rajmoti Studio — editorial private demonstration

## Owner photo update

Owner photo uploads and replacements are now enabled locally, with an explicit Supabase connection mode prepared for a future project. Customer uploads, payments and publication remain disabled. This update supersedes the earlier blanket upload-disable notes below. See [OWNER-PHOTO-SETUP.md](OWNER-PHOTO-SETUP.md) for current functionality, setup and verification limits.


Updated 12 November 2026 from the previously saved Sites import of `rajmoti-studio-github-ready-v2(1).zip`. The original ZIP and original live website are unchanged. This revision is saved without deployment or publication.

## Current experience

- Warm cream, antique gold and charcoal editorial homepage with a fictional, clearly labeled AI family portrait and product still-life. Existing Playfair Display and Montserrat fonts remain bundled locally.
- Photography categories and existing lightbox preserved; saved styles carry image references into enquiries. A complete-session story layout uses labeled placeholders where actual session photographs are missing.
- `/gifts`: 18 product families, 107 illustrative products and 389 explicit proposed variants. Search, combined filters, sorting, pagination, three-product comparison, selected-variant specifications, relative inch-size visualization, quantities, personalisation, packaging and quotation shortlist.
- The browser-generated master CSV includes one row per variant and standardized product fields. Every row is marked demonstration. No price or stock claim is verified.
- `/packages`: proposed collection comparisons by session type. Prices and all inclusions require owner confirmation; wedding coverage uses a bespoke enquiry.
- `/contact`: short enquiry with conditional baby age, selected package, saved styles and gift variants. English and Gujarati form labels are available; the whole site is not fully translated. Success explicitly says awaiting confirmation and no message or booking sent.
- `/admin/catalogue`: edit demonstration product specifications and variants or add a new product; changes flow to the same browser's directory. `/admin/inquiries` shows new locally saved enquiries and their selected details with simulated review statuses.
- `/admin/workflow`: original production board, date planner, job editor, templates and review checklist retained with six fictional records.

## Compatibility changes

1. The original Lovable/TanStack Start/Nitro server runtime was adapted to static Vite + React + TanStack Router for this isolated preview. Server rendering, OAuth callbacks, Google Contacts functions and live server endpoints are not active.
2. Original server callback source and the previous longer booking form are retained under `legacy-server-routes/`. `/book?service=...` now redirects into the shorter `/contact` flow while preserving the session choice. Inactive server entrypoints and middleware are excluded from the client TypeScript project; they need restoration or adaptation for live hosting.
3. Supabase calls use the existing local demo adapter. Catalogue, styles, quote lists and enquiries use structured browser-local storage. This is not a live database, shared inventory, multi-device synchronization or production authentication.
4. A demonstration owner identity allows the isolated owner screens to be tested. Real sign-in, authorization and row-level access rules must be restored before production use.
5. Real uploads, payment execution, external service requests, messaging and external contact links remain disabled by preview guards. Financial fields only simulate bookkeeping. No credentials or private customer data are required.
6. The dependency lockfile was repaired so installation is reproducible. Route generation includes the new stories and catalogue manager pages. The current TanStack error boundary accepts unknown errors as required by the installed router types.
7. Reset demo clears this browser's Rajmoti demonstration state. Data remains independent in other browsers. Admin edits are not published or sent to a server.

## Verification

- Client TypeScript check and production Vite build pass.
- Catalogue integrity: 18 categories, 107 unique product IDs, 389 unique variant IDs; every product has variants.
- Desktop browser: saved photography style, combined acrylic/8×12 filters, product comparison and variant change, quantity/personalisation selection, quotation handoff, local enquiry save and review in owner inbox.
- Owner editor: empty variant-code validation, local save and matching updated preparation information in the public demo product panel.
- Browser CSV export: 389 rows, 107 products, all demonstration labels.
- Responsive visual inspection used 390×844 browser frames for homepage and gifting directory. This is a CSS layout check, not testing on a physical phone.
- Existing workflow board renders its seeded stages and original controls. Prior imported version verified gallery lightbox advancement and local workflow save/stage progression.

## Remaining inputs before a live launch

Provide consented Rajmoti client photographs and complete sessions, actual gift photographs, supplier-confirmed variant combinations and prices, package inclusions, preparation times, delivery coverage and approved Gujarati translations. Replace the illustrative images and seed records. Restore and verify production authentication, backend integrations, enquiry delivery and any separately authorized commerce flow. Recheck remaining legacy admin pages end-to-end.

This draft has no live deployment URL. The browser review is session-bound; a permanent interactive Sites URL requires a separate deployment.
