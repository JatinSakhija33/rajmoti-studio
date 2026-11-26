import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, CalendarDays, Check, Clock, IndianRupee, Mail, MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { completeTask, dueLabel, fetchDueTasks } from "@/lib/contact-workspace";
import { bookingsByDayQuery, bookingLabel, formatSessionTime, money, outstandingBookingsQuery } from "@/lib/bookings";
import { buildCustomerWhatsAppMessage, customerWhatsAppLink, DEFAULT_GOOGLE_PROFILE_URL, googleProfileUrlQuery } from "@/lib/customer-directory";
import { fetchStudioJobs, studioDateKey, type StudioJob } from "@/lib/studio-jobs";

export const Route = createFileRoute("/admin/")({ component: Overview });

const studioZone = "Asia/Kolkata";
const jobGroups = [
  { label: "Ready for pickup", action: "Open pickup", test: (job: StudioJob) => job.job_status === "ready" },
  { label: "Proofs to review", action: "Review proof", test: (job: StudioJob) => job.job_status === "review" && !job.review?.client_approved },
  { label: "Overdue", action: "Open job", test: (job: StudioJob, day: string) => Boolean(job.due_on && job.due_on < day) },
  { label: "Due today", action: "Open job", test: (job: StudioJob, day: string) => job.due_on === day },
];

