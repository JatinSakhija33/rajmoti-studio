# Rajmoti Studio — Production deployment notes

The production site is `https://rajmotistudio.in`. Cloudflare Pages watches
`main` and builds using `npm run build`, publishing the `dist` directory.

## 23 November 2026: Rebuild after enabling real Supabase configuration

The previous production deployment `fa662bdc`, source commit `0f2f47e`,
was built with `VITE_DATA_MODE=demo`. Its `/auth` route therefore displayed
"Studio sign-in is temporarily unavailable."

After the site administrator sets the **Production** Cloudflare Pages build
variables below, a **new build** is required because Vite inlines `VITE_*`
values during compilation:

- `VITE_DATA_MODE=supabase`
- `VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<your-public-publishable-key>`
- `VITE_PUBLIC_SITE_URL=https://rajmotistudio.in`
- `NODE_VERSION=22`

This documentation-only commit is used to trigger a production build through
the existing GitHub-to-Cloudflare Pages integration. No application code,
database, private credentials, customer records, or payment settings are changed.

## Verify the new Cloudflare deployment

1. In Cloudflare Pages → rajmoti-studio → Deployments, confirm a new **Production**
   deployment for `main` built successfully after this commit. Verify its
   environment-variable names and `VITE_DATA_MODE=supabase` in deployment details.
2. Open `https://rajmotistudio.in/auth` in a private browser window.
   It should display the owner sign-in form, not the unavailable message.
3. Authenticate with an existing account in the same Supabase project.
   The account must have an independently assigned `admin` role under the
   `public.has_role` access checks; do not grant admin access by email matching.
4. Verify anonymous and non-admin users cannot read private rows or storage.
5. Confirm galleries and public pages still use the intended production data.
   If the prior site relied on demo data, its disappearance is expected when
   switching to live Supabase and must be addressed before promoting the site.

Do not store service-role keys or any private secrets in this repository or in
`VITE_*` variables. Never enable demo owner access on the production domain.
