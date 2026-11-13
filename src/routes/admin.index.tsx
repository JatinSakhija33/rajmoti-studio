import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, IndianRupee, CalendarDays, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { completeTask, dueLabel, fetchDueTasks, todayISO } from "@/lib/contact-workspace";
import { bookingsByDayQuery, bookingLabel, formatSessionTime, money, outstandingBookingsQuery } from "@/lib/bookings";
import { buildCustomerWhatsAppMessage, customerWhatsAppLink, DEFAULT_GOOGLE_PROFILE_URL, googleProfileUrlQuery } from "@/lib/customer-directory";

export const Route = createFileRoute("/admin/")({
  component: Overview,
});

const spring = { type: "spring" as const, stiffness: 400, damping: 32 };

function Overview() {
  const qc = useQueryClient();
  const today = todayISO();
  const { data: googleUrl = DEFAULT_GOOGLE_PROFILE_URL } = useQuery(googleProfileUrlQuery);

  const followUps = useQuery({ queryKey: ["due-tasks", today], queryFn: () => fetchDueTasks(today) });

  const sessions = useQuery(bookingsByDayQuery(today));
  const payments = useQuery(outstandingBookingsQuery);


  const newInquiries = useQuery({
    queryKey: ["new-inquiries"],
    queryFn: async () => {
      const { data } = await supabase
        .from("inquiries")
        .select("id,name,phone,category_label,created_at")
        .eq("status", "new")
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as any[];
    },
  });

  const pendingTotal = (payments.data ?? []).reduce((sum, p) => sum + (Number(p.balance_amount) || 0), 0);

  return (
    <div>
      <header className="mb-8">
        <p className="eyebrow text-gold mb-2">Today</p>
        <h1 className="font-display text-4xl">
          {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {(followUps.data?.length ?? 0)} follow-up{(followUps.data?.length ?? 0) === 1 ? "" : "s"} ·{" "}
          {(sessions.data?.length ?? 0)} session{(sessions.data?.length ?? 0) === 1 ? "" : "s"} ·{" "}
          {(payments.data?.length ?? 0)} payment{(payments.data?.length ?? 0) === 1 ? "" : "s"} pending
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Follow-ups */}
        <section className="bg-white border border-onyx/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl flex items-center gap-2"><Clock className="size-4 text-gold" /> Follow-ups</h2>
            <Link to="/admin/contacts" className="eyebrow text-xs text-gold hover:underline">Contacts →</Link>
          </div>
          {followUps.isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
          ) : (followUps.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nothing to chase today.</p>
          ) : (
            <ul className="divide-y divide-onyx/5">
              <AnimatePresence initial={false}>
                {(followUps.data ?? []).map((t) => {
                  const href = customerWhatsAppLink(
                    t.customer?.phone,
                    buildCustomerWhatsAppMessage({
                      name: t.customer?.customer_name,
                      serviceSlug: t.customer?.service_slug,
                      googleUrl,
                      kind: "followup",
                    }),
                  );
                  return (
                    <motion.li key={t.id} layout exit={{ opacity: 0, x: 20 }} transition={spring}
                      className="py-2.5 flex items-center gap-3 text-sm">
                      <motion.button whileTap={{ scale: 0.85 }}
                        onClick={async () => { await completeTask(t.id); qc.invalidateQueries({ queryKey: ["due-tasks"] }); qc.invalidateQueries({ queryKey: ["next-actions"] }); }}
                        className="size-4 shrink-0 border border-onyx/30 grid place-items-center hover:border-gold" aria-label="Mark done">
                        <Check className="size-3 opacity-0 hover:opacity-100" />
                      </motion.button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{t.customer?.customer_name?.trim() || t.customer?.phone || "Contact"}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.what}</p>
                      </div>
                      <span className={`text-[11px] shrink-0 ${t.due_on < today ? "text-destructive" : "text-muted-foreground"}`}>{dueLabel(t.due_on)}</span>
                      {href && (
                        <a href={href} target="_blank" rel="noreferrer"
                          className="px-2 py-1.5 bg-[#25D366] text-onyx shrink-0" title="WhatsApp"><MessageCircle className="size-3.5" /></a>
                      )}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </section>

        {/* Today's sessions */}
        <section className="bg-white border border-onyx/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl flex items-center gap-2"><CalendarDays className="size-4 text-gold" /> Today's sessions</h2>
            <Link to="/admin/bookings" className="eyebrow text-xs text-gold hover:underline">Bookings →</Link>
          </div>
          {(sessions.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No sessions booked today.</p>
          ) : (
            <ul className="divide-y divide-onyx/5">
              {(sessions.data ?? []).map((e) => (
                <li key={e.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{bookingLabel(e)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {e.service_label || e.package_name || "Session"}{e.phone ? ` · ${e.phone}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatSessionTime(e)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pending payments */}
        <section className="bg-white border border-onyx/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl flex items-center gap-2"><IndianRupee className="size-4 text-gold" /> Pending payments</h2>
            {pendingTotal > 0 && <span className="text-xs text-muted-foreground">{money(pendingTotal)}</span>}
          </div>
          {(payments.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Everything settled.</p>
          ) : (
            <ul className="divide-y divide-onyx/5">
              {(payments.data ?? []).map((p) => (
                <li key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{bookingLabel(p)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(`${p.session_date}T00:00:00`).toLocaleDateString()} · paid {money(p.paid_amount)} of {money(p.total_amount)}
                    </p>
                  </div>
                  <span className="shrink-0 text-destructive">{money(p.balance_amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>


        {/* New enquiries */}
        <section className="bg-white border border-onyx/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl">New enquiries</h2>
            <Link to="/admin/inquiries" className="eyebrow text-xs text-gold hover:underline">All →</Link>
          </div>
          {(newInquiries.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No new enquiries.</p>
          ) : (
            <ul className="divide-y divide-onyx/5">
              {(newInquiries.data ?? []).map((i) => (
                <li key={i.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{i.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{i.category_label || "—"} · {i.phone || "no phone"}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{new Date(i.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
