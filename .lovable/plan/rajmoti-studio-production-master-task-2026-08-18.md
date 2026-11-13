# Rajmoti Studio — Production Master Task

This is a large brief. I'll deliver it in three phases so nothing working gets broken. Phase A is the biggest functional gap and I'd start there.

## Phase A — Category & Subcategory CMS (Part 1, 16, 17)

Database (single migration, no data loss — existing rows are updated in place, never recreated):
- `categories`: add `hidden`, `featured`, `seo_title`, `seo_description`, `archived_at`
- `subcategories`: add `hidden`, `cover_image_url`, `seo_title`, `seo_description`, `archived_at`
- new `slug_redirects` table (old slug → category/subcategory) written automatically whenever a slug changes, so old portfolio URLs keep working

Admin `/admin/categories` rebuilt as an editorial CMS:
- card list with drag handles (dnd-kit is already used for image ordering — reuse it), showing "4 subcategories · 82 photographs · Published"
- click a card → focused editor drawer: cover image picker, name, slug (separate field, never auto-overwritten by rename), description, published/hidden, featured, SEO title + description, live counts, "View public category" link
- nested subcategory list inside the editor, same fields, drag-reorderable
- safe delete: shows affected counts, offers "move content to another category" or archive instead of hard delete

Admin gallery (`/admin/images`):
- searchable category / subcategory selects, subcategory options filtered by chosen category
- multi-select photographs → bulk assign category + subcategory

Public side reads `hidden`/`display_order` from the database everywhere (nav, portfolio index, category pages).

## Phase B — Portfolio experience + conversion (Parts 2, 3, 5, 10, 14)

- Category pages: lead image, CMS description, subcategory pill nav with stable shell (no flicker — the current keyed remount is replaced by a persistent shell + fading grid)
- Contextual CTAs after meaningful scroll depth, with category-aware WhatsApp prefill ("…interested in Baby Photography")
- Homepage section-by-section pass: single primary CTA (Check Availability), local proof line, trust/process/FAQ blocks driven by the existing `site_content` CMS
- Mobile bar: hides inside `/book` and contact forms
- Polished empty/loading/error states

## Phase C — SEO, structured data, accessibility, micro UX (Parts 6, 7, 8, 11, 12, 18)

- Per-route unique title/description/canonical/OG, driven by the CMS SEO fields
- JSON-LD: LocalBusiness, BreadcrumbList, Service on category pages, FAQPage where real FAQ content exists (no invented ratings)
- Skip link, focus states, aria-live, modal focus trap audit
- Lightweight `track()` helper on every CTA so conversion events are measurable later

## Notes

- The image pipeline, booking flow, CRM and calendar are left untouched.
- No fake reviews, ratings, scarcity, or fake Instagram/Google sync. Part 9 becomes a CMS-managed "Studio moments" section in Phase B only if you want it.

I suggest approving Phase A now and running B and C as follow-ups, so each phase can be reviewed on the live site.
