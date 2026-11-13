# Owner photo uploads and replacement

## What works now

The default `VITE_DATA_MODE=demo` enables owner photo uploads in this browser, using IndexedDB for photo bytes and local storage for demonstration records. It needs no Supabase project. It is not cloud storage or a backup. Refresh retains the images on the same browser; Reset demo clears both records and local photo files.

- Gallery `/admin/images`: category selection, multiple uploads, responsive WebP sizes, thumbnail/full-size viewing, metadata editing, replacement preview and stable `/photo/<short_id>` links.
- Replacement uploads into a unique revision folder, then updates the photo row. The original row ID and short link stay unchanged. Previous stored versions are retained; they are not automatically deleted. There is no version-history restore UI yet.
- Partial upload/signing/verification failures clean up objects from the failed attempt. If a database write was attempted but its result is uncertain, the new objects are retained for reconciliation; a lost response must not delete a file the database may already reference. Cleanup itself may fail during a network outage; it never intentionally deletes a previous version.
- Gallery images are web derivatives (up to 2560px), not archival raw originals. The source file on your computer is untouched.
- Workflow `/admin/workflow`: original and edited files saved separately without overwriting. This path keeps the supplied file unchanged. TIFF can be stored, but browser preview support varies.
- Content `/admin/content`: the first uploaded hero image drives the editorial homepage. Category covers use the existing category manager. Other editorial copy, product illustrations and demonstration catalogue remain separately managed; the whole site is not now a live commerce system.
- Customer uploads, real payments and external messaging remain disabled. Do not publish the owner-bypass demo as a real customer site.

## Connect the new Supabase project when created

1. Create your Supabase project and retain its database password privately.
2. Apply the SQL files under `supabase/migrations/` in chronological order to the new project, using the Supabase migration tooling. The exported schema is substantial; resolve migration errors before continuing. Do not rerun all files blindly on an existing database. The new final migration creates a missing private gallery bucket and removes automatic admin assignment by email. Existing admin assignments are preserved.
3. Create and verify your own account in Supabase Authentication. In the SQL editor, grant the admin role to that exact user UUID:

   ```sql
   insert into public.user_roles (user_id, role)
   values ('REPLACE_WITH_YOUR_AUTH_USER_UUID'::uuid, 'admin')
   on conflict (user_id, role) do nothing;
   ```

   New accounts are never made admins by the frontend. Do not grant roles to arbitrary sign-ups.
4. Copy `.env.example` to `.env.local`. Set these three frontend build variables:

   ```dotenv
   VITE_DATA_MODE=supabase
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
   ```

   Never put a service-role/secret key in a `VITE_` variable or Git. The photo manager does not need that secret.
5. Configure Supabase Auth Site URL and redirect URLs for the actual environment, including `/auth` and `/reset-password`. Restart development or rebuild after changing Vite variables.
6. Sign in at `/auth`. Confirm your account has the admin role. Supabase mode never falls back to the demonstration owner if configuration or authentication fails.
7. Verify one consented gallery upload, a replacement retaining its short link, a hidden photo, a workflow attachment and reload. Test an ordinary non-admin account is denied writes. Verify database and Storage RLS before any publication.

Supabase mode reactivates the retained database-backed admin screens. The catalogue and new short enquiries remain explicitly browser-local demonstrations. This is a photo-management integration, not a completed production migration of every legacy server feature. Existing gallery signed links are long-lived bearer links: hiding a gallery row removes it from listings but does not revoke a previously shared signed URL. Keep private customer work in the private workflow bucket.

No Supabase project exists for this task yet. Cloud upload, authentication, migrations and RLS have therefore not been tested against a live project.

References: https://supabase.com/docs/guides/storage/uploads/standard-uploads and https://supabase.com/docs/guides/storage/security/access-control

## GitHub handoff

Target from your migration conversation: `https://github.com/JatinSakhija33/rajmoti-studio.git`.

This session has no authenticated GitHub connection, and repository access was denied. No GitHub push has happened. The changes are saved in the separate Sites source repository.

Once connected, inspect the current GitHub default branch and deployment workflows, then transfer this revision to a new `feature/owner-photo-management` branch without rewriting existing history. Do not replace the default branch blindly: the Sites preview uses static Vite while the original repository used TanStack Start/Nitro. Do not merge or trigger a live deployment until the runtime choice and integrations are verified. The website remains unpublished as requested.

## Validation

Five automated storage tests cover interrupted upload cleanup, signing failure cleanup, verification failure cleanup, successful immutable upload behavior and invalid/oversized files. TypeScript and production-build checks are run for the saved revision. Browser QA verified local upload, full-size view, replacement, stable link, refresh persistence, public photo rendering and workflow original attachment. Browser-local tests do not prove live Supabase compatibility.
