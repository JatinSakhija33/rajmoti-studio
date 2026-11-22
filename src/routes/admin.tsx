import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Images, FolderTree, Package, MailOpen, LogOut, ExternalLink, Settings, FileText, HardDrive, CalendarDays, Sparkles, Heart, Film, Gift, ClipboardList } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AdminReminders } from "@/components/admin/reminder-indicator";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Rajmoti Studio" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminLayout,
});

const NAV = [
  { label: "Studio", items: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/workflow", label: "Today & jobs", icon: ClipboardList },
    { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  ] },
  { label: "Customers", items: [
    { to: "/admin/contacts", label: "Contacts", icon: Heart },
    { to: "/admin/inquiries", label: "Enquiries", icon: MailOpen },
    { to: "/admin/crm", label: "Reminders & offers", icon: Sparkles },
  ] },
  { label: "Catalogue & orders", items: [
    { to: "/admin/catalogue", label: "Product catalogue", icon: Package },
    { to: "/admin/gifts", label: "Gift requests", icon: Gift },
    { to: "/admin/gift-orders", label: "Gift orders & payments", icon: Gift },
  ] },
  { label: "Website", items: [
    { to: "/admin/content", label: "Content", icon: FileText },
    { to: "/admin/images", label: "Gallery", icon: Images },
    { to: "/admin/reels", label: "Cinematic reels", icon: Film },
    { to: "/admin/categories", label: "Categories", icon: FolderTree },
    { to: "/admin/packages", label: "Session packages", icon: Package },
    { to: "/admin/booking", label: "Booking CMS", icon: Sparkles },
    { to: "/admin/storage", label: "Storage", icon: HardDrive },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ] },
] as const;

function AdminNavigation({ pathname, mobile = false }: { pathname: string; mobile?: boolean }) {
  return (
    <nav aria-label="Studio administration" className={mobile ? "flex gap-5 overflow-x-auto border-b border-onyx/10 px-4 py-3 md:hidden" : "space-y-5 flex-1"}>
      {NAV.map(({ label, items }) => (
        <div key={label} role="group" aria-label={label} className={mobile ? "shrink-0" : undefined}>
          <p className="px-2 mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className={mobile ? "flex gap-1" : undefined}>
            {items.map(({ to, label, icon: Icon }) => {
              const active = pathname === to || (to !== "/admin" && pathname.startsWith(to + "/"));
              return (
                <Link key={to} to={to} aria-current={active ? "page" : undefined}
                  className={"flex items-center gap-2 rounded-sm whitespace-nowrap px-2 py-2 text-sm focus-visible:outline-2 focus-visible:outline-gold " +
                    (active ? "bg-onyx text-cream" : "hover:bg-onyx/5")}>
                  {!mobile && <Icon className="size-4 shrink-0" aria-hidden />}
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

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

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-dvh bg-cream text-onyx flex">
      <aside className="w-60 shrink-0 border-r border-onyx/10 p-6 hidden md:flex flex-col">
        <Link to="/" className="font-display text-xl tracking-[0.2em] uppercase mb-10">Rajmoti</Link>
        <AdminNavigation pathname={pathname} />
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
            <button onClick={signOut} aria-label="Sign out" className="text-xs text-muted-foreground"><LogOut className="size-4" /></button>
          </div>
        </header>
        <AdminNavigation pathname={pathname} mobile />
        <div className="p-6 md:p-10 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
