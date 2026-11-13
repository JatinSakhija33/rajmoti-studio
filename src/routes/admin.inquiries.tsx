import { DemoEnquiryInbox } from '@/features/editorial/demo-enquiry-inbox';
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inquiriesQuery } from "@/lib/queries";
import { SERVICES } from "@/lib/booking-questions";
import { FamilyProfileDrawer } from "@/components/admin/family-profile-drawer";
import { createBooking, linkOrCreateCustomer, todayKey } from "@/lib/bookings";


const STATUSES = ["new", "contacted", "follow_up", "confirmed", "booked", "completed", "closed", "cancelled"] as const;
type Status = typeof STATUSES[number];

export const Route = createFileRoute("/admin/inquiries")({
  component: AdminInquiries,
});

function AdminInquiries() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  /** Turn an enquiry into a real booking (customer → booking → money). */
  async function convertToBooking(i: any) {
    try {
      const svc = SERVICES.find((s: any) => s.key === i.service_type);
      const customerId = await linkOrCreateCustomer({
        name: i.family_name || i.name,
        phone: i.phone || i.whatsapp,
        serviceSlug: i.service_type ?? null,
      });
      await createBooking({
        customer_id: customerId,
        inquiry_id: i.id,
        contact_name: i.family_name || i.name || null,
        phone: i.phone || i.whatsapp || null,
        service_slug: i.service_type ?? null,
        service_label: svc?.title ?? i.category_label ?? null,
        session_date: i.session_date || todayKey(),
        total_amount: Number(i.total_amount ?? 0),
        paid_amount: 0,
        status: "confirmed",
        notes: i.message ?? null,
      });
      await supabase.from("inquiries").update({ status: "booked" }).eq("id", i.id);
      qc.invalidateQueries({ queryKey: ["inquiries"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking created");
      navigate({ to: "/admin/bookings" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create booking");
    }
  }

  const { data: inquiries = [] } = useQuery(inquiriesQuery);
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

      <div className="space-y-2">
        {filtered.map((i: any) => {
          const svc = SERVICES.find((s) => s.key === i.service_type);
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
              <button onClick={() => convertToBooking(i)} title="Create booking" className="p-2 hover:text-gold"><CalendarPlus className="size-4" /></button>
              <button onClick={() => del(i.id)} className="text-destructive"><Trash2 className="size-4" /></button>

            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-24 text-muted-foreground border border-dashed border-onyx/20">
          <p className="font-display text-2xl italic">No inquiries match.</p>
        </div>
      )}

      <FamilyProfileDrawer open={!!openRow} row={openRow} onClose={() => setOpenId(null)} />
    </div>
  );
}
