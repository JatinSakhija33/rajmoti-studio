import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Aperture, LayoutDashboard, Images, FolderTree, Package, MailOpen, LogOut, ExternalLink, Settings, FileText, HardDrive, CalendarDays, Sparkles, Users, Film, Gift, ClipboardList, Plus, Search, Menu, CloudUpload } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AdminReminders } from "@/components/admin/reminder-indicator";
import { PhotoUploadProvider, usePhotoUpload } from "@/components/admin/photo-upload-queue";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import "@/components/admin/studio-workspace.css";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Rajmoti Studio" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminLayout,
});

const NAV = [
  { label: "Studio", items: [
    { to: "/admin", label: "Today", icon: LayoutDashboard, keywords: "dashboard overview priorities proof pickup" },
    { to: "/admin/workflow", label: "Jobs", icon: ClipboardList, keywords: "today production walk in edit memorial print" },
    { to: "/admin/calendar", label: "Calendar", icon: CalendarDays, keywords: "schedule agenda date event" },
    { to: "/admin/bookings", label: "Bookings", icon: CalendarDays, keywords: "confirmed sessions appointment" },
  ] },
  { label: "Customers", items: [
    { to: "/admin/contacts", label: "Contacts", icon: Users, keywords: "customers family phone" },
    { to: "/admin/inquiries", label: "Enquiries", icon: MailOpen, keywords: "inquiries leads inbox WhatsApp" },
    { to: "/admin/crm", label: "Reminders & offers", icon: Sparkles, keywords: "crm milestone follow up templates" },
  ] },
  { label: "Orders", items: [
    { to: "/admin/catalogue", label: "Product catalogue", icon: Package, keywords: "products prices variants gifts" },
    { to: "/admin/gifts", label: "Gift requests", icon: Gift, keywords: "gift inbox quote" },
    { to: "/admin/gift-orders", label: "Gift orders & payments", icon: Gift, keywords: "orders payments cash UPI" },
  ] },
  { label: "Website", items: [
    { to: "/admin/images", label: "Media Library", icon: Images, keywords: "gallery photos upload photographs" },
    { to: "/admin/content", label: "Content", icon: FileText, keywords: "home hero covers pages instagram seo" },
    { to: "/admin/reels", label: "Cinematic reels", icon: Film, keywords: "video films clips" },
    { to: "/admin/categories", label: "Categories", icon: FolderTree, keywords: "subcategory baby maternity family wedding" },
    { to: "/admin/packages", label: "Session packages", icon: Package, keywords: "collections prices shoot service" },
    { to: "/admin/booking", label: "Booking CMS", icon: Sparkles, keywords: "availability hours booking setup block day slots" },
  ] },
  { label: "Studio settings", items: [
    { to: "/admin/settings", label: "Settings", icon: Settings, keywords: "communication studio maps links whatsapp messages" },
    { to: "/admin/storage", label: "Storage", icon: HardDrive, keywords: "storage quota usage connection" },
  ] },
] as const;
const SECTIONS = NAV.flatMap((group) => [...group.items]);
const PHONE_SECTIONS = [NAV[0].items[0], NAV[0].items[1], NAV[1].items[0], NAV[3].items[0]];
function isCurrent(pathname: string, to: string) {
  return pathname.replace(/\/$/, "") === to || (to !== "/admin" && pathname.startsWith(to + "/"));
}

