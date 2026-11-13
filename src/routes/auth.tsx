import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@/demo/server-stub";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";
import { ensureStudioAdminRole } from "@/lib/admin-auth.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Studio Access — Rajmoti Studio" }],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "reset";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ensureStudioAdmin = useServerFn(ensureStudioAdminRole);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const type = search.get("type") ?? hash.get("type");
    const confirmed = search.get("confirmed") === "1" || type === "signup";
    const authError = search.get("error_description") ?? hash.get("error_description");

    if (!confirmed && !authError) return;

    window.history.replaceState({}, document.title, window.location.pathname);

    if (authError) {
      toast.error(decodeURIComponent(authError.replace(/\+/g, " ")));
      return;
    }

    setMode("signin");
    void supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        await ensureStudioAdmin();
        toast.success("Email confirmed. Opening the studio panel.");
        navigate({ to: "/admin" });
      } else {
        toast.success("Email confirmed. Please sign in to open the studio panel.");
      }
    });
  }, [ensureStudioAdmin, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await ensureStudioAdmin();
        toast.success("Welcome back.");
        navigate({ to: "/admin" });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth?confirmed=1" },
        });
        if (error) throw error;
        if (data.session) {
          await ensureStudioAdmin();
          toast.success("Account created. Admin access requires an owner-assigned role.");
          navigate({ to: "/admin" });
        } else {
          setMode("signin");
          toast.success("Account created. Check your email to confirm, then sign in here.");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Password reset email sent.");
      }
    } catch (err: unknown) {
      toast.error(getAuthMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-cream text-onyx flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-10">
          <span className="font-display text-2xl tracking-[0.2em] uppercase">{SITE.name.split(" ")[0]}</span>
        </Link>
        <div className="bg-white border border-onyx/10 p-8 md:p-10">
          <h1 className="font-display text-3xl mb-2">
            {mode === "signin" ? "Studio access" : mode === "signup" ? "Create account" : "Reset password"}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {mode === "signin" ? "Sign in to manage the studio." : mode === "signup" ? "For studio staff only." : "We'll email you a reset link."}
          </p>
          <form onSubmit={onSubmit} className="space-y-5">
            <label className="block">
              <span className="eyebrow text-muted-foreground block mb-2">Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent border-0 border-b border-onyx/15 py-2 focus:outline-none focus:border-gold" />
            </label>
            {mode !== "reset" && (
              <label className="block">
                <span className="eyebrow text-muted-foreground block mb-2">Password</span>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent border-0 border-b border-onyx/15 py-2 focus:outline-none focus:border-gold" />
              </label>
            )}
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-onyx text-cream text-[11px] uppercase tracking-[0.25em] font-semibold hover:bg-gold transition-colors disabled:opacity-50">
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-onyx/10 text-xs space-y-2 text-muted-foreground">
            {mode !== "signin" && <button onClick={() => setMode("signin")} className="hover:text-gold block">← Back to sign in</button>}
            {mode === "signin" && (
              <>
                <button onClick={() => setMode("reset")} className="hover:text-gold block">Forgot password?</button>
                <button onClick={() => setMode("signup")} className="hover:text-gold block">Create studio account</button>
              </>
            )}
          </div>
        </div>
        <Link to="/" className="block text-center mt-8 eyebrow text-muted-foreground hover:text-gold">← Return to site</Link>
      </div>
    </div>
  );
}

function getAuthMessage(err: unknown) {
  const message = err instanceof Error ? err.message : "Something went wrong";
  if (/email not confirmed/i.test(message)) {
    return "This email is not confirmed yet. Please open the newest confirmation email, then sign in again.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "The email or password is incorrect. Use the same password you created, or reset it.";
  }
  return message;
}
