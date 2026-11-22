# Rajmoti Studio production recovery

## Selected baseline and live evidence

- Recovery starts at `09ec014e48ad58214eccd1a2d0d0c9f4bc47bc31` on `codex/integrate-gift-tools`. Cloudflare reported success for that commit at https://e4e01fe1.rajmoti-studio.pages.dev/.
- The original main branch head is `32c340c3873ed340ac98af4b3807bb8d859678fc`. Its latest GitHub Cloudflare check failed. The recovery uses the main-based integration because it includes the original galleries and dashboard with the existing product previews and the Wrangler compatibility fix.
- Antigravity's `220fa9a8` preview is `c01d87818f0f8d8194cc1253fa3b2996747a2f05` on `feature/rajmoti-visual-experience`. Codex's `278e36cc` preview is `14db056cc883e7770ac1464c9dde38d982a7487d` on `codex/rajmoti-storefront-redesign`. They show different storefront implementations and do not match the production bundle.
- The apex returned HTTPS 200 and the same entry files as the Pages production alias: `index-BfATB81q.js` and `index-BIYhSFH_.css`. The current live app uses the preview home and toolbar. It returns HTML at `/api/gifts/config`. This proves that endpoint did not serve a checkout configuration during the audit.
- The 16 successful GitHub-linked Pages deployments checked had different entry files. The exact previous production commit and branch require the Cloudflare deployment record. A static bundle name is not a Git SHA. The signed-in dashboard was unavailable in this session.
- Apex nameservers resolve to Cloudflare. The `www` hostname returned 522. HTTPS was verified for the apex. No external DNS changes were made.

## Recovery behavior

The public navigation excludes the private toolbar, reset controls, owner links and catalogue export. The existing Supabase gallery and owner dashboard paths remain in place. With missing connection credentials, public routes show service information and a direct enquiry path, while owner access fails closed and there is no writable local database. Enquiries prepare a WhatsApp draft for the user to send. A gift cart stores design choices locally and makes no order or payment claim.

Only explicit catalogue prices are shown. Missing prices require a quotation. New order creation requires both the existing checkout flag and the additional `GIFT_PRODUCTION_APPROVED=true` flag. For the recovery, leave **both absent or false**. This guard does not change existing order lookup, manual payment reconciliation or authorized original-file retrieval.

## Production rollout after approval

1. In Cloudflare, open **Workers & Pages → rajmoti-studio → Deployments**. Open the deployment marked Production, record its deployment ID, source branch and commit, and confirm the build source. If Cloudflare labels it a direct upload without source metadata, record the deployment ID and deployment method. Open **Settings → Builds & deployments** to verify the selected production branch and existing build configuration.
2. Push the reviewed recovery branch and confirm its Pages build before promoting it through the project’s authorized production branch. Use the existing repository build, Node 22, root `functions/` and `dist` output. Use the existing Supabase project. Set `VITE_DATA_MODE=supabase`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_PUBLIC_SITE_URL=https://rajmotistudio.in` in production and rebuild. Use the publishable key for browser variables. Keep existing binding values private and never put a service-role key in a VITE variable. Verify a real owner account with its existing admin role.
3. Keep checkout disabled during recovery. For the later commerce launch, verify D1 `ORDER_DB`, private R2 `ORDER_PHOTOS`, `ORDER_UPLOAD_SECRET`, Turnstile site and secret keys, and server-side Supabase verification. Confirm migrations against a staging copy first. Verify approved SKU and variant prices in the same server-side price source, test a staging order through manually verified payment and original-file retrieval, and confirm that the merchant account is authorized before enabling checkout.
4. In **Custom domains**, verify the apex is Active. For `www`, add it in Pages before setting DNS as applicable, wait for the certificate, then set a zone-level permanent redirect from `https://www.rajmotistudio.in/<path>` to the equivalent apex URL. Preserve the path and query. Leave MX, TXT and unrelated records in place. See https://developers.cloudflare.com/pages/configuration/custom-domains/.
5. After deployment, verify desktop and mobile homepage, real portfolio records, product customization, protected admin, disabled checkout JSON and HTTPS on both hosts. The build retains its existing `noindex` setting during recovery. Remove the site-wide tag in the launch release after the custom domain, public catalogue and discovery surfaces are verified. Keep the private route indexing controls.

## Verification

- Node 22 / Vite production build and TypeScript passed.
- Cloudflare Pages Functions bundle passed with Wrangler 3.114.17.
- 26 automated tests passed in isolated fixtures, including interrupted photo uploads, original bytes, private file authorization, order persistence, mismatched totals, pending UTR and manual payment verification. No live transactions.
- Edge browser checks passed at 1440px and 390px for public routes, admin redirect, real-file mug upload and save, local cart and disabled checkout. Contact prepares a real WhatsApp destination without sending a message.
- Real production login, live database bindings and the new production deploy require verification in the authorized Cloudflare and Supabase accounts.
