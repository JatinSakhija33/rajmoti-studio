# Production Task 01 — Image Storage & Gallery Optimization

Scope is storage, optimization and gallery performance only. No UI redesign, no unrelated pages, no behaviour changes beyond faster images.

## Verified current state

- 82 gallery records, 710 MB total, average 8.7 MB per photo — originals are served directly.
- No image has `width`, `height` or `dominant_color` recorded; one record has no `storage_path` (external URL) and will be skipped by the migration.
- The `gallery` bucket is private today; photos load through 10-year signed links.
- Uploads happen in three places (gallery manager, content editor gallery picker, content editor single picker) with duplicated logic.

## Important technical constraint

The server runtime is a Cloudflare Worker, where `sharp`/native image libraries do not run. All resizing and WebP encoding therefore happens **in the browser** using Canvas/`createImageBitmap` — both for new uploads and for the one-time migration, which runs from an admin page. This is reliable and keeps the worker out of the hot path, but it means the migration must be run with the admin tab open until it finishes (it is resumable, so it can be closed and resumed).

## What will be built

### 1. Shared image pipeline (new utilities)
A single set of typed helpers used everywhere, replacing all duplicated upload code:
- decode with correct orientation, strip EXIF (canvas re-encode drops it), compute dominant colour and intrinsic dimensions
- produce four WebP variants: thumbnail 400px, medium 800px, large 1600px, original 2560px max long edge, aspect ratio preserved
- deterministic storage layout `gallery/<category-id>/<image-id>/{thumbnail,medium,large,original}.webp`
- URL generation and responsive-variant selection helpers

### 2. Public bucket + stable URLs
The `gallery` bucket switches to public so variant URLs are derivable, CDN-cacheable, and never expire. Existing signed URLs keep working for anything not yet migrated.

### 3. Schema (minimal addition)
One nullable `variants jsonb` column on `images` recording which variants exist plus a `migrated_at` timestamp for resumability. Existing columns (`width`, `height`, `bytes`, `dominant_color`, `storage_path`, `thumbnail_url`, `image_url`) are reused and finally populated.

### 4. New upload flow
The gallery manager and both content-editor pickers route through the pipeline: compress locally, upload four WebP variants, write metadata. Raw originals are never uploaded again. Progress UI stays as it is.

### 5. One-time migration tool (Admin → Storage)
A "Optimize existing photographs" panel that processes images one at a time: download original → generate variants → upload → verify each variant exists → update the record → **delete the original file** (per your choice). Failures are logged and skipped, the run continues, and already-migrated images are never reprocessed. Live report: processed, failed, bytes before/after, total saved.

### 6. Gallery + lightbox rendering
- Grid uses thumbnail/medium via `srcset` + `sizes`; lightbox uses large; zoom loads the 2560px version.
- Lazy loading, `decoding="async"`, width/height attributes for intrinsic ratio, dominant-colour placeholder with blur-to-sharp fade — no layout shift. `fetchpriority="high"` only on the home hero.
- Lightbox loads only the current image and preloads exactly previous/next; keyboard, zoom, fullscreen, download and share are preserved; swipe and smoother transitions added.

### 7. Storage dashboard
Adds remaining quota, projected usage after pending uploads, and 80/90/95% warning tiers alongside the existing metrics; shows how many photos are still unoptimized.

## Expected outcome

- Storage: ~710 MB down to roughly 40–70 MB across all four variants (≈90% reduction).
- Gallery payload per grid view drops from tens of MB to a few hundred KB; large Lighthouse LCP/total-byte gains.
- All existing gallery, admin and lightbox functionality unchanged.

## Rollback

Because originals are deleted after verification, rollback restores the pre-migration *records*, not the raw files: the migration writes a downloadable JSON journal (old URLs, paths, byte sizes) before touching each image, and a "revert record" action re-applies it. Optimized 2560px WebP files remain as the highest-quality copy. If you would rather keep true originals recoverable, say so and I will switch step 5 to archive instead of delete.

## Files touched

`src/lib/images.ts` (new pipeline), `src/lib/image-migration.ts` (new), `src/components/gallery-image.tsx` (new), `src/components/lightbox.tsx`, `src/routes/admin.images.tsx`, `src/routes/admin.content.tsx`, `src/routes/admin.storage.tsx`, `src/routes/portfolios.$category.tsx`, `src/routes/portfolios.$category.$subcategory.tsx`, `src/routes/index.tsx`, `src/lib/queries.ts`, plus one migration and the bucket visibility change.
