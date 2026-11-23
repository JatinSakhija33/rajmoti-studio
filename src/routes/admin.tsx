import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Images, FolderTree, Package, MailOpen, LogOut, ExternalLink,
  Settings, FileText, HardDrive, CalendarDays, Sparkles, Heart, Film, Gift,
  ClipboardList, Menu, X, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AdminReminders } from "@/components/admin/reminder-indicator";
import { AdminReadiness } from "@/components/admin/admin-readiness";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Rajmoti OS — Studio administration" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminLayout,
});

const NAV = [
  { label: "Today", items: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/workflow", label: "Production workflow", icon: ClipboardList },
    { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/admin/bookings", label: "Session bookings", icon: CalendarDays },
  ] },
  { label: "Customers", items: [
    { to: "/admin/contacts", label: "Customer directory", icon: Heart },
    { to: "/admin/inquiries", label: "Enquiries", icon: MailOpen },
    { to: "/admin/crm", label: "Follow-ups & campaigns", icon: Sparkles },
  ] },
  { label: "Products & sales", items: [
    { to: "/admin/catalogue", label: "Product catalogue", icon: Package },
    { to: "/admin/gifts", label: "Gift requests", icon: Gift },
    { to: "/admin/gift-orders", label: "Orders & payments", icon: Gift },
  ] },
  { label: "Website", items: [
    { to: "/admin/content", label: "Website content", icon: FileText },
    { to: "/admin/images", label: "Photo gallery", icon: Images },
    { to: "/admin/reels", label: "Reels", icon: Film },
    { to: "/admin/categories", label: "Categories", icon: FolderTree },
    { to: "/admin/packages", label: "Session packages", icon: Package },
    { to: "/admin/booking", label: "Booking setup", icon: Sparkles },
    { to: "/admin/storage", label: "Media storage", icon: HardDrive },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ] },
  { label: "Administration", items: [
    { to: "/admin/system", label: "System health", icon: ShieldCheck },
  ] },
] as const;

function AdminNavigation({ pathname, onSelect }: { pathname: string; onSelect?: () => void }) {
  return (
    <nav aria-label="Studio administration" className="space-y-6">
      {NAV.map(({ label, items }) => (
        <section key={label} aria-label={label}>
          <h2 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</h2>
          <div className="space-y-0.5">
            {items.map(({ to, label: itemLabel, icon: Icon }) => {
              const active = pathname === to || (to !== "/admin" && pathname.startsWith(to + "/"));
              return (
                <Link key={to} to={to} onClick={onSelect}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] focus-visible:outline-2 focus-visible:outline-gold transition-colors ${active ? "bg-onyx text-cream font-semibold" : "text-onyx/80 hover:bg-onyx/5"}`}>
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0">{itemLabel}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function AdminLayout() {
  const { loading, user, adminLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => setMobileOpen(false), [pathname]);

  if (loading || adminLoading) {
    return <main className="min-h-dvh grid place-items-center text-sm text-muted-foreground" role="status">Checking studio access…</main>;
  }

  if (!user) {
    return <main className="min-h-dvh grid place-items-center text-sm text-muted-foreground">Please sign in as the studio owner.</main>;
  }

  if (!isAdmin) {
    return (
      <main className="min-h-dvh grid place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl mb-4">Studio owner access only</h1>
          <p className="text-sm text-muted-foreground mb-6">Your account does not have an administrator role for private studio records.</p>
          <Link to="/" className="underline text-sm">Return to website</Link>
        </div>
      </main>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-dvh bg-cream text-onyx md:flex">
      <aside className="hidden md:flex sticky top-0 h-dvh w-64 lg:w-72 shrink-0 flex-col border-r border-onyx/10 bg-white/70">
        <div className="px-6 pt-7 pb-6 border-b border-onyx/10">
          <Link to="/admin" className="font-display text-xl tracking-[0.19em] uppercase">Rajmoti</Link>
          <p className="text-[10px] uppercase tracking-[0.18em] text-gold mt-1">Studio operating system</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
          <AdminNavigation pathname={pathname} />
        </div>
        <div className="px-5 py-5 border-t border-onyx/10 space-y-3">
          <AdminReminders />
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-gold">
            <ExternalLink className="size-3.5" aria-hidden /> View public website
          </a>
          <button onClick={signOut} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive">
            <LogOut className="size-3.5" aria-hidden /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur border-b border-onyx/10">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8 lg:px-10">
            <div className="flex items-center gap-3 min-w-0">
              <button type="button" onClick={() => setMobileOpen((value) => !value)}
                aria-expanded={mobileOpen} aria-controls="rajmoti-mobile-nav"
                aria-label={mobileOpen ? "Close studio menu" : "Open studio menu"}
                className="md:hidden p-2 border border-onyx/15 rounded-md">
                {mobileOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Rajmoti OS</p>
                <p className="text-xs text-muted-foreground truncate">Private owner workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-44">{user.email}</span>
              <button type="button" onClick={signOut} className="md:hidden p-2" title="Sign out" aria-label="Sign out">
                <LogOut className="size-4" aria-hidden />
              </button>
            </div>
          </div>
          {mobileOpen && (
            <div id="rajmoti-mobile-nav" className="md:hidden max-h-[70dvh] overflow-y-auto border-t border-onyx/10 bg-cream px-4 py-5">
              <AdminNavigation pathname={pathname} onSelect={() => setMobileOpen(false)} />
            </div>
          )}
        </header>
        <div className="mx-auto w-full max-w-[1500px] px-4 py-7 md:px-8 md:py-9 lg:px-10">
          <AdminReadiness pathname={pathname} />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
