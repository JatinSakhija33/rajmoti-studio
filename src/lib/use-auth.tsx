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
  const userId = session?.user.id;
  useEffect(() => {
    if (!liveBackend) return;
    if (!backendConfigured) {
      setLoading(false);
      return;
    }
    let active = true;
    let authEventSeen = false;
    const sub = supabase.auth.onAuthStateChange((_event, s) => {
      if (active) {
        authEventSeen = true;
        setSession(s);
        setLoading(false);
      }
    });
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active && !authEventSeen) {
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
    if (!liveBackend || !userId) {
      setAdmin(false);
      setChecked(null);
      return;
    }
    let active = true;
    Promise.resolve(supabase.rpc("has_role", { _user_id: userId, _role: "admin" }))
      .then(({ data, error }) => {
        if (active) {
          setAdmin(!error && data === true);
          setChecked(userId);
        }
      })
      .catch(() => {
        if (active) {
          setAdmin(false);
          setChecked(userId);
        }
      });
    return () => {
      active = false;
    };
  }, [userId]);
  const value: Auth = liveBackend
    ? {
        session,
        user: session?.user ?? null,
        loading,
        adminLoading: !!session?.user && checked !== session.user.id,
        isAdmin: admin && checked === session?.user.id,
      }
    : {
        user: null,
        session: null,
        loading: false,
        adminLoading: false,
        isAdmin: false,
      };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useAuth() {
  return useContext(Ctx);
}