function AdminNavigation({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Studio administration" className="flex-1 space-y-3">
      {NAV.map(({ label, items }) => (
        <div key={label} role="group" aria-label={label}>
          <p className="mb-0.5 px-2 text-[11px] font-semibold text-[#77796e]">{label}</p>
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} aria-current={isCurrent(pathname, to) ? "page" : undefined} className="studio-nav-link">
              <Icon className="size-[15px] shrink-0" aria-hidden />{label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

function AdminLayout() {
  const { loading, user, adminLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading || adminLoading) {
    return <div role="status" className="min-h-dvh grid place-items-center text-muted-foreground">Checking studio access…</div>;
  }
  if (!user) {
    return <div className="min-h-dvh grid place-items-center text-muted-foreground">Please sign in as the studio owner.</div>;
  }
  if (!isAdmin) {
    return <div className="min-h-dvh grid place-items-center px-6 text-center"><div><h1 className="mb-4 text-3xl">Studio owner access only</h1><p className="mb-6 text-sm text-muted-foreground">This account needs an admin role to open studio records.</p><Link to="/" className="text-sm underline">Return to website</Link></div></div>;
  }

  return <PhotoUploadProvider key={user.id}><Workspace /></PhotoUploadProvider>;
}

function Workspace() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { items, busy } = usePhotoUpload();
  const [menu, setMenu] = useState<"search" | "new" | "more" | null>(null);
  const [search, setSearch] = useState("");
  const section = SECTIONS.find(({ to }) => isCurrent(pathname, to));
  const uploadCount = items.filter((item) => ["queued", "failed", "preparing", "saving"].includes(item.state)).length;

  function openMenu(next: "search" | "new" | "more") {
    setSearch("");
    setMenu(next);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setSearch("");
        setMenu((current) => current === "search" ? null : "search");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function signOut() {
    const result = await supabase.auth.signOut();
    if (!result.error) void navigate({ to: "/" });
  }

  const matches = SECTIONS.filter(({ label, keywords }) => `${label} ${keywords}`.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="studio-shell flex items-start">
      <a href="#studio-content" className="sr-only focus:not-sr-only">Skip to studio content</a>
      <aside className="sticky top-0 hidden h-dvh w-[14.5rem] shrink-0 flex-col overflow-y-auto border-r border-[#e7e3da] bg-[#f1efe8] px-3 py-4 md:flex lg:w-[16rem] lg:px-4">
        <Link to="/admin" className="mb-5 flex items-center gap-3 px-1">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#344b3d] text-[#f7f4e9]"><Aperture className="size-5" /></span>
          <span><strong className="block text-sm">Rajmoti Studio</strong><span className="text-xs text-muted-foreground">Studio workspace</span></span>
        </Link>
        <AdminNavigation pathname={pathname} />
        <div className="mt-4 flex flex-wrap gap-2 border-t border-onyx/10 px-1 pt-3">
          <a href="/" target="_blank" rel="noreferrer" className="studio-nav-link"><ExternalLink className="size-4" /> View site</a>
          <button onClick={() => void signOut()} className="studio-nav-link"><LogOut className="size-4" /> Sign out</button>
        </div>
      </aside>

      <main className="min-w-0 flex-1" id="studio-content">
        <header className="sticky top-0 z-30 border-b border-[#e7e3da] bg-[#f8f7f3]/95 px-3 py-2.5 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[90rem] items-center gap-2 sm:gap-3">
            <span className="mr-auto hidden text-sm font-semibold lg:block">{section?.label ?? "Studio"}</span>
            <button type="button" onClick={() => openMenu("search")} className="studio-secondary mr-auto justify-start sm:min-w-48 lg:mr-0">
              <Search className="size-4" /><span>Find a section</span><kbd className="ml-auto hidden text-xs text-muted-foreground sm:inline">Ctrl K</kbd>
            </button>
            {uploadCount > 0 && <Link to="/admin/images" hash="photo-upload" className="studio-secondary" aria-label={`${uploadCount} photos in upload queue`}><CloudUpload className="size-4" /> <span>{busy ? "Uploading" : "Uploads"}</span><span>{uploadCount}</span></Link>}
            <div className="hidden sm:block"><AdminReminders /></div>
            <button type="button" className="studio-primary" onClick={() => openMenu("new")}><Plus className="size-4" /> New</button>
          </div>
        </header>

        <div className="mx-auto max-w-[90rem] px-4 pb-[6.5rem] pt-6 sm:px-6 md:pb-8 lg:px-8 lg:pt-8">
          <Outlet />
        </div>

        <nav aria-label="Quick studio navigation" className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-[#e7e3da] bg-[#fffefa] px-1 pt-1 pb-[max(.25rem,env(safe-area-inset-bottom))] md:hidden">
          {PHONE_SECTIONS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} aria-current={isCurrent(pathname, to) ? "page" : undefined} className="studio-nav-link flex-1 flex-col justify-center gap-0.5 px-1.5 text-[10px]">
              <Icon className="size-[18px]" aria-hidden />{to === "/admin/images" ? "Media" : label}
            </Link>
          ))}
          <button type="button" onClick={() => openMenu("more")} className="studio-nav-link flex-1 flex-col justify-center gap-0.5 px-1.5 text-[10px]"><Menu className="size-[18px]" /> More</button>
        </nav>
      </main>

      <Dialog open={menu !== null} onOpenChange={(open) => { if (!open) setMenu(null); }}>
        <DialogContent className="studio-command max-h-[85dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-2xl border-[#e7e3da] bg-[#fffefa]">
          <DialogTitle>{menu === "new" ? "Create in Rajmoti Studio" : menu === "more" ? "Studio sections" : "Find a section"}</DialogTitle>
          <DialogDescription>{menu === "new" ? "Choose what you’d like to add." : "Open an admin page."}</DialogDescription>
          {menu === "new" ? <div className="grid gap-2">
            <Link to="/admin/workflow" search={{ create: "job" }} className="studio-nav-link" onClick={() => setMenu(null)}><ClipboardList className="size-4" /> New walk-in job</Link>
            <Link to="/admin/bookings" search={{ create: "booking" }} className="studio-nav-link" onClick={() => setMenu(null)}><CalendarDays className="size-4" /> New booking</Link>
            <Link to="/admin/contacts" search={{ create: "contact" }} className="studio-nav-link" onClick={() => setMenu(null)}><Users className="size-4" /> Add customer</Link>
            <Link to="/admin/images" hash="photo-upload" className="studio-nav-link" onClick={() => setMenu(null)}><CloudUpload className="size-4" /> Upload gallery photos</Link>
          </div> : <>
            <input type="search" autoFocus className="studio-field" aria-label="Search admin sections" placeholder="Try gallery, bookings or payments" value={search}
              onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => {
                if (event.key !== "Enter" || !matches.length) return;
                setMenu(null);
                void navigate({ to: matches[0].to });
              }} />
            <div className="grid gap-0.5">
              {matches.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className="studio-nav-link" onClick={() => setMenu(null)}><Icon className="size-4" />{label}</Link>
              ))}
              {!matches.length && <p className="text-sm text-muted-foreground">No sections match.</p>}
              {menu === "more" && <>
                <div className="my-2 border-t pt-2"><AdminReminders /></div>
                <a href="/" target="_blank" rel="noreferrer" className="studio-nav-link"><ExternalLink className="size-4" /> View site</a>
                <button onClick={() => void signOut()} className="studio-nav-link"><LogOut className="size-4" /> Sign out</button>
              </>}
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
