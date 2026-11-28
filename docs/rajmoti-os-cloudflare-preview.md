# Rajmoti OS — Cloudflare preview release checklist

Repository: `JatinSakhija33/rajmoti-studio`  
Production branch: `main`  
Feature branch: `feat/rajmoti-os-workflow-sync-20261128`  
Draft PR: https://github.com/JatinSakhija33/rajmoti-studio/pull/16

## Deploy preview only

The Cloudflare dashboard previously showed manually deployed Worker versions.
A GitHub push alone cannot publish a Cloudflare preview unless Cloudflare Builds / Git integration
is configured for this Worker or Pages project.

1. Confirm the Cloudflare project's connected GitHub repository is exactly this repository.
2. Keep the **production branch `main`**.
3. Enable non-production/branch preview deployments for the feature branch.
4. Configure appropriate build command and output/deploy settings matching the current Worker/Pages project.
5. Authorize the **exact new preview hostname** in Firebase Authentication → Settings → Authorized domains.
6. Enable Firebase Authentication Google Sign-In.
7. Sign in with an **existing** Firebase ADMIN identity; confirm `studios/rajmoti_studio/members/{uid}` active role.
8. Test Admin → Settings → Connections and Admin → Workflow read-only sessions / families from the **named** Firestore database.
9. Verify privacy, Firestore rules, no unexpected reads, no duplicates, and errors before merging the PR.

## What must not happen

- Do not merge the draft PR into `main` or deploy to the live site until explicitly approved.
- Do not alter the existing Supabase login or migrate/overwrite studio records.
- Do not insert Firebase Admin credentials in the browser.
- Do not claim synchronization works until a signed-in browser has returned real sessions/families.

## Current implementation

The feature branch uses version-pinned browser Firebase modules, Google popup sign-in,
a Firestore ADMIN membership check, and capped read-only listeners on `sessions` and `families`.
Review CI and a real preview login before rollout.
