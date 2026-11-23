# Rajmoti Studio — Restore private admin login

The public URL is `https://rajmotistudio.in/auth`.

## Diagnosis

The `Studio sign-in is temporarily unavailable` screen is intentionally shown when
`studioConnected` is false. Previously this required ALL of these build-time
settings: `VITE_DATA_MODE=supabase`, `VITE_SUPABASE_URL`, and
`VITE_SUPABASE_PUBLISHABLE_KEY`. The fix also auto-detects a valid
Supabase public URL and key when `VITE_DATA_MODE` is omitted.

**Do not switch the site to an insecure demo owner account.**

## Cloudflare Pages: configure the production BUILD

1. Cloudflare dashboard → Workers & Pages → **rajmoti-studio** (verify the actual project) → Settings → Environment variables (or Variables and Secrets / Build configuration, depending on interface).
2. Select the **Production** environment. Configure:
   - `VITE_DATA_MODE` = `supabase`
   - `VITE_SUPABASE_URL` = `https://<your-project-ref>.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = Supabase **publishable/anon public** key
   - `VITE_PUBLIC_SITE_URL` = `https://rajmotistudio.in`
3. If the project is configured separately for **Preview** deployments, set appropriate preview vars there only if you intend to test real authentication on preview.
4. Check the production build settings: `npm run build`, output directory `dist`, expected branch `main`.
5. Trigger a new deployment **after** changing variables. Vite's `VITE_*` variables are embedded in built client JavaScript; changing runtime variables without rebuilding will not fix old assets.

The URL and publishable key are intentionally PUBLIC client values. **Never** put a
Supabase `service_role` or secret key in a `VITE_*` variable, repository, or client JS.

## Supabase authentication

1. Use the same Supabase project whose URL/key you set in Cloudflare.
2. Authentication → Users: verify the owner account exists and can authenticate.
   If accounts were previously in Lovable-hosted Supabase, source-code migration alone
   **does not** migrate users, passwords, or storage; restore approved user data or
   create/invite an owner account in the new project.
3. Authentication → URL Configuration:
   - Site URL: `https://rajmotistudio.in`
   - Additional redirect URLs for the app's recovery and confirmation flow:
     `https://rajmotistudio.in/auth`,
     `https://rajmotistudio.in/reset-password`,
     `https://rajmotistudio.in/auth?confirmed=1`.
4. Admin access is controlled by a **server-enforced database role**:
   `public.has_role(auth.uid(), 'admin')`. Check that your migrations have created
   `public.user_roles` and `public.has_role`, then assign `admin` to the correct
   owner UID via trusted Supabase admin tooling. Do **not** grant admin based on
   editable email fields or just hide links in the UI. Confirm RLS on private tables
   and storage buckets.
5. Staff accounts should be invited/provisioned by an authorized admin.
   Public self-registration is not exposed on the sign-in page.

## Verify before publishing

- In a private/incognito window open `/auth`. Login form appears.
- Submit invalid credentials: authentication fails safely.
- Submit valid non-admin credentials: admin route remains forbidden.
- Submit valid admin credentials: `/admin` loads and private data reads follow RLS.
- Test logout, reload, and password reset.
- Review Cloudflare deployment logs if the site still shows the fallback screen.
- Confirm no public route exposes owner operations or customer images.
- Verify real, restored customer data and a backup before enabling any mutations.

## If login still cannot be enabled

Do not show a fake sign-in page or turn on the demo admin. In production
`VITE_DATA_MODE=demo` intentionally disables the admin login. If the site has no
Supabase project, connect/provision it first, restore schema and users, and apply
the production credentials during the Cloudflare build.
