# Rajmoti Studio — Photography, Gifts & Production Work Desk

Private source for the Rajmoti Studio photography brand and its zero-monthly-fee production pilot.

- **Public site:** React 19 + TanStack Router + Vite; editorial portfolios, gifts, session enquiries.
- **Production intake:** Cloudflare Pages Functions + D1.
- **Customer files:** private, temporary Cloudflare R2 originals; never overwrite originals.
- **Owner work desk:** \`/desk\`, Cloudflare Access JWT validated on every owner API, with walk-in intake, job stages, print presets, instructions, memorial fields, review gates and manually verified payment ledger.
- **Customer tracking:** 30-day private signed order-status links with no private images or customer identity displayed.
- **Local studio archive:** verify two independent backups, then manually purge eligible cloud copies **only after 30 days from delivery**.
- **Existing demo website admin:** locked in production when built without Supabase; demo data is still used for portfolio/catalogue illustrations.

The domain is not required to build or test the app. Configure the free-tier infrastructure first.

**Setup and remaining production blockers:** [ZERO-COST-DEPLOYMENT.md](ZERO-COST-DEPLOYMENT.md).

**Not yet connected:** Cloudflare deployment credentials, R2/D1 bindings, production Turnstile and Access policies, original live Lovable photos/contacts, actual gift prices, automated online payment settlement, and Rajmoti OS Firestore synchronization. This development branch is intentionally not deployed or merged.
