import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { liveBackend, backendConfigured } from "./backend-mode";
type Auth = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  adminLoading: boolean;
  isAdmin: boolean;
};
const demoUser = { id: "demo-owner", email: "demo@example.invalid" } as User;
// Never grant the demonstration owner identity in a production build.
const allowDemoOwner = !import.meta.env.PROD && !liveBackend;
const Ctx = createContext<Auth>({
  user: null,
  session: null,
  loading: true,
  adminLoading: false,
  isAdmin: false,
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(liveBackend);
  const [checked, setChecked] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    if (!liveBackend) return;
    if (!backendConfigured) {
      setLoading(false);
      return;
    }
    let active = true;
    const sub = supabase.auth.onAuthStateChange((_event, s) => {
      if (active) {
        setAdmin(false);
        setChecked(null);
        setSession(s);
        setLoading(false);
      }
    });
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active) {
          setSession(error ? null : data.session);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!liveBackend || !session?.user) {
      setAdmin(false);
      return;
    }
    let active = true;
    Promise.resolve(supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }))
      .then(({ data, error }) => {
        if (active) {
          setAdmin(!error && data === true);
          setChecked(session.user.id);
        }
      })
      .catch(() => {
        if (active) {
          setAdmin(false);
          setChecked(session.user.id);
        }
      });
    return () => {
      active = false;
    };
  }, [session]);
  const value: Auth = liveBackend
    ? {
        session,
        user: session?.user ?? null,
        loading,
        adminLoading: !!session?.user && checked !== session.user.id,
        isAdmin: admin && checked === session?.user.id,
      }
    : {
        user: allowDemoOwner ? demoUser : null,
        session: allowDemoOwner ? ({ user: demoUser } as Session) : null,
        loading: false,
        adminLoading: false,
        isAdmin: allowDemoOwner,
      };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useAuth() {
  return useContext(Ctx);
}
