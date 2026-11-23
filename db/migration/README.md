# Rajmoti Studio: source-of-truth migration, not a mode switch

## Confirmed current source inventory (23 November 2026)

| Source | What exists | Safe migration path |
|---|---|---|
| `src/lib/published-portfolio.json` | 385 approved public photographs: baby 301, maternity 44, family 40 | Import categories and photo metadata into the new Supabase database with `01-import-385-approved-public-photos.sql` |
| Cloudflare Pages `/portfolio/` | 3 WebP variants per approved photo, total 1,155 assets; 34 originals' variants checked into `public/portfolio`, remaining variants emitted at build from 41 `gallery-assets/batch-02-*.zip` archives | **Keep hosting these existing display images on Cloudflare.** Do not re-upload, rename, re-encode, or overwrite them. The SQL references existing same-origin URLs; it migrates the database catalogue. |
| Exported Lovable app source / original 38 schema migrations | Code and DDL, **not actual customer, gallery, booking, auth or storage rows** | Obtain an authorized PostgreSQL data export and original Supabase Storage exports from the old project. Restore in dependency order with verified row counts, secure RLS, and file checksums |
| Demo owner browser | May contain localStorage (`rajmoti:` keys) and IndexedDB `rajmoti-preview-media-v1` local-photo Blobs on the browser/profile where demo was used | Export a local backup from that exact browser/origin before clearing site data. Switching `VITE_DATA_MODE` does not copy those records to Supabase |
| OneDrive photo archive | Camera originals, selections, Photoshop edits, print deliverables | Preserve and inventory in place. Only publish consented, sized derivative images; keep all customer originals private |
| New Supabase project `ujxecliohalltcglttsr` | Current production URL; accounts might already exist | Confirm SQL schema is complete BEFORE running import; do not overwrite existing users/roles or run old migrations blindly |
| `/admin/catalogue` | Browser-local product demo data | Needs separate product database/schema + reviewed price/availability import; DO NOT treat unconfirmed prices as live products |
| Cloudflare Pages Functions D1/R2 | Separate gift order and payment path, if bound | Import/export independently; the public photo importer does not change D1/R2 data |

## Import the verified public photography catalogue first

1. Take a backup/snapshot of the target Supabase project. Verify project ref `ujxecliohalltcglttsr`.
2. Run `db/recovery/00-preflight-readonly.sql` from PR #7. **Only if its guard conditions hold** can its full schema installer be considered; otherwise prepare an incremental schema migration. Never run a script that removes existing business tables or admin users.
3. Verify `public.images`, `public.categories`, `public.subcategories`, `public.user_roles`, `images.short_id` and `images.variants` exist, and check public gallery RLS.
4. In the trusted Supabase SQL Editor, run **`01-import-385-approved-public-photos.sql`**. This file is generated from the exact audited GitHub JSON. It is non-destructive: no storage writes, no image mutations, no app code switches and no overriding existing photo records or owner-managed categories.
5. Validate the 385 imported short IDs and image_url matches, and check `/portfolios`, `/portfolios/baby`, `/portfolios/maternity`, `/portfolios/family`, and `/admin/images` using an authorized session.
6. Take row-count and bytes/checksum records before/after any future move of the actual display image bytes to Supabase Storage. There is no reason to migrate public Cloudflare assets twice unless you deliberately change hosting/CDN.

### Critical limitations

**This is NOT a migration of the entire old Lovable database or OneDrive archive.** We have neither verified access to that old live database nor a fresh data dump, and the currently connected Supabase account does not authorize this Rajmoti project. The SQL is prepared but **not run against production**.

The source contains 385 *approved* public photos, not the entire studio archive. Earlier intake archives may contain more raw photos than were approved/published; never auto-publish all of them to the internet. Originals are never overwritten.

Do not place `service_role`, `sb_secret_*`, OAuth credentials, or any private customer export into GitHub or `VITE_*` variables.

## Post-import read-only counts

```sql
SELECT c.slug, COUNT(*) AS approved_cloudflare_photos
FROM public.images i JOIN public.categories c ON c.id=i.category_id
WHERE i.image_url LIKE '/portfolio/%'
GROUP BY c.slug ORDER BY c.slug;

SELECT COUNT(*) AS total_static_catalogue
FROM public.images WHERE image_url LIKE '/portfolio/%';
```

Expected counts for the approved public manifest: `baby=301`, `maternity=44`, `family=40`, total `385`. Other legitimate images already in Supabase can make total rows exceed 385.

## Sources

- `src/lib/published-portfolio.json` and `src/lib/published-portfolio-taxonomy.json`
- `build/portfolio-assets.ts`: checksum-validated asset extraction in Vite
- `src/demo/media-storage.ts`: browser-only IndexedDB storage
- `src/features/catalogue/store.ts`: browser-local catalogue state
- `OWNER-PHOTO-SETUP.md`: archival vs display-photo distinctions
