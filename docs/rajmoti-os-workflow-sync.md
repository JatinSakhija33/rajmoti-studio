# Rajmoti OS Web Workflow + Smart Notes — Migration & Security Contract

Date: 2026-11-28. Status: **read-only mapping foundation implemented; live Firestore connection NOT yet activated**. All changes are isolated to a feature branch.

## Existing web implementation verified
- `src/routes/admin.workflow.tsx` calls `fetchStudioJobs` and `writeJob` from `src/lib/studio-jobs.ts`.
- Those methods currently read and upsert Supabase `public.studio_jobs`; the current workflow is not a listener for the Android database.
- `src/routes/admin.contacts.tsx` reads Supabase customer records and notes rather than the Android families collection.
- The admin login in `src/lib/use-auth.tsx` uses Supabase Auth. This does **not** authorize a Firebase user automatically.
- The Android system's named Firestore database is `ai-studio-rajmotistudioai-72e2debd-055c-4ab8-a5ef-f9c759cebfaf`, Firebase project `rajmoti-os`, root `studios/rajmoti_studio/`.

## Implementation foundation
`src/lib/rajmoti-os-firestore-contract.mjs` normalizes Firestore session and family snapshots. It does not write, grant permissions, synthesize bill numbers, or invent due dates. The associated test suite covers tenant filtering, required bill numbers, numeric family IDs, balances, and IST calendar boundaries.

## Next implementation milestones
1. Verify the Firebase *web app* configuration (not the Android google-services.json), approved Firebase Auth provider, named-database rules, and live admin membership.
2. Establish a trusted identity mapping between existing Supabase admin and Firebase Auth, with an explicit Firebase login when needed. Never write ADMIN membership from browser based on a user's claimed email. Authorized role assignments must originate from trusted administrator actions. Confirm Firestore rules check Firebase UID and active membership.
3. Add a pinned `firebase` JS SDK dependency with an updated lockfile. Initialize explicitly with `getFirestore(app, DATABASE_ID)`. Do not use the default database.
4. Add scoped, bounded `onSnapshot` listeners for `sessions`, `families`, `production_tasks`, and `money_transactions`. Present sync state: Connecting / Live / Offline / Error. Stop listeners upon unmount or logout.
5. Render Android jobs and customers in dedicated read-only views first. Do not co-mingle numeric Android session IDs with existing UUID Supabase job IDs. Preserve old local pending edits and offer a reviewed migration; never clear them automatically.
6. Verify actual Android schema with read-only production snapshots. Ensure `billNumber`, `id`, `familyId`, `createdDate`, `lastModifiedMs`, and tenant keys preserve Android types.
7. Only then add audited writes. Use Firestore transactions for family/session creation, collision-resistant numeric IDs, immutable payment transaction IDs and idempotency keys. Ensure exact Android stage values and numeric epoch-millisecond timestamps; never use `serverTimestamp()` in numeric fields.
8. Build Smart Notes as a note inbox with original text, line reference, extracted fields, explicit unverified ambiguity, customer match candidates, linked job, and financial confirmation. LLM extraction may prepare drafts but may not directly post financial entries. Distinguish `jama` (received), `baki` (outstanding), `cash`/`gpay` payment method, and deliberate strikethrough / highlighted markings without assuming they prove completion.
9. Historical note import: prevent duplicates with source-document hash + line number, retain raw text and image, review uncertain names/amounts and reconcile against existing Firestore sessions and money transactions before importing.
10. Verify actual Android and browser with an isolated test tenant before enabling web writes. Separately verify customer/profile history, work queue, and payment balances.

## Avoid dangerous assumptions
- A source note dated 09-11 without a due date is an entry date, **not** necessarily due on 09-11.
- `1500 gpay 650 baki` implies a total of 2150 only when both figures are for the same order; label inferred until reviewed.
- Some notes may refer to existing work, adjustments, inquiries, prints, or payments rather than new jobs.
- `m`, `m1`, highlighting, and strikethrough may be owner-specific conventions. Preserve their raw appearance and request a one-time interpretation before automating them.
- Do not rewrite `families.currentBaaki` independently of the established Android financial reconciliation logic.
- Do not create user membership or grant ADMIN based on client-provided email.

## Preview gate
No production Firestore data has been modified. Until Firebase web credentials and auth can be verified, the new adapter remains disconnected; existing Supabase workflow stays intact.


## Registered Firebase Web app (2026-11-28)

User supplied the Web SDK configuration for Firebase project `rajmoti-os`, Web app ID `1:350182272734:web:93629d267be9b686f8dc4f`. Browser API key is intentionally not duplicated in source control.

Committed config guard: `src/lib/rajmoti-firebase-web-config.mjs`. It reads `VITE_FIREBASE_API_KEY` and refuses a mismatched `VITE_FIREBASE_PROJECT_ID`. The fixed named database ID remains in that file and the Android contract.

**Operator setup**
1. Add `VITE_FIREBASE_API_KEY` to Cloudflare's Preview environment using the Firebase Web config shown in the console. Optionally set `VITE_FIREBASE_PROJECT_ID=rajmoti-os`.
2. Enable Google sign-in in Firebase Auth and add exactly the authorized preview domain used for testing. Production domains can be added separately when ready.
3. Review the named database's Firestore Rules before using any browser data listener.
4. Add Firebase JS SDK with a properly regenerated lockfile, then wire `getAuth(app)` and `getFirestore(app, FIREBASE_DATABASE_ID)` on the client, guarded against server-side rendering.
5. On Google sign-in, read `studios/rajmoti_studio/members/{auth.currentUser.uid}`; require an already-provisioned `active: true`, `role: "ADMIN"` membership. Never auto-provision privilege via browser.
6. Wire read-only `onSnapshot` for `sessions` and `families`, first displaying an isolated 'Android live data' panel, without changing the current Supabase workflow.
7. Run a test using an authorized account to verify IDs, field types, query limits, and cleanup. Then expand to production tasks and ledger with a staged migration.

**State:** Configuration prepared and regression tests committed. SDK dependency, Firestore listeners, cross-provider authentication, live verification and deployment are still pending. No customer data modified.
