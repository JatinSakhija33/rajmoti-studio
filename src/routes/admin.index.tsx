import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowRight, CalendarDays, Check, CircleDollarSign,
  ClipboardList, Clock3, IndianRupee, MessageCircle, ShieldCheck, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { completeTask, dueLabel, fetchDueTasks, todayISO } from "@/lib/contact-workspace";
import { bookingsByDayQuery, bookingLabel, formatSessionTime, money, outstandingBookingsQuery } from "@/lib/bookings";
import { buildCustomerWhatsAppMessage, customerWhatsAppLink, DEFAULT_GOOGLE_PROFILE_URL, googleProfileUrlQuery } from "@/lib/customer-directory";
import { fetchStudioJobs, phoneDigits, type StudioJob } from "@/lib/studio-jobs";
import { whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Today — Rajmoti Studio OS" }] }),
  component: Overview,
});

type NewInquiry = { id: string; name: string | null; phone: string | null; category_label: string | null; created_at: string };

function DataError({ label }: { label: string }) {
  return (
    <div role="status" className="py-6 text-sm text-amber-900">
      <p>Unable to load {label}. This is not a zero-record result.</p>
      <Link to="/admin/system" className="underline font-semibold text-xs inline-block mt-2">Check database setup</Link>
    </div>
  );
}