function Overview() {
  const qc = useQueryClient();
  const now = new Date();
  const today = studioDateKey(now);
  const dayLabel = new Intl.DateTimeFormat("en-IN", { timeZone: studioZone, weekday: "long", day: "numeric", month: "long" }).format(now);
  const { data: googleUrl = DEFAULT_GOOGLE_PROFILE_URL } = useQuery(googleProfileUrlQuery);
  const jobs = useQuery({ queryKey: ["studio-jobs", "today"], queryFn: fetchStudioJobs, staleTime: 20_000 });
  const followUps = useQuery({ queryKey: ["due-tasks", today], queryFn: () => fetchDueTasks(today) });
  const sessions = useQuery(bookingsByDayQuery(today));
  const payments = useQuery(outstandingBookingsQuery);
  const closeFollowUp = useMutation({
    mutationFn: (id: string) => completeTask(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["due-tasks"] });
      void qc.invalidateQueries({ queryKey: ["next-actions"] });
    },
    onError: () => toast.error("The follow-up couldn’t be marked done."),
  });
  const enquiries = useQuery({
    queryKey: ["new-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inquiries").select("id,name,phone,category_label")
        .eq("status", "new").order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const outstanding = (payments.data ?? []).reduce((sum, booking) => sum + (Number(booking.balance_amount) || 0), 0);
  const jobsToPlace = (jobs.data ?? []).filter((job) => job.job_status !== "delivered");
  jobsToPlace.sort((a, b) => (a.due_on ?? "9999").localeCompare(b.due_on ?? "9999"));
  const groups = jobGroups.map((group) => {
    const records = jobsToPlace.filter((job) => group.test(job, today));
    const ids = new Set(records.map((job) => job.id));
    for (let index = jobsToPlace.length - 1; index >= 0; index--) {
      if (ids.has(jobsToPlace[index].id)) jobsToPlace.splice(index, 1);
    }
    return { ...group, records };
  }).filter((group) => group.records.length);
  const openJobs = groups.reduce((sum, group) => sum + group.records.length, 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">{dayLabel}</p>
          <h1 className="font-display text-4xl">Today at Rajmoti</h1>
        </div>
        <Link to="/admin/workflow" search={{ create: "job" }} className="studio-primary"><Plus className="size-4" /> New walk-in</Link>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(17rem,1fr)]">
        <div className="grid gap-4">
          <section className="studio-panel">
            <PanelTitle title="Work to do" link={<Link to="/admin/workflow" className="studio-secondary">All jobs <ArrowUpRight className="size-4" /></Link>} />
            <Feed loading={jobs.isPending} error={jobs.isError} retry={jobs.refetch} empty={!openJobs} message="No overdue jobs, proofs or pickups today.">
              {groups.map(({ label, action, records }) => (
                <div key={label} className="mt-4 first:mt-1">
                  <h3 className="mb-1 text-xs font-semibold text-muted-foreground">{label} · {records.length}</h3>
                  <ul className="divide-y divide-onyx/10">
                    {records.slice(0, 5).map((job) => {
                      const balance = Math.max(0, (job.total_amount ?? 0) - Number(job.amount_received));
                      return <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{job.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{job.photo_type} · {job.requested_size}{balance > 0 ? ` · ${money(balance)} due` : ""}</p>
                        </div>
                        <Link to="/admin/workflow" search={{ job: job.id }} aria-label={`${action} for ${job.customer_name}`} className="studio-secondary">{action}</Link>
                      </li>;
                    })}
                  </ul>
                </div>
              ))}
            </Feed>
          </section>

          <section className="studio-panel">
            <PanelTitle title="Follow-ups" icon={<Clock className="size-4" />} link={<Link to="/admin/contacts" className="studio-secondary">Contacts</Link>} />
            <Feed loading={followUps.isPending} error={followUps.isError} retry={followUps.refetch} empty={!followUps.data?.length} message="You’re caught up on follow-ups.">
              <ul className="divide-y divide-onyx/10">
                {followUps.data?.slice(0, 8).map((task) => {
                  const href = customerWhatsAppLink(task.customer?.phone, buildCustomerWhatsAppMessage({
                    name: task.customer?.customer_name,
                    serviceSlug: task.customer?.service_slug,
                    googleUrl,
                    kind: "followup",
                  }));
                  return <li key={task.id} className="flex flex-wrap items-center gap-2 py-2">
                    <button type="button" disabled={closeFollowUp.isPending} onClick={() => closeFollowUp.mutate(task.id)}
                      className="studio-icon" aria-label={`Mark ${task.what} done`}><Check className="size-4" /></button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{task.customer?.customer_name?.trim() || "Contact"}</p>
                      <p className="text-xs text-muted-foreground">{task.what} · {dueLabel(task.due_on)}</p>
                    </div>
                    {href && <a href={href} target="_blank" rel="noreferrer" className="studio-secondary"><MessageCircle className="size-4" /> WhatsApp draft</a>}
                  </li>;
                })}
              </ul>
            </Feed>
          </section>
        </div>

        <div className="grid gap-4">
          <section className="studio-panel">
            <PanelTitle title="Today’s sessions" icon={<CalendarDays className="size-4" />} link={<Link to="/admin/calendar" className="studio-secondary">Calendar</Link>} />
            <Feed loading={sessions.isPending} error={sessions.isError} retry={sessions.refetch} empty={!sessions.data?.length} message="No sessions booked today.">
              <ul className="divide-y divide-onyx/10">
                {sessions.data?.slice(0, 7).map((session) => (
                  <li key={session.id} className="flex justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0"><strong className="block truncate">{bookingLabel(session)}</strong><span className="text-xs text-muted-foreground">{session.service_label || session.package_name || "Session"}</span></span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatSessionTime(session)}</span>
                  </li>
                ))}
              </ul>
            </Feed>
          </section>

          <section className="studio-panel">
            <PanelTitle title="Booking balances" icon={<IndianRupee className="size-4" />} link={<Link to="/admin/bookings" className="studio-secondary">Bookings</Link>} />
            <Feed loading={payments.isPending} error={payments.isError} retry={payments.refetch} empty={!payments.data?.length} message="All booking balances are settled.">
              <p className="mb-2 text-lg font-semibold">{money(outstanding)} to collect</p>
              <ul className="divide-y divide-onyx/10">
                {payments.data?.slice(0, 4).map((booking) => (
                  <li key={booking.id} className="flex justify-between gap-2 py-2 text-sm">
                    <span className="truncate">{bookingLabel(booking)}</span><span>{money(booking.balance_amount)}</span>
                  </li>
                ))}
              </ul>
            </Feed>
          </section>

          <section className="studio-panel">
            <PanelTitle title="New enquiries" icon={<Mail className="size-4" />} link={<Link to="/admin/inquiries" className="studio-secondary">Inbox</Link>} />
            <Feed loading={enquiries.isPending} error={enquiries.isError} retry={enquiries.refetch} empty={!enquiries.data?.length} message="No new enquiries.">
              <ul className="divide-y divide-onyx/10">
                {enquiries.data?.map((enquiry) => (
                  <li key={enquiry.id} className="flex justify-between gap-2 py-2 text-sm">
                    <span className="truncate">{enquiry.name}</span><span className="text-xs text-muted-foreground">{enquiry.category_label || "General"}</span>
                  </li>
                ))}
              </ul>
            </Feed>
          </section>
        </div>
      </div>
    </div>
  );
}

function PanelTitle({ title, icon, link }: { title: string; icon?: ReactNode; link: ReactNode }) {
  return <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
    <h2 className="flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>
    {link}
  </div>;
}

function Feed({ loading, error, retry, empty, message, children }: {
  loading: boolean; error: boolean; retry: () => void; empty: boolean; message: string; children: ReactNode;
}) {
  if (loading) return <p className="py-3 text-sm text-muted-foreground" role="status">Loading…</p>;
  if (error) return <p className="py-3 text-sm text-destructive" role="alert">Couldn’t load this section. <button type="button" className="underline" onClick={retry}>Try again</button></p>;
  if (empty) return <p className="py-3 text-sm text-muted-foreground">{message}</p>;
  return <>{children}</>;
}
