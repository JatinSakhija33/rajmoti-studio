# Rajmoti Studio storefront

The homepage, shared navigation and gift catalogue now use a warm ivory and botanical green design, with clear routes into photography and personalized gifting. Existing catalogue records, variant prices, local storage keys, admin pages, database migrations and Supabase functions are retained.

## Customer experience

- Collections for frames, prints, albums, cross-family collages, acrylic keepsakes, personalized gifts and devotional enquiries.
- Birthday, anniversary, couples, parents and gift inspiration for him or her. These use existing catalogue metadata; no gender-specific inventory is invented.
- Bookmarkable collection, occasion, recipient, search, saved-gift and product URLs.
- Search, all existing detailed filters, sorting, comparison, CSV export and progressive product loading.
- Saved gifts and a quote list available from the shared navigation. Existing quote lines without customization remain supported.
- A three-step personalizer: local photo references, existing size/finish options, then a quote selection. Crop position, zoom, orientation, optional text, notes and quantity are saved as metadata. Different photo references are kept as distinct selections.
- Local file validation, image decoding checks, low-resolution guidance, clear errors, accessible labels, keyboard controls and reduced-motion support.
- Responsive hero WebP copies (34–153 KB) keep the original illustrative image content and attribution.

## Data and launch boundary

The repository contains a demonstration catalogue with unverified inventory and null prices. No real catalogue, discounts, reviews, delivery promises or supplier specifications were invented or changed. There are no devotional records in this source, so that collection explains the gap and offers a studio enquiry.

This change does **not** turn the existing demo into a live checkout. Quote and enquiry metadata still use the existing browser-local workflow. Existing external-service guards remain in place. No payment is taken and no enquiry is sent to the studio in preview mode.

Photos selected in the personalizer remain in memory while that panel is open. They are never transmitted, written to local storage, or attached to the demo enquiry. Object URLs are revoked on removal or close. Customers are told to supply originals separately. The preview is a layout reference, not a manufacturing proof or automatic multi-photo collage editor.

The Supabase gift-order endpoint, private storage policies, owner uploads, customer records and production board are unchanged. Real authenticated submissions, payment integration and delivery quoting need separate verification with the owner's configured services and verified inventory. No production database or customer data was accessed during this redesign.

The existing Vite app is a client SPA. Its intended server-route ignore pattern now matches the `api` directory itself, preventing legacy server sources from entering the generated client tree. The same retained API and sitemap files are excluded from the client TypeScript check; their sources are preserved for the original server integration.

## Run and verify

Use Node 22.12 or later:

`.node-version` pins the tested Node 22 runtime for compatible hosted builders. Both npm and Bun lockfiles are synchronized with the current package manifest. The old Bun lockfile referenced a Lovable build dependency that had already been removed from the manifest and failed a frozen install; it was regenerated from the tested npm resolutions.

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

For the browser regression suite, start the dev server, then run:

```sh
npx playwright install chromium
npm run test:browser
```

Alternatively set `BROWSER_PATH` to an installed Chromium browser executable. Set `BASE_URL` to test a different local port or a production build preview. The suite uses a fresh, isolated browser profile and anonymous generated image data. It checks discovery, deep links, saved gifts, comparison, local photo handling, customization, quantity validation, quote persistence, demo enquiries, mobile navigation and responsive layouts at 320, 390, 768, 1024 and 1440 pixels. Live services are not part of this suite.
