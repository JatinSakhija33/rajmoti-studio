import { DemoEnquiryInbox } from '@/features/editorial/demo-enquiry-inbox';
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { CalendarPlus, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inquiriesQuery } from "@/lib/queries";
import { customerWhatsAppLink } from "@/lib/customer-directory";
import { SERVICES } from "@/lib/booking-questions";
import { FamilyProfileDrawer } from "@/components/admin/family-profile-drawer";
import { bookingForEnquiry, createBooking, linkOrCreateCustomer, todayKey } from "@/lib/bookings";


const STATUSES = ["new", "contacted", "follow_up", "confirmed", "booked", "completed", "closed", "cancelled"] as const;
type Status = typeof STATUSES[number];

export const Route = createFileRoute("/admin/inquiries")({
  component: AdminInquiries,
});

function AdminInquiries() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const inProgress = useRef(new Set<string>());
  const [converting, setConverting] = useState<Set<string>>(new Set());

  async function convertToBooking(inquiry: any) {
    if (inProgress.current.has(inquiry.id)) return;
    inProgress.current.add(inquiry.id);
    setConverting(new Set(inProgress.current));
    try {
      let booking = await bookingForEnquiry(inquiry.id);
      if (!booking) {
        const service = SERVICES.find((entry) => entry.key === inquiry.service_type);
        const customerId = await linkOrCreateCustomer({
          name: inquiry.family_name || inquiry.name,
          phone: inquiry.phone || inquiry.whatsapp,
          serviceSlug: inquiry.service_type ?? null,
        });
        try {
          booking = await createBooking({
            customer_id: customerId,
            inquiry_id: inquiry.id,
            contact_name: inquiry.family_name || inquiry.name || null,
            phone: inquiry.phone || inquiry.whatsapp || null,
            service_slug: inquiry.service_type ?? null,
            service_label: service?.title ?? inquiry.category_label ?? null,
            session_date: inquiry.session_date || todayKey(),
            total_amount: Number(inquiry.total_amount ?? 0),
            paid_amount: 0,
            status: "confirmed",
            notes: inquiry.message ?? null,
          }, inquiry.id);
        } catch (error) {
          booking = await bookingForEnquiry(inquiry.id);
          if (!booking) throw error;
        }
      }
      if (inquiry.status !== "booked") {
        const { error } = await supabase.from("inquiries").update({ status: "booked" }).eq("id", inquiry.id);
        if (error) throw new Error("The booking exists. Try again to update the enquiry status.");
      }
      for (const key of ["inquiries", "new-inquiries", "bookings", "today-sessions", "pending-payments"]) {
        void qc.invalidateQueries({ queryKey: [key] });
      }
      toast.success("Booking linked to this enquiry");
      void navigate({ to: "/admin/bookings", search: { booking: booking.id } });
    } catch (error) {
      toast.error(error && typeof error === "object" && "message" in error ? String(error.message) : "Could not create booking");
    } finally {
      inProgress.current.delete(inquiry.id);
      setConverting(new Set(inProgress.current));
    }
  }

  const { data: inquiries = [], isError, isPending, refetch } = useQuery(inquiriesQuery);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [type, setType] = useState<"" | "bookings" | "messages">("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = (inquiries as any[]).filter((i) => {
    if (status && i.status !== status) return false;
    if (type === "bookings" && !i.session_date) return false;
    if (type === "messages" && i.session_date) return false;
    if (q) {
      const t = q.toLowerCase();
      return [i.name, i.family_name, i.child_name, i.email, i.phone, i.message, i.category_label].some((v) => v?.toLowerCase().includes(t));
    }
    return true;
  });

  async function del(id: string) {
    if (!confirm("Delete this inquiry?")) return;
    const { error } = await supabase.from("inquiries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["inquiries"] });
    qc.invalidateQueries({ queryKey: ["new-inquiries"] });
  }

  const openRow = openId ? (inquiries as any[]).find((i) => i.id === openId) : null;

  return (
    <div>
      <header className="mb-8">
        <p className="eyebrow text-gold mb-2">Inquiries</p>
        <h1 className="font-display text-4xl">Studio inbox</h1>
      </header>

      <DemoEnquiryInbox />
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="border border-onyx/15 px-3 py-2 text-sm bg-cream flex-1 min-w-60" />
        <select value={type} onChange={(e) => setType(e.target.value as any)} className="border border-onyx/15 px-3 py-2 text-sm bg-cream">
          <option value="">All types</option>
          <option value="bookings">Bookings only</option>
          <option value="messages">Messages only</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="border border-onyx/15 px-3 py-2 text-sm bg-cream">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isError && <p role="alert" className="mb-3 text-sm text-destructive">Enquiries couldn’t load. <button className="underline" onClick={() => void refetch()}>Try again</button></p>}
      {isPending && <p role="status" className="mb-3 text-sm text-muted-foreground">Loading enquiries…</p>}
      <div className="space-y-2">
        {filtered.map((i: any) => {
          const svc = SERVICES.find((s) => s.key === i.service_type);
          const whatsapp = customerWhatsAppLink(i.phone || i.whatsapp,
            `Hello ${i.family_name || i.name || "there"}, this is Rajmoti Studio following up on your enquiry.`);
          return (
            <div key={i.id} className="bg-white border border-onyx/10 p-4 flex items-center gap-4 hover:border-gold transition-colors">
              <button onClick={() => setOpenId(i.id)} className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{i.family_name || i.name}</p>
                  {i.child_name && <span className="text-xs text-muted-foreground">· {i.child_name}</span>}
                  <span className="eyebrow px-2 py-0.5 border border-onyx/15">{i.status}</span>
                  {svc && <span className="eyebrow px-2 py-0.5 bg-gold/10 text-gold">{svc.title}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {i.session_date
                    ? `${new Date(i.session_date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}${i.session_slot ? ` · ${i.session_slot}` : ""}`
                    : i.category_label ?? "Message"}
                  {" · "}{i.phone || i.email || "no contact"}
                  {" · "}{new Date(i.created_at).toLocaleDateString()}
                </p>
              </button>
              {whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" aria-label="Open WhatsApp draft" className="studio-icon"><MessageCircle className="size-4" /></a>}
              <button disabled={converting.has(i.id)} onClick={() => void convertToBooking(i)} aria-label={i.status === "booked" ? "Open linked booking" : "Create booking"} className="studio-icon"><CalendarPlus className="size-4" /></button>
              <button onClick={() => del(i.id)} className="text-destructive"><Trash2 className="size-4" /></button>

            </div>
          );
        })}
      </div>

      {!isError && !isPending && filtered.length === 0 && (
        <div className="text-center py-24 text-muted-foreground border border-dashed border-onyx/20">
          <p className="font-display text-2xl italic">No inquiries match.</p>
        </div>
      )}

      <FamilyProfileDrawer open={!!openRow} row={openRow} onClose={() => setOpenId(null)} />
    </div>
  );
}