function WorkCard({ job }: { job: StudioJob }) {
  const balance = job.total_amount === null ? null : Math.max(0, job.total_amount - job.amount_received);
  const overdue = job.due_on && job.due_on < todayISO();
  const phone = phoneDigits(job.phone);

  return (
    <div className="border-b border-onyx/10 py-3 last:border-0 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-sm">{job.customer_name || "Unnamed customer"}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {job.photo_type} · {job.requested_size} · <span className={overdue ? "text-red-700 font-semibold" : ""}>
            {job.due_on ? new Date(`${job.due_on}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Not scheduled"}
            {overdue ? " · overdue" : ""}
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1 capitalize">
          {job.job_status} · {balance !== null && balance > 0 ? `₹${balance.toLocaleString("en-IN")} balance` : job.payment_status.replaceAll("_", " ")}
        </p>
      </div>
      <div className="flex gap-2 items-center">
        {phone.length === 10 && (
          <a href={whatsappLink(`Hello ${job.customer_name}, this is Rajmoti Studio about your ${job.photo_type} order.`, job.phone)}
            title="Message customer" target="_blank" rel="noreferrer" className="border border-onyx/15 rounded-md p-2">
            <MessageCircle className="size-4" aria-hidden />
          </a>
        )}
        <Link to="/admin/workflow" className="px-3 py-2 bg-onyx text-cream text-xs rounded-md">Open jobs</Link>
      </div>
    </div>
  );
}

function Overview() {
  const qc = useQueryClient();
  const today = todayISO();
  const { data: googleUrl = DEFAULT_GOOGLE_PROFILE_URL } = useQuery(googleProfileUrlQuery);

  const followUps = useQuery({ queryKey: ["due-tasks", today], queryFn: () => fetchDueTasks(today), retry: false });
  const sessions = useQuery({ ...bookingsByDayQuery(today), retry: false });
  const payments = useQuery({ ...outstandingBookingsQuery, retry: false });
  const jobs = useQuery({ queryKey: ["admin", "studio-jobs-summary"], queryFn: fetchStudioJobs, retry: false, staleTime: 30_000 });
  const newInquiries = useQuery({
    queryKey: ["new-inquiries"],
    retry: false,
    queryFn: async (): Promise<NewInquiry[]> => {
      const { data, error } = await supabase
        .from("inquiries")
        .select("id,name,phone,category_label,created_at")
        .eq("status", "new")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as NewInquiry[];
    },
  });

  const work = jobs.data ?? [];
  const active = work.filter((j) => j.job_status !== "delivered");
  const overdue = active.filter((j) => !!j.due_on && j.due_on < today);
  const proofs = active.filter((j) => j.job_status === "review" && !j.review?.client_approved);
  const pickup = active.filter((j) => j.job_status === "ready");
  const priority = { urgent: 0, high: 1, normal: 2, low: 3 };
  const focus = [...active]
    .sort((a, b) => {
      const aLate = !!a.due_on && a.due_on < today ? 0 : 1;
      const bLate = !!b.due_on && b.due_on < today ? 0 : 1;
      return aLate - bLate || priority[a.priority] - priority[b.priority] || (a.due_on || "9999").localeCompare(b.due_on || "9999");
    }).slice(0, 6);
  const unpaidTotal = (payments.data ?? []).reduce((sum, p) => sum + (Number(p.balance_amount) || 0), 0);
  const metrics = [
    { label: "Active production jobs", value: jobs.isError ? "—" : jobs.isPending ? "…" : String(active.length), hint: "From studio workflow", icon: ClipboardList, to: "/admin/workflow" },
    { label: "Overdue jobs", value: jobs.isError ? "—" : jobs.isPending ? "…" : String(overdue.length), hint: "Need immediate attention", icon: AlertTriangle, to: "/admin/workflow" },
    { label: "Sessions today", value: sessions.isError ? "—" : sessions.isPending ? "…" : String(sessions.data?.length ?? 0), hint: "Scheduled bookings", icon: CalendarDays, to: "/admin/bookings" },
    { label: "Outstanding bookings", value: payments.isError ? "—" : payments.isPending ? "…" : unpaidTotal.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }), hint: "Only known booking balances", icon: IndianRupee, to: "/admin/bookings" },
  ] as const;
  const hasError = [followUps, sessions, payments, jobs, newInquiries].some((q) => q.isError);

  async function markComplete(id: string) {
    try {
      await completeTask(id);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["due-tasks"] }),
        qc.invalidateQueries({ queryKey: ["next-actions"] }),
      ]);
      toast.success("Follow-up marked done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete follow-up");
    }
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <p className="eyebrow text-gold mb-2">Your studio at a glance</p>
          <h1 className="font-display text-4xl md:text-5xl">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Real work queues, payments and customer follow-ups — no sample numbers.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/workflow" className="bg-onyx text-cream px-4 py-3 text-xs font-semibold flex items-center gap-2 rounded-md">
            <ClipboardList className="size-4" aria-hidden /> Manage jobs
          </Link>
          <Link to="/admin/contacts" className="border border-onyx/20 px-4 py-3 text-xs font-semibold flex items-center gap-2 rounded-md">
            <MessageCircle className="size-4" aria-hidden /> Customers
          </Link>
        </div>
      </header>

      {hasError && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
          <span>Some live dashboard queries failed. A blank or dash is not proof that there is no work.</span>
          <Link to="/admin/system" className="underline font-semibold flex items-center gap-1">Open system health <ArrowRight className="size-3" /></Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(({ label, value, hint, icon: Icon, to }) => (
          <Link to={to} key={label} className="bg-white border border-onyx/10 rounded-sm p-4 md:p-5 hover:border-gold transition-colors">
            <div className="flex justify-between items-start gap-2">
              <p className="text-xs text-muted-foreground">{label}</p><Icon className="size-5 text-gold shrink-0" aria-hidden />
            </div>
            <p className="font-display text-3xl md:text-4xl mt-3 tabular-nums">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-2">{hint}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
        <section className="bg-white border border-onyx/10 p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div><p className="eyebrow text-gold mb-1">What needs action</p><h2 className="font-display text-2xl">Production priorities</h2></div>
            <Link to="/admin/workflow" className="text-xs underline">View board</Link>
          </div>
          {jobs.isError ? <DataError label="production jobs" />
            : jobs.isPending ? <p className="text-sm text-muted-foreground py-6">Loading studio jobs…</p>
              : focus.length === 0 ? <p className="text-sm text-muted-foreground py-6">No active jobs recorded yet. Add a walk-in job from the workflow board.</p>
                : focus.map((j) => <WorkCard key={j.id} job={j} />)}
        </section>
        <section className="bg-white border border-onyx/10 p-5 md:p-6">
          <p className="eyebrow text-gold mb-1">Before closing today</p>
          <h2 className="font-display text-2xl mb-5">Quality & delivery</h2>
          {jobs.isError ? <DataError label="quality checks" />
            : jobs.isPending ? <p className="text-sm text-muted-foreground">Checking jobs…</p>
              : (
                <div className="space-y-3">
                  <Link to="/admin/workflow" className="flex items-center justify-between gap-3 border-b border-onyx/10 pb-3 text-sm">
                    <span>Proofs awaiting approval</span><strong className="tabular-nums">{proofs.length}</strong>
                  </Link>
                  <Link to="/admin/workflow" className="flex items-center justify-between gap-3 border-b border-onyx/10 pb-3 text-sm">
                    <span>Ready for pickup / delivery</span><strong className="tabular-nums">{pickup.length}</strong>
                  </Link>
                  <Link to="/admin/workflow" className="flex items-center justify-between gap-3 text-sm">
                    <span>Overdue print or editing work</span><strong className="tabular-nums">{overdue.length}</strong>
                  </Link>
                </div>
              )}
          <div className="mt-6 border-t border-onyx/10 pt-5 text-xs text-muted-foreground flex items-start gap-2">
            <ShieldCheck className="size-4 text-gold shrink-0" aria-hidden />
            Keep every original photo unchanged. Approve face, print crop, Gujarati details and amount before dispatch.
          </div>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="bg-white border border-onyx/10 p-5">
          <div className="flex justify-between items-center gap-3 mb-4">
            <h2 className="font-display text-xl flex gap-2 items-center"><Clock3 className="size-4 text-gold" /> Due follow-ups</h2>
            <Link to="/admin/contacts" className="text-xs underline">Contacts</Link>
          </div>
          {followUps.isError ? <DataError label="customer follow-ups" />
            : followUps.isPending ? <p className="text-sm text-muted-foreground py-5">Loading follow-ups…</p>
              : followUps.data?.length === 0 ? <p className="text-sm text-muted-foreground py-5">No follow-ups due today.</p>
                : <div className="divide-y divide-onyx/10">{(followUps.data ?? []).slice(0, 6).map((t) => {
                  const href = customerWhatsAppLink(t.customer?.phone, buildCustomerWhatsAppMessage({
                    name: t.customer?.customer_name, serviceSlug: t.customer?.service_slug, googleUrl, kind: "followup",
                  }));
                  return <div key={t.id} className="py-3 flex items-center gap-3 text-sm">
                    <button onClick={() => void markComplete(t.id)} className="size-6 border border-onyx/30 rounded-sm grid place-items-center hover:bg-cream" title="Mark complete" aria-label={`Complete follow-up for ${t.customer?.customer_name || "contact"}`}>
                      <Check className="size-3" aria-hidden />
                    </button>
                    <div className="flex-1 min-w-0"><p className="truncate font-medium">{t.customer?.customer_name || t.customer?.phone || "Contact"}</p><p className="truncate text-xs text-muted-foreground">{t.what}</p></div>
                    <span className="text-[11px] text-muted-foreground">{dueLabel(t.due_on)}</span>
                    {href && <a href={href} target="_blank" rel="noreferrer" aria-label="Message customer on WhatsApp" className="border border-onyx/15 p-2 rounded-md"><MessageCircle className="size-4" /></a>}
                  </div>;
                })}</div>}
        </section>
        <section className="bg-white border border-onyx/10 p-5">
          <div className="flex justify-between items-center gap-3 mb-4">
            <h2 className="font-display text-xl flex gap-2 items-center"><CalendarDays className="size-4 text-gold" /> Today's sessions</h2>
            <Link to="/admin/bookings" className="text-xs underline">Bookings</Link>
          </div>
          {sessions.isError ? <DataError label="bookings" /> : sessions.isPending ? <p className="text-sm text-muted-foreground py-5">Loading sessions…</p>
            : sessions.data?.length === 0 ? <p className="text-sm text-muted-foreground py-5">No sessions booked today.</p>
              : <div className="divide-y divide-onyx/10">{(sessions.data ?? []).slice(0, 6).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0"><p className="truncate font-medium">{bookingLabel(item)}</p><p className="text-xs text-muted-foreground truncate">{item.service_label || item.package_name || "Session"}</p></div>
                <span className="text-xs text-muted-foreground shrink-0">{formatSessionTime(item)}</span>
              </div>)}</div>}
        </section>
        <section className="bg-white border border-onyx/10 p-5">
          <div className="flex justify-between items-center gap-3 mb-4">
            <h2 className="font-display text-xl flex items-center gap-2"><CircleDollarSign className="size-4 text-gold" /> Pending booking payments</h2>
            <Link to="/admin/bookings" className="text-xs underline">Bookings</Link>
          </div>
          {payments.isError ? <DataError label="booking balances" /> : payments.isPending ? <p className="text-sm text-muted-foreground py-5">Checking balances…</p>
            : payments.data?.length === 0 ? <p className="text-sm text-muted-foreground py-5">No pending booking payments recorded.</p>
              : <div className="divide-y divide-onyx/10">{(payments.data ?? []).slice(0, 6).map((p) => (
                <div key={p.id} className="py-3 flex justify-between items-center gap-3 text-sm"><span className="truncate">{bookingLabel(p)}</span><strong className="shrink-0">{money(p.balance_amount)}</strong></div>
              ))}</div>}
        </section>
        <section className="bg-white border border-onyx/10 p-5">
          <div className="flex justify-between items-center gap-3 mb-4">
            <h2 className="font-display text-xl flex items-center gap-2"><Sparkles className="size-4 text-gold" /> New enquiries</h2>
            <Link to="/admin/inquiries" className="text-xs underline">Open inbox</Link>
          </div>
          {newInquiries.isError ? <DataError label="enquiries" /> : newInquiries.isPending ? <p className="text-sm text-muted-foreground py-5">Loading enquiries…</p>
            : newInquiries.data?.length === 0 ? <p className="text-sm text-muted-foreground py-5">No new enquiries recorded.</p>
              : <div className="divide-y divide-onyx/10">{newInquiries.data?.map((i) => <div key={i.id} className="py-3 text-sm flex justify-between items-center gap-3">
                <div className="min-w-0"><p className="truncate font-medium">{i.name || "Customer"}</p><p className="text-xs truncate text-muted-foreground">{i.category_label || "General"} · {i.phone || "No number"}</p></div>
                <span className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleDateString("en-IN")}</span>
              </div>)}</div>}
        </section>
      </div>
    </div>
  );
}
