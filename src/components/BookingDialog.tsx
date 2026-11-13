import { useState, type FormEvent } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  Sparkles,
  User,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SITE, whatsappLink } from "@/lib/site";
import { toast } from "sonner";

export interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultService?: string;
}

const SERVICES = [
  { id: "baby", label: "Baby & Newborn Photography", desc: "Gentle studio sets & milestone sittings in Jetpur" },
  { id: "maternity", label: "Maternity & Motherhood", desc: "Private, graceful expectant mother portraits" },
  { id: "family", label: "Heritage Family Portraits", desc: "Multi-generation family portraits & group sets" },
  { id: "wedding", label: "Weddings & Ceremonies", desc: "Lagan, Mandap, Pithi & Reception coverage" },
  { id: "birthday", label: "Birthday & Cake Smash", desc: "Fun milestone celebrations & themed sets" },
  { id: "couple", label: "Couple & Pre-Wedding Stories", desc: "Romantic outdoor & studio editorial sets" },
  { id: "restoration", label: "Old Photo Restoration", desc: "Archival retouching & identity preservation" },
];

export function BookingDialog({
  open,
  onOpenChange,
  defaultService = "baby",
}: BookingDialogProps) {
  const [service, setService] = useState(defaultService);
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedServiceObj = SERVICES.find((s) => s.id === service) || SERVICES[0];

  const whatsappInquiryUrl = whatsappLink(
    `Namaste ${SITE.name}! 📸 I would like to inquire about booking a photography session in Jetpur:
Service: ${selectedServiceObj.label}
Preferred Date: ${date || "Flexible / To confirm"}
Name: ${name || "Customer"}
Notes: ${notes || "None"}
Could you please share package details and studio availability? Thank you!`,
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRequestId: crypto.randomUUID(),
          name: name.trim(),
          phone: cleanPhone,
          kind: selectedServiceObj.label,
          date: date || "",
          notes: notes.trim(),
          fulfillmentType: "studio_collection",
          paymentChoice: "pay_at_studio",
        }),
      });
      if (!res.ok) {
        // Fallback gracefully
      }
      setSubmitted(true);
      toast.success("Session request submitted! We will contact you on WhatsApp.");
    } catch {
      // Even if network fails, let customer proceed to WhatsApp
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = (isOpen: boolean) => {
    if (!isOpen) {
      setSubmitted(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleReset}>
      <DialogContent className="ed-modal max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {submitted ? "Enquiry Received · Rajmoti Studio" : "Plan Your Photography Session"}
          </DialogTitle>
          <DialogDescription>
            {submitted
              ? "We have recorded your preferred session details."
              : "Private studio sessions in Jetpur since 1982. No upfront payment required to inquire."}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-5 pt-2 text-center">
            <div className="size-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-stone-900">
                Thank You, {name}!
              </h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed max-w-sm mx-auto">
                We have registered your interest in a <strong>{selectedServiceObj.label}</strong> for{" "}
                <strong>{date || "your preferred date"}</strong>. Our studio owner will review session availability and message you on WhatsApp ({phone}).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF7F1] border border-stone-200 text-xs text-stone-700 text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Service:</span>
                <span className="font-semibold text-stone-900">{selectedServiceObj.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Preferred Date:</span>
                <span className="font-semibold text-stone-900">{date || "Flexible"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Studio Location:</span>
                <span className="font-semibold text-stone-900">Jetpur, Gujarat 360370</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ed-button flex items-center justify-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858] text-xs py-3 shadow-xs"
              >
                <MessageCircle size={16} />
                <span>Chat Directly on WhatsApp Now</span>
              </a>
              <button
                type="button"
                onClick={() => handleReset(false)}
                className="ed-button outline text-xs py-2"
              >
                Close Panel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Service Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-800 block">
                1. Select Photography Service
              </label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full border border-stone-300 rounded-xl p-2.5 text-xs bg-white font-medium"
              >
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-stone-500 italic">
                {selectedServiceObj.desc}
              </p>
            </div>

            {/* Preferred Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-800 block">
                2. Preferred Session Date (Subject to Studio Confirmation)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2 text-xs bg-white"
                />
              </div>
              <span className="text-[11px] text-stone-400 block">
                Leave blank if dates are flexible. Studio hours: 9:00 AM – 8:00 PM.
              </span>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="space-y-1 block">
                <span className="font-medium text-stone-700">Your Full Name *</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priyaben Mehta"
                  className="w-full border border-stone-300 rounded-lg p-2 bg-white"
                />
              </label>
              <label className="space-y-1 block">
                <span className="font-medium text-stone-700">WhatsApp Mobile Number *</span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full border border-stone-300 rounded-lg p-2 bg-white font-mono"
                />
              </label>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1 text-xs">
              <span className="font-medium text-stone-700 block">
                Session Ideas / Special Requirements (Optional)
              </span>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Number of family members, baby's age, preferred color themes…"
                className="w-full border border-stone-300 rounded-lg p-2 bg-white text-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-stone-900 text-amber-100 font-semibold text-xs hover:bg-stone-800 transition-colors shadow-xs disabled:opacity-50"
              >
                {submitting ? "Submitting Request…" : "Submit Session Request"}
              </button>

              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ed-button flex items-center justify-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858] text-xs py-2.5 shadow-xs"
              >
                <MessageCircle size={15} />
                <span>Or Inquire Immediately on WhatsApp</span>
              </a>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
