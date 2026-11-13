import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Clock3,
  ArrowLeft,
  Truck,
  MapPin,
  ShieldCheck,
  MessageCircle,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { UpiQrCode } from "@/components/UpiQrCode";
import { whatsappLink } from "@/lib/site";
import { toast } from "sonner";

export const Route = createFileRoute("/track/$id")({
  validateSearch: (x: Record<string, unknown>) => ({
    token: typeof x.token === "string" ? x.token : "",
  }),
  head: () => ({
    meta: [
      { title: "Private Order Tracking — Rajmoti Studio" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Tracking,
});

type Status = {
  reference: string;
  status: string;
  fulfillmentType?: string;
  paymentStatus: string;
  quotedAmount: number;
  paidAmount: number;
  totalAmountPaise?: number;
  verifiedPaidPaise?: number;
  deliveryChargePaise?: number;
  dueDate: string;
  createdAt: string;
  upiUri?: string | null;
  payeeVpa?: string;
  beneficiaryName?: string;
  items?: Array<{
    productId?: string;
    variantId?: string;
    quantity?: number;
    personalisation?: string;
  }>;
  customization?: Record<string, unknown> | null;
};

const stepLabels = [
  "received",
  "editing",
  "review",
  "printing",
  "framing",
  "ready",
  "delivered",
];

function Tracking() {
  const { id } = Route.useParams();
  const { token } = Route.useSearch();
  const [data, setData] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // UTR submission
  const [utr, setUtr] = useState("");
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [utrRecorded, setUtrRecorded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let active = true;
    const get = async () => {
      try {
        const r = await fetch(
          "/api/track/" + encodeURIComponent(id) + "?token=" + encodeURIComponent(token),
          { cache: "no-store" },
        );
        const result = await r.json();
        if (!r.ok) throw Error(result.error || "Tracking unavailable");
        if (active) setData(result);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Tracking unavailable");
      } finally {
        if (active) setLoading(false);
      }
    };
    void get();
    return () => {
      active = false;
    };
  }, [id, token]);

  const step = data ? stepLabels.indexOf(data.status) : -1;
  const totalPaise = data ? Number(data.totalAmountPaise ?? data.quotedAmount ?? 0) : 0;
  const verifiedPaidPaise = data ? Number(data.verifiedPaidPaise ?? data.paidAmount ?? 0) : 0;
  const remainingPaise = Math.max(0, totalPaise - verifiedPaidPaise);
  const isFullyPaid = totalPaise > 0 && remainingPaise === 0;

  const handleUtrSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!utr.trim()) return;
    setSubmittingUtr(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utr: utr.trim(),
          amount: (remainingPaise / 100).toFixed(2),
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Could not record UTR");
      setUtrRecorded(true);
      toast.success("UTR submitted! Studio owner will reconcile against bank records.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit UTR");
    } finally {
      setSubmittingUtr(false);
    }
  };

  const copyTrackingLink = () => {
    void navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success("Private tracking link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="editorial">
      <SiteNav />
      <main className="ed-wrap py-14 max-w-3xl">
        <p className="ed-kicker">Rajmoti Studio · Private Order Tracking</p>
        <h1 className="font-display text-4xl md:text-5xl mb-4">
          A little progress. <em>A lasting memory.</em>
        </h1>

        {loading ? (
          <p className="ed-copy">Checking studio production records…</p>
        ) : error ? (
          <p role="alert" className="ed-notice">
            {error}
          </p>
        ) : (
          data && (
            <div className="space-y-6">
              {/* Order Reference and Fulfilment Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-amber-900 block">
                    Public Reference
                  </span>
                  <span className="font-mono text-2xl font-bold text-stone-900">
                    {data.reference}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border shadow-2xs">
                  {data.fulfillmentType === "home_delivery" ? (
                    <span className="flex items-center gap-1.5 text-amber-950 bg-amber-50 border-amber-300">
                      <Truck size={15} className="text-amber-800" />
                      Home Delivery — Full Prepayment Compulsory
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-blue-950 bg-blue-50 border-blue-300">
                      <MapPin size={15} className="text-blue-800" />
                      Studio Collection — Pay Online or at Studio
                    </span>
                  )}
                </div>
              </div>

              {/* Step Progress Tracker */}
              <div className="border border-[#e6ddd1] p-6 bg-white rounded-2xl shadow-xs">
                <div className="flex items-center gap-3 mb-6">
                  {data.status === "delivered" ? (
                    <CheckCircle2 size={28} className="text-emerald-700" />
                  ) : (
                    <Clock3 size={28} className="text-amber-800" />
                  )}
                  <div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold capitalize text-stone-900">
                      {data.status.replaceAll("_", " ")}
                    </h2>
                    <p className="text-xs text-stone-500">
                      Current stage in our Jetpur workshop
                    </p>
                  </div>
                </div>

                <ol className="flex flex-col sm:flex-row gap-2 sm:gap-1 justify-between pt-2">
                  {stepLabels.map((s, i) => (
                    <li
                      key={s}
                      className="flex sm:flex-col items-center gap-2 sm:gap-1.5 text-xs text-center flex-1"
                    >
                      <span
                        className={
                          "w-7 h-7 rounded-full text-xs grid place-items-center font-bold " +
                          (i <= step
                            ? "bg-[#4c6d57] text-white shadow-xs"
                            : "bg-[#eee8de] text-[#726d66]")
                        }
                      >
                        {i + 1}
                      </span>
                      <span
                        className={
                          "capitalize " +
                          (i <= step ? "font-bold text-stone-900" : "text-[#888078]")
                        }
                      >
                        {s}
                      </span>
                    </li>
                  ))}
                </ol>

                {data.status === "cancelled" && (
                  <p className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl">
                    This order was cancelled. Please contact Rajmoti Studio on WhatsApp for assistance.
                  </p>
                )}

                {data.dueDate && (
                  <p className="mt-5 text-xs text-stone-600">
                    Estimated ready date: <strong>{data.dueDate}</strong>. Studio hours: 9:00 AM – 8:00 PM.
                  </p>
                )}
              </div>

              {/* Financial Ledger & Payment Action Panel */}
              <div className="border border-[#e6ddd1] p-6 bg-[#FAF7F1] rounded-2xl space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                  <h3 className="font-bold text-stone-900 text-sm">
                    Order Payment Ledger
                  </h3>
                  <div className="font-mono text-xs">
                    {isFullyPaid ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        ✓ 100% Verified Paid
                      </span>
                    ) : (
                      <span className="text-amber-900 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        Balance Due: ₹{(remainingPaise / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-stone-200">
                    <span className="text-stone-500 block">Total Quoted</span>
                    <strong className="font-mono text-stone-900 text-sm">
                      ₹{(totalPaise / 100).toFixed(2)}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-stone-200">
                    <span className="text-stone-500 block">Verified Paid</span>
                    <strong className="font-mono text-emerald-700 text-sm">
                      ₹{(verifiedPaidPaise / 100).toFixed(2)}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-stone-200">
                    <span className="text-stone-500 block">Outstanding</span>
                    <strong className="font-mono text-amber-900 text-sm">
                      ₹{(remainingPaise / 100).toFixed(2)}
                    </strong>
                  </div>
                </div>

                {/* Scenario A: Home Delivery & Unpaid/Pending */}
                {data.fulfillmentType === "home_delivery" && !isFullyPaid && (
                  <div className="space-y-4 pt-2">
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
                      <AlertTriangle size={18} className="text-amber-800 shrink-0 mt-0.5" />
                      <div>
                        <strong>Prepayment Required Before Dispatch:</strong> Home Delivery orders
                        require full verified payment via UPI. Your package cannot be dispatched until
                        payment is verified in studio bank records.
                      </div>
                    </div>

                    {data.upiUri && (
                      <UpiQrCode
                        upiUri={data.upiUri}
                        amountRupees={remainingPaise / 100}
                        payeeVpa={data.payeeVpa || "9429070317@apl"}
                        beneficiaryName={data.beneficiaryName || "PANKAJ LAXMICHAND SAKHIJA"}
                        orderRef={data.reference}
                      />
                    )}

                    {/* UTR Submission Box */}
                    <div className="rounded-xl border border-stone-200 bg-white p-4 text-xs space-y-2">
                      <span className="font-semibold text-stone-900 block">
                        Already Transferred via UPI? Submit UTR
                      </span>
                      {utrRecorded ? (
                        <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg flex items-center gap-2 font-medium">
                          <CheckCircle2 size={16} />
                          <span>
                            UTR {utr} submitted for verification. Owner will reconcile against bank records.
                          </span>
                        </div>
                      ) : (
                        <form onSubmit={handleUtrSubmit} className="flex gap-2">
                          <input
                            type="text"
                            value={utr}
                            onChange={(e) => setUtr(e.target.value)}
                            placeholder="Enter 12-digit UPI UTR / Bank Reference"
                            className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-xs font-mono"
                            required
                          />
                          <button
                            type="submit"
                            disabled={submittingUtr || !utr.trim()}
                            className="rounded-lg bg-stone-900 text-amber-100 px-4 py-2 text-xs font-semibold hover:bg-stone-800 disabled:opacity-50"
                          >
                            {submittingUtr ? "Submitting…" : "Record UTR"}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* Scenario B: Studio Collection & Outstanding Balance */}
                {data.fulfillmentType === "studio_collection" && !isFullyPaid && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-950 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-blue-900">
                      <MapPin size={16} className="text-blue-800" />
                      <span>Studio Counter Collection Payment</span>
                    </div>
                    <p className="text-blue-900 leading-relaxed">
                      You can pay your balance of <strong>₹{(remainingPaise / 100).toFixed(2)}</strong> in
                      Cash or UPI when collecting your completed product at Rajmoti Studio counter in Jetpur.
                    </p>
                    {data.upiUri && (
                      <div className="pt-2">
                        <span className="text-[11px] text-blue-800 block mb-2">
                          Want to pay online right now instead?
                        </span>
                        <UpiQrCode
                          upiUri={data.upiUri}
                          amountRupees={remainingPaise / 100}
                          payeeVpa={data.payeeVpa || "9429070317@apl"}
                          beneficiaryName={data.beneficiaryName || "PANKAJ LAXMICHAND SAKHIJA"}
                          orderRef={data.reference}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Scenario C: Fully Paid */}
                {isFullyPaid && (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 text-xs text-emerald-950 flex items-center gap-3">
                    <ShieldCheck size={24} className="text-emerald-700 shrink-0" />
                    <div>
                      <strong className="block text-sm font-semibold">Payment 100% Reconciled</strong>
                      <span>
                        Verified by Rajmoti Studio management. Your order is cleared for framing, packing, and dispatch.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items Preview (if available) */}
              {Array.isArray(data.items) && data.items.length > 0 && (
                <div className="border border-stone-200 bg-white p-5 rounded-2xl text-xs space-y-2 shadow-xs">
                  <h3 className="font-bold text-stone-900 text-sm">Ordered Items</h3>
                  <div className="divide-y divide-stone-100">
                    {data.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center text-stone-700">
                        <div>
                          <strong>{item.productId || `Item #${idx + 1}`}</strong>
                          <span className="text-stone-500 ml-2">Qty: {item.quantity || 1}</span>
                          {item.personalisation && (
                            <p className="text-[11px] text-stone-500 italic mt-0.5">
                              {item.personalisation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={copyTrackingLink}
                  className="ed-button outline text-xs flex items-center justify-center gap-2 py-2.5"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedLink ? "Link Copied!" : "Copy Tracking Link"}</span>
                </button>

                <a
                  href={whatsappLink(
                    `Namaste Rajmoti Studio! 🖼️ Inquiring about order status for Reference ${data.reference}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-button flex items-center justify-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858] text-xs py-2.5"
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp Studio Helpdesk</span>
                </a>
              </div>
            </div>
          )
        )}

        <div className="mt-8">
          <Link to="/" className="ed-text-button">
            <ArrowLeft size={16} /> Return home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
