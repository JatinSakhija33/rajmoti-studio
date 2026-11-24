# 24 November 2026: Rajmoti homepage presentation and recovery gates

## Implemented

- The maternity and family portfolio cards and portfolio headers use the owner's exact published Cloudflare photo picks, rather than old generic defaults.
- The homepage hero rotates through eight real published Rajmoti Studio images: three baby, three maternity and two family. All four owner-specified photos are included.
- The hero has previous/next buttons, direct slide selectors, pause and a reduced-motion setting. It never edits, overwrites, crops or changes original files; portrait slides are displayed in a contain-fit foreground over blurred duplicate background.
- A continuous gallery strip appears immediately ahead of the studio-map section. It interleaves the 385 published baby, maternity and family photos and loops, rendering only fourteen optimized thumbnails at once; clicking a photo opens its permanent detail page.
- The previous illustrative/AI family photograph in the homepage story has been replaced with a real published studio photograph.
- All 385 public files and their existing 1,155 WebP variants continue to be served by Cloudflare Pages. No extra Supabase reads or public media migration are required for these features.

## Cloudflare and Supabase: the systems remain separate

These frontend improvements do NOT by themselves solve the missing business database tables or restore old Lovable customer data. Cloudflare Pages serves the public site and existing portfolio bytes. Cloudflare D1 handles gift orders. Supabase Postgres/Auth handles private studio CRM, contacts, bookings and workflow. Optional Cloudflare R2 can be used for new private workflow photos only when the private binding and owner authentication have been tested.

### Readiness and safe sequence for live Rajmoti OS

1. Authorize the correct Rajmoti Supabase organization/project in ChatGPT, not the unrelated Meri Rasoi project. The last direct authorization check rejected project ID ujxecliohalltcglttsr with permission denied. Do not modify the unrelated project.
2. Take a destination database backup and inspect current auth.users, public.user_roles, public.customers and schema using a read-only query. Preserve both current manually added administrator accounts and roles.
3. Validate the historical Lovable PostgreSQL backup named rajmotistudio_261123.backup offline or in an isolated database, then import SELECTED historical public business records with explicit conflict handling and stable identifiers. The old backup includes auth/storage metadata but must NOT be restored wholesale into the existing production Supabase project.
4. Verify final customer count, referential integrity, authorized role access, Row Level Security and admin CRUD. Earlier read-only source checks found 1,289 customers, 216 gallery database rows and 876 gallery storage objects. The original media objects must be backed up separately from the SQL archive.
5. Verify the Pages build-time values VITE_DATA_MODE=supabase, VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are for the intended destination. Trigger a rebuild after any Vite variable change; never put service-role or database credentials in public VITE_ variables.
6. When private R2 workflow storage is required, provision a PRIVATE bucket and the binding STUDIO_PRIVATE_FILES. Test owner/non-owner access through the existing Pages Function before setting VITE_STUDIO_MEDIA_PROVIDER=r2. This does not migrate past Lovable files or mirror gift-order D1 to Supabase.

An earlier separate draft PR #7 contains guarded schema recovery SQL and owner diagnostics. Its scripts must be checked against the destination schema before use; merging code cannot automatically restore historic database rows.

No production database, Auth user, Cloudflare R2 bucket, payment flow or original photograph is modified by this gallery PR.
