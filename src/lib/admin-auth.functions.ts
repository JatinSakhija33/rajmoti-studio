import { supabase } from "@/integrations/supabase/client";
// Admin assignment is performed in the Supabase dashboard, never by an email match.
export async function ensureStudioAdminRole() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Please sign in.");
  const result = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (result.error || result.data !== true)
    throw new Error("This account has no studio admin role. Ask the owner to grant access.");
  return { isAdmin: true };
}
export const STUDIO_ADMIN_EMAIL = "";
