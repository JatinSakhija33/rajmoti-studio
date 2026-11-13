import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Images, FolderTree, Package, MailOpen, LogOut, ExternalLink, Settings, FileText, HardDrive, CalendarDays, Sparkles, Heart, Film, Gift, ClipboardList } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AdminReminders } from "@/components/admin/reminder-indicator";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Rajmoti Studio" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/catalogue", label: "Product Catalogue", icon: Package },
  { to: "/admin/workflow", label: "Studio Workflow", icon: ClipboardList },
  { to: "/admin/gifts", label: "Gift Requests", icon: Gift },
  { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { to: "/admin/booking", label: "Booking CMS", icon: Sparkles, exact: true },

  { to: "/admin/contacts", label: "Contacts", icon: Heart },
  { to: "/admin/content", label: "Content", icon: FileText },
  { to: "/admin/images", label: "Gallery", icon: Images },
  { to: "/admin/reels", label: "Cinematic Reels", icon: Film },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/packages", label: "Packages", icon: Package },
  { to: "/admin/inquiries", label: "Inquiries", icon: MailOpen },
  { to: "/admin/storage", label: "Storage", icon: HardDrive },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/crm", label: "Reminders & offers", icon: Sparkles },
];

function AdminLayout() {
  const { loading, user, adminLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || adminLoading) {
    return <div className="min-h-dvh grid place-items-center text-muted-foreground">Checking studio access…</div>;
  }
  if (!user) {
    return <div className="min-h-dvh grid place-items-center text-muted-foreground">Please sign in as the studio owner.</div>;
  }
  if (!isAdmin) {
    return <div className="min-h-dvh grid place-items-center px-6 text-center"><div><h1 className="text-3xl mb-4">Studio owner access only</h1><p className="text-sm text-muted-foreground mb-6">Your account does not have the admin role required to open customer and production records.</p><Link to="/" className="underline text-sm">Return to website</Link></div></div>;
  }

  const nav = NAV;

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-dvh bg-cream text-onyx flex">
      <aside className="w-60 shrink-0 border-r border-onyx/10 p-6 hidden md:flex flex-col">
        <Link to="/" className="font-display text-xl tracking-[0.2em] uppercase mb-10">Rajmoti</Link>
        <nav className="space-y-1 flex-1">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${active ? "bg-onyx text-cream" : "hover:bg-onyx/5"}`}>
                <n.icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 pt-6 border-t border-onyx/10 space-y-3">
          <AdminReminders />
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-gold">
            <ExternalLink className="size-3" /> View site
          </a>
          <button onClick={signOut} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive">
            <LogOut className="size-3" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="md:hidden border-b border-onyx/10 p-4 flex justify-between items-center gap-3">
          <Link to="/" className="font-display tracking-[0.2em] uppercase">Rajmoti</Link>
          <div className="flex items-center gap-2">
            <AdminReminders />
            <button onClick={signOut} className="text-xs text-muted-foreground"><LogOut className="size-4" /></button>
          </div>
        </header>
        <div className="md:hidden border-b border-onyx/10 px-4 py-2 flex gap-3 overflow-x-auto text-xs">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="whitespace-nowrap py-1 hover:text-gold">{n.label}</Link>
          ))}
        </div>
        <div className="p-6 md:p-10 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
