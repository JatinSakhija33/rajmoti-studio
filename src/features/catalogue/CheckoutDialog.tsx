import { useState, useMemo, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Package,
  ShieldCheck,
  Truck,
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
import { useProducts, type QuoteLine } from "./store";
import {
  calculateVariantPriceInr,
  STANDARD_DELIVERY_CHARGE_INR,
} from "@/lib/pricing";
import { UpiQrCode } from "@/components/UpiQrCode";
import { toast } from "sonner";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: QuoteLine[];
  onClearQuote: () => void;
  onRemoveLine: (index: number) => void;
}

interface ConfirmedOrder {
  id: string;
  reference: string;
  publicRef: string;
  totalAmountPaise: number;
  deliveryChargePaise: number;
  upiUri: string | null;
  payeeVpa: string;
  beneficiaryName: string;
  trackingToken: string;
  fulfillment: "home_delivery" | "studio_collection";
  paymentChoice: "pay_online" | "pay_at_studio";
}

export function CheckoutDialog({
  open,
  onOpenChange,
  quote,
  onClearQuote,
  onRemoveLine,
}: CheckoutDialogProps) {
  const [products] = useProducts();

  // Fulfilment & payment mode
  const [fulfillment, setFulfillment] = useState<"home_delivery" | "studio_collection">("home_delivery");
  const [paymentChoice, setPaymentChoice] = useState<"pay_online" | "pay_at_studio">("pay_online");

  // Contact & delivery details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("Jetpur");
  const [pincode, setPincode] = useState("360370");
  const [state, setState] = useState("Gujarat");
  const [notes, setNotes] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null);

  // UTR submission on confirmation screen
  const [utr, setUtr] = useState("");
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [utrRecorded, setUtrRecorded] = useState(false);

  // Calculations
  const lineDetails = useMemo(() => {
    return quote.map((line) => {
      const p = products.find((prod) => prod.id === line.productId);
      const v = p?.variants.find((variant) => variant.id === line.variantId);
      const unitPrice = calculateVariantPriceInr(
        line.productId,
        v?.size || "",
        v?.finish || "",
      );
      const lineTotal = unitPrice * line.quantity;
      return {
        line,
        product: p,
        variant: v,
        unitPrice,
        lineTotal,
      };
    });
  }, [quote, products]);

  const subtotal = useMemo(() => {
    return lineDetails.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [lineDetails]);

  const deliveryCharge = fulfillment === "home_delivery" ? STANDARD_DELIVERY_CHARGE_INR : 0;
  const grandTotal = subtotal + deliveryCharge;

  // Reset when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      if (confirmed) {
        onClearQuote();
        setConfirmed(null);
      }
      setError(null);
    }
    onOpenChange(isOpen);
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (fulfillment === "home_delivery") {
      if (!line1.trim() || !city.trim() || !pincode.trim() || !state.trim()) {
        setError("Please enter complete delivery address details for Home Delivery.");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    const clientRequestId = crypto.randomUUID();
    const payload = {
      clientRequestId,
      name: name.trim(),
      phone: cleanPhone,
      kind: "gift_order",
      quote: quote.map((q) => ({
        productId: q.productId,
        variantId: q.variantId,
        quantity: q.quantity,
        personalisation: q.personalisation,
        packaging: q.packaging,
        orderType: q.orderType,
      })),
      notes: notes.trim(),
      fulfillmentType: fulfillment,
      paymentChoice: fulfillment === "home_delivery" ? "pay_online" : paymentChoice,
      deliveryAddress:
        fulfillment === "home_delivery"
          ? {
              line1: line1.trim(),
              line2: line2.trim(),
              city: city.trim(),
              state: state.trim(),
              pincode: pincode.trim(),
            }
          : undefined,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to place order. Please try again.");
      }

      setConfirmed({
        id: data.id,
        reference: data.reference,
        publicRef: data.publicRef || data.reference,
        totalAmountPaise: data.totalAmountPaise,
        deliveryChargePaise: data.deliveryChargePaise,
        upiUri: data.upiUri,
        payeeVpa: data.payeeVpa || "9429070317@apl",
        beneficiaryName: data.beneficiaryName || "PANKAJ LAXMICHAND SAKHIJA",
        trackingToken: data.trackingToken,
        fulfillment,
        paymentChoice: fulfillment === "home_delivery" ? "pay_online" : paymentChoice,
      });

      toast.success("Order registered successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error placing order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUtrSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!confirmed || !utr.trim()) return;
    setSubmittingUtr(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(confirmed.id)}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utr: utr.trim(),
          amount: (confirmed.totalAmountPaise / 100).toFixed(2),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not record UTR");
      setUtrRecorded(true);
      toast.success("Transaction reference recorded! Our desk will reconcile with bank statement.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record UTR");
    } finally {
      setSubmittingUtr(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="ed-modal max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {confirmed ? "Order Confirmed · Rajmoti Studio" : "Checkout & Order Confirmation"}
          </DialogTitle>
          <DialogDescription>
            {confirmed
              ? `Your order reference is ${confirmed.publicRef}.`
              : "Direct studio craftsmanship and verified fulfilment."}
          </DialogDescription>
        </DialogHeader>

        {confirmed ? (
          /* CONFIRMATION SCREEN */
          <div className="space-y-6 pt-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
              <CheckCircle2 size={40} className="mx-auto text-emerald-600 mb-2" />
              <h3 className="font-display text-2xl font-bold text-stone-900">
                Order Received!
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Order Reference:{" "}
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {confirmed.publicRef}
                </span>
              </p>
              <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-emerald-300 text-emerald-800">
                {confirmed.fulfillment === "home_delivery" ? (
                  <>
                    <Truck size={14} /> Home Delivery · Full Prepayment Required
                  </>
                ) : confirmed.paymentChoice === "pay_at_studio" ? (
                  <>
                    <MapPin size={14} /> Studio Collection · Pay ₹{(confirmed.totalAmountPaise / 100).toFixed(2)} at Studio
                  </>
                ) : (
                  <>
                    <MapPin size={14} /> Studio Collection · Paid via UPI Online
                  </>
                )}
              </div>
            </div>

            {/* If Home Delivery or Pay Online: Render UPI QR and UTR input */}
            {(confirmed.fulfillment === "home_delivery" || confirmed.paymentChoice === "pay_online") && (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Authoritative Studio Payment Directives</strong>
                    <span>
                      Scan the official UPI QR code below to pay ₹{(confirmed.totalAmountPaise / 100).toFixed(2)}.
                      Once transferred, submit your 12-digit UTR below for rapid bank reconciliation.
                    </span>
                  </div>
                </div>

                {confirmed.upiUri && (
                  <UpiQrCode
                    upiUri={confirmed.upiUri}
                    amountRupees={confirmed.totalAmountPaise / 100}
                    payeeVpa={confirmed.payeeVpa}
                    beneficiaryName={confirmed.beneficiaryName}
                    orderRef={confirmed.publicRef}
                  />
                )}

                {/* Customer UTR Form */}
                <div className="rounded-xl border border-stone-200 bg-white p-4 text-xs space-y-2">
                  <span className="font-semibold text-stone-900 block">
                    Submit Bank UTR / UPI Reference Number
                  </span>
                  {utrRecorded ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold p-2 bg-emerald-50 rounded-lg">
                      <CheckCircle2 size={16} />
                      <span>UTR {utr} submitted for owner bank verification.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleUtrSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        placeholder="12-digit UPI UTR or IMPS Ref"
                        className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-xs font-mono"
                        required
                      />
                      <button
                        type="submit"
                        disabled={submittingUtr || !utr.trim()}
                        className="rounded-lg bg-stone-900 text-amber-100 px-4 py-2 text-xs font-semibold hover:bg-stone-800 disabled:opacity-50"
                      >
                        {submittingUtr ? "Recording…" : "Submit UTR"}
                      </button>
                    </form>
                  )}
                  <p className="text-[11px] text-stone-400">
                    Find the 12-digit UTR in your Google Pay, PhonePe, or Paytm payment receipt details.
                  </p>
                </div>
              </div>
            )}

            {/* If Studio Collection & Pay at Studio */}
            {confirmed.fulfillment === "studio_collection" && confirmed.paymentChoice === "pay_at_studio" && (
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-900">
                  <MapPin size={16} className="text-amber-800" />
                  <span>Collect in Person at Rajmoti Studio</span>
                </div>
                <p className="text-stone-600">
                  Your order has been queued for production. You can settle the payable balance of{" "}
                  <strong>₹{(confirmed.totalAmountPaise / 100).toFixed(2)}</strong> in Cash or UPI at our studio counter upon collection in Jetpur.
                </p>
                <p className="text-stone-500 font-mono text-[11px]">
                  Studio Address: Rajmoti Studio, Near Rajmoti Cinema, Jetpur, Gujarat 360370.
                </p>
              </div>
            )}

            {/* Links & Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/track/$id"
                params={{ id: confirmed.id }}
                search={{ token: confirmed.trackingToken }}
                className="flex-1 ed-button flex items-center justify-center gap-2 bg-stone-900 text-amber-100 hover:bg-stone-800 text-xs py-2.5"
                onClick={() => handleOpenChange(false)}
              >
                <span>Track Order Live</span>
                <ExternalLink size={14} />
              </Link>

              <a
                href={whatsappLink(
                  `Namaste Rajmoti Studio! 🛍️ I placed order ${confirmed.publicRef} for ₹${(
                    confirmed.totalAmountPaise / 100
                  ).toFixed(2)} (${
                    confirmed.fulfillment === "home_delivery" ? "Home Delivery" : "Studio Collection"
                  }). Please confirm receipt.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 ed-button flex items-center justify-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858] text-xs py-2.5"
              >
                <MessageCircle size={15} />
                <span>WhatsApp Confirmation</span>
              </a>
            </div>
          </div>
        ) : (
          /* CHECKOUT FORM SCREEN */
          <div className="space-y-6 pt-2">
            {/* Line items list */}
            {quote.length === 0 ? (
              <div className="ed-empty py-8">
                <Package size={32} />
                <p>Your quotation list is empty. Add a product from the catalogue.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-stone-200 bg-stone-50/50 divide-y divide-stone-200/70">
                  {lineDetails.map(({ line, product: p, variant: v, unitPrice, lineTotal }, i) => (
                    <div key={i} className="p-3 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <strong className="text-stone-900 block font-semibold text-sm">
                          {p?.name || line.productId}
                        </strong>
                        <div className="text-stone-600">
                          {v?.size || "Standard"} · Qty: {line.quantity} · {line.personalisation}
                        </div>
                        <div className="text-stone-500 font-mono text-[11px]">
                          ₹{unitPrice} each × {line.quantity} = ₹{lineTotal}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveLine(i)}
                        className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                        title="Remove item"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Delivery Breakdown */}
                <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Items Subtotal</span>
                    <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>
                      {fulfillment === "home_delivery" ? "Home Delivery Charge" : "Studio Collection"}
                    </span>
                    <span className="font-mono">
                      {fulfillment === "home_delivery" ? `₹${deliveryCharge.toFixed(2)}` : "FREE (₹0.00)"}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-900 font-bold text-sm pt-2 border-t border-stone-100">
                    <span>Final Payable Total</span>
                    <span className="font-mono text-base text-amber-900">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-5">
                  {/* Step 1: Fulfilment Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                      1. Choose Fulfilment Method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setFulfillment("home_delivery")}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          fulfillment === "home_delivery"
                            ? "border-amber-800 bg-amber-50/50 shadow-xs"
                            : "border-stone-200 bg-white hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                            <Truck size={15} className="text-amber-800" /> Home Delivery
                          </span>
                          <span className="text-[11px] font-mono text-stone-600">+₹100</span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          Secure doorstep delivery across Gujarat & India. 100% online prepayment required.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFulfillment("studio_collection")}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          fulfillment === "studio_collection"
                            ? "border-amber-800 bg-amber-50/50 shadow-xs"
                            : "border-stone-200 bg-white hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                            <MapPin size={15} className="text-amber-800" /> Collect from Studio
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700">FREE</span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          Pickup in person at Rajmoti Studio, Jetpur. Pay online or at counter.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Payment Choice (If Studio Collection) */}
                  {fulfillment === "studio_collection" && (
                    <div className="space-y-2 p-3.5 rounded-xl border border-stone-200 bg-stone-50/60">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                        2. Studio Collection Payment Option
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <label className="flex items-start gap-2 p-2.5 rounded-lg border bg-white cursor-pointer hover:border-stone-300">
                          <input
                            type="radio"
                            name="paymentChoice"
                            value="pay_at_studio"
                            checked={paymentChoice === "pay_at_studio"}
                            onChange={() => setPaymentChoice("pay_at_studio")}
                            className="mt-0.5 text-amber-800"
                          />
                          <div>
                            <strong className="block text-stone-900">Pay at Studio</strong>
                            <span className="text-stone-500 text-[11px]">
                              Pay cash or UPI when collecting completed items. No online payment now.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 p-2.5 rounded-lg border bg-white cursor-pointer hover:border-stone-300">
                          <input
                            type="radio"
                            name="paymentChoice"
                            value="pay_online"
                            checked={paymentChoice === "pay_online"}
                            onChange={() => setPaymentChoice("pay_online")}
                            className="mt-0.5 text-amber-800"
                          />
                          <div>
                            <strong className="block text-stone-900">Pay Online Now</strong>
                            <span className="text-stone-500 text-[11px]">
                              Prepay via UPI QR for immediate processing.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Prepayment Policy Alert for Home Delivery */}
                  {fulfillment === "home_delivery" && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3 text-xs text-amber-950 flex items-start gap-2">
                      <ShieldCheck size={17} className="text-amber-800 shrink-0 mt-0.5" />
                      <div>
                        <strong>Compulsory Prepayment Policy:</strong> Home Delivery requires 100% verified
                        prepayment via UPI before dispatch. Cash on Delivery (COD) is strictly unavailable for
                        personalised photography works.
                      </div>
                    </div>
                  )}

                  {/* Step 3: Customer Details */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                      {fulfillment === "home_delivery" ? "2. Delivery & Contact Details" : "3. Customer Contact Details"}
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <label className="space-y-1 block">
                        <span className="text-stone-700 font-medium">Customer Full Name *</span>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rajesh Sakhija"
                          className="w-full border border-stone-300 rounded-lg p-2 bg-white"
                        />
                      </label>

                      <label className="space-y-1 block">
                        <span className="text-stone-700 font-medium">WhatsApp / Mobile Number *</span>
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

                    {/* Delivery Address fields if Home Delivery */}
                    {fulfillment === "home_delivery" && (
                      <div className="space-y-2.5 pt-1">
                        <label className="space-y-1 block text-xs">
                          <span className="text-stone-700 font-medium">Address Line 1 (House/Flat, Street) *</span>
                          <input
                            type="text"
                            required
                            value={line1}
                            onChange={(e) => setLine1(e.target.value)}
                            placeholder="e.g. 14, Shanti Nagar, Opp. Rajmoti Cinema"
                            className="w-full border border-stone-300 rounded-lg p-2 bg-white text-xs"
                          />
                        </label>

                        <label className="space-y-1 block text-xs">
                          <span className="text-stone-700 font-medium">Address Line 2 (Area, Landmark)</span>
                          <input
                            type="text"
                            value={line2}
                            onChange={(e) => setLine2(e.target.value)}
                            placeholder="e.g. Station Road"
                            className="w-full border border-stone-300 rounded-lg p-2 bg-white text-xs"
                          />
                        </label>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <label className="space-y-1 block">
                            <span className="text-stone-700 font-medium">City / Town *</span>
                            <input
                              type="text"
                              required
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className="w-full border border-stone-300 rounded-lg p-2 bg-white"
                            />
                          </label>

                          <label className="space-y-1 block">
                            <span className="text-stone-700 font-medium">Pincode *</span>
                            <input
                              type="text"
                              required
                              value={pincode}
                              onChange={(e) => setPincode(e.target.value)}
                              className="w-full border border-stone-300 rounded-lg p-2 bg-white font-mono"
                            />
                          </label>

                          <label className="space-y-1 block">
                            <span className="text-stone-700 font-medium">State *</span>
                            <input
                              type="text"
                              required
                              value={state}
                              onChange={(e) => setState(e.target.value)}
                              className="w-full border border-stone-300 rounded-lg p-2 bg-white"
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    <label className="space-y-1 block text-xs">
                      <span className="text-stone-700 font-medium">Order Notes / Custom Instructions</span>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any special packaging or delivery notes…"
                        className="w-full border border-stone-300 rounded-lg p-2 bg-white text-xs"
                      />
                    </label>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                      {error}
                    </div>
                  )}

                  {/* Submission Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-stone-900 text-amber-100 font-semibold text-sm hover:bg-stone-800 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      "Registering Order…"
                    ) : (
                      <>
                        <span>Place Order (Total: ₹{grandTotal.toFixed(2)})</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
