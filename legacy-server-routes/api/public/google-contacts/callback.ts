import { createFileRoute } from "@tanstack/react-router";

/**
 * Google OAuth redirect target. Public by necessity, but it only accepts a
 * single-use `state` value that the admin-authenticated start function issued.
 */
export const Route = createFileRoute("/api/public/google-contacts/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const rawState = url.searchParams.get("state") ?? "";
        const [state, origin] = rawState.split("|");
        const back = (origin || url.origin).replace(/\/$/, "");
        const fail = (reason: string) =>
          Response.redirect(`${back}/admin/contacts?google=error&reason=${encodeURIComponent(reason)}`, 302);

        if (url.searchParams.get("error")) return fail("cancelled");
        if (!code || !state) return fail("missing_code");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: stateRow } = await supabaseAdmin
          .from("google_oauth_states")
          .select("state")
          .eq("state", state)
          .maybeSingle();
        if (!stateRow) return fail("invalid_state");
        await supabaseAdmin.from("google_oauth_states").delete().eq("state", state);

        try {
          const { exchangeCode, fetchGoogleProfile, redirectUriFor } = await import(
            "@/lib/google-contacts.server"
          );
          const tokens = await exchangeCode(code, redirectUriFor(back));
          const profile = await fetchGoogleProfile(tokens.access_token);

          await supabaseAdmin.from("google_contact_accounts").upsert(
            {
              google_account_id: profile.accountId,
              google_email: profile.email,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token ?? null,
              token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
              sync_status: "connected",
              connected_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: "google_account_id" },
          );
        } catch (err) {
          console.error("[google-contacts] callback failed", err);
          return fail("connect_failed");
        }

        return Response.redirect(`${back}/admin/contacts?google=connected`, 302);
      },
    },
  },
});
