import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Rajmoti Studio" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // After Supabase processes the recovery URL fragment, a session is set.
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const sub = supabase.auth.onAuthStateChange((evt) => {
      if (evt === "PASSWORD_RECOVERY" || evt === "SIGNED_IN") setReady(true);
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-dvh bg-cream text-onyx flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white border border-onyx/10 p-10 space-y-6">
        <h1 className="font-display text-3xl">Set a new password</h1>
        {!ready && <p className="text-sm text-muted-foreground">Validating reset link…</p>}
        <label className="block">
          <span className="eyebrow text-muted-foreground block mb-2">New password</span>
          <input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent border-0 border-b border-onyx/15 py-2 focus:outline-none focus:border-gold" />
        </label>
        <button disabled={loading || !ready} className="w-full py-3.5 bg-onyx text-cream text-[11px] uppercase tracking-[0.25em] font-semibold hover:bg-gold transition-colors disabled:opacity-50">
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
