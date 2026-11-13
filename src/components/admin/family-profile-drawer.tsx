import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { BOOKING_QUESTIONS, SERVICES, type ServiceKey } from "@/lib/booking-questions";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { whatsappLink, formatPrice } from "@/lib/site";
import { ExternalLink, Mail, Phone } from "lucide-react";

const STATUSES = ["new", "contacted", "confirmed", "completed", "cancelled"] as const;

export function FamilyProfileDrawer({ open, row, onClose }: { open: boolean; row: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  if (!row) return null;
  const svc = SERVICES.find((s) => s.key === row.service_type);
  const questions = svc ? BOOKING_QUESTIONS[svc.key as ServiceKey] : [];
  const answers = (row.answers ?? {}) as Record<string, string>;

  async function updateStatus(s: string) {
    const { error } = await supabase.from("inquiries").update({ status: s as any }).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    qc.invalidateQueries({ queryKey: ["inquiries"] });
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <p className="eyebrow text-gold">{svc?.title ?? row.category_label ?? "Inquiry"}</p>
          <SheetTitle className="font-display text-3xl">{row.family_name || row.name}</SheetTitle>
          {row.child_name && <SheetDescription>For {row.child_name}</SheetDescription>}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Date" value={row.session_date ? new Date(row.session_date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—"} />
            <Info label="Time" value={row.session_slot ?? "—"} />
            <Info label="Phone" value={row.phone} />
            <Info label="WhatsApp" value={row.whatsapp} />
            <Info label="Email" value={row.email} />
            <Info label="Status" value={row.status} />
            {row.total_price != null && <Info label="Total" value={formatPrice(row.total_price)} />}
            {row.advance_amount != null && <Info label="Advance" value={formatPrice(row.advance_amount)} />}
          </div>

          <div className="flex flex-wrap gap-2">
            {row.phone && <a href={`tel:${row.phone}`} className="eyebrow px-3 py-1.5 border border-onyx/15 hover:border-gold inline-flex items-center gap-1.5"><Phone className="size-3" /> Call</a>}
            {row.whatsapp && <a href={whatsappLink("", row.whatsapp)} target="_blank" rel="noreferrer" className="eyebrow px-3 py-1.5 border border-onyx/15 hover:border-gold inline-flex items-center gap-1.5"><ExternalLink className="size-3" /> WhatsApp</a>}
            {row.email && <a href={`mailto:${row.email}`} className="eyebrow px-3 py-1.5 border border-onyx/15 hover:border-gold inline-flex items-center gap-1.5"><Mail className="size-3" /> Email</a>}
          </div>

          <div>
            <p className="eyebrow text-muted-foreground mb-2">Set status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => updateStatus(s)}
                  className={`eyebrow px-3 py-1.5 border ${row.status === s ? "bg-onyx text-cream border-onyx" : "border-onyx/15 hover:border-gold"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {questions.length > 0 && Object.keys(answers).length > 0 && (
            <div>
              <p className="eyebrow text-gold mb-3">Family profile</p>
              <div className="space-y-3">
                {questions.filter((q) => answers[q.id]).map((q) => (
                  <div key={q.id} className="border-l-2 border-gold/40 pl-4">
                    <p className="text-xs text-muted-foreground mb-1">{q.label}</p>
                    <p className="text-sm">{answers[q.id]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {row.message && !Object.keys(answers).length && (
            <div>
              <p className="eyebrow text-muted-foreground mb-2">Message</p>
              <p className="text-sm whitespace-pre-wrap">{row.message}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="eyebrow text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}
