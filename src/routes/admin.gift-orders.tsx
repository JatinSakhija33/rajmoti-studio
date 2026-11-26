import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { liveBackend } from "@/lib/backend-mode";
import { enableGiftRequests } from "@/features/catalogue/gift-network";

export const Route = createFileRoute("/admin/gift-orders")({
  component: GiftOrders,
  head: () => ({ meta: [{ title: "Gift orders & payments — Rajmoti Studio" }] }),
});

type Order = {
  id: string;
  public_ref: string;
  customer_name: string;
  phone: string;
  status: string;
  payment_status: string;
  total_amount_paise: number;
  verified_paid_paise: number;
  photo_count: number;
  items_json: string;
  review_json: string;
  payment_reference?: string;
  notes: string;
  fulfillment_type: string;
};
type Payment = { id: string; amount_paise: number; status: string; customer_utr: string; method: string };
type Photo = { id: string; design_id: string; slot_index: number };
type Item = { productName?: string; size?: string; quantity?: number; design?: { settings?: Record<string, unknown> } };
type OrderFilter = "all" | "payment" | "production" | "ready" | "closed";

const stages = ["received", "editing", "review", "printing", "framing", "ready", "delivered", "cancelled"];
const checks = [
  ["original_preserved", "Original photos kept"],
  ["identity_preserved", "Identity checked"],
  ["print_spec_verified", "Print size and finish checked"],
  ["customer_details_verified", "Customer details checked"],
];
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const money = (paise: number) => currency.format(paise / 100);
const formatLabel = (value: string) => (value || "Pending").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const isClosed = (order: Order) => order.status === "delivered" || order.status === "cancelled";

function parseStored<T>(text: string, fallback: T): T {
  try { return JSON.parse(text) ?? fallback; } catch { return fallback; }
}

async function ownerHeaders(initial?: HeadersInit) {
  const headers = new Headers(initial);
  if (liveBackend) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  }
  return headers;
}

async function ownerFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  enableGiftRequests();
  const response = await fetch(path, { ...init, headers: await ownerHeaders(init.headers) });
  const data = await response.json().catch(() => ({ error: "The gift-order service is unavailable" }));
  if (!response.ok || data.error) throw new Error(data.error || "The request could not be completed");
  return data;
}

function GiftOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [search, setSearch] = useState("");
  const [receiptMethod, setReceiptMethod] = useState("upi");
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [checked, setChecked] = useState(false);
  const [status, setStatus] = useState("received");
  const [review, setReview] = useState<Record<string, boolean>>({});
  const receiptIds = useRef(new Map<string, string>());

  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);
  useEffect(() => { void load(); }, []);

  async function refreshList() {
    const data = await ownerFetch<{ orders: Order[] }>("/api/owner/orders");
    setOrders(data.orders ?? []);
  }

  async function load() {
    setBusy(true);
    setError("");
    try { await refreshList(); }
    catch (error) { setError(error instanceof Error ? error.message : "Orders could not load"); }
    finally { setBusy(false); setInitialLoad(false); }
  }

  async function openOrder(order: Order) {
    setPhotoUrl("");
    setChecked(false);
    const [detail, ledger] = await Promise.all([
      ownerFetch<{ order: Order; photos: Photo[] }>(`/api/owner/orders/${order.id}`),
      ownerFetch<{ payments: Payment[] }>(`/api/owner/orders/${order.id}/payments`),
    ]);
    setSelected(detail.order);
    setPayments(ledger.payments);
    setPhotos(detail.photos);
    setAmount((Math.max(0, detail.order.total_amount_paise - detail.order.verified_paid_paise) / 100).toFixed(2));
    setUtr(detail.order.payment_reference || "");
    setStatus(detail.order.status);
    setReview(parseStored(detail.order.review_json, {}));
  }

  async function choose(order: Order) {
    setBusy(true);
    setError("");
    try { await openOrder(order); }
    catch (error) { setSelected(null); setError(error instanceof Error ? error.message : "Order details could not load"); }
    finally { setBusy(false); }
  }

  async function viewOriginal(photoId: string) {
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/owner/orders/${selected.id}/photos/${photoId}`, { headers: await ownerHeaders() });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not open the private original");
      }
      setPhotoUrl(URL.createObjectURL(await response.blob()));
    } catch (error) {
      setError(error instanceof Error ? error.message : "The original could not load");
    } finally { setBusy(false); }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!selected || !checked || busy) return;
    const order = selected;
    const attempt = payments.find((payment) => payment.status === "pending_verification");
    const paymentId = receiptMethod === "upi" && attempt ? attempt.id : receiptIds.current.get(order.id) ?? crypto.randomUUID();
    receiptIds.current.set(order.id, paymentId);
    setBusy(true);
    setError("");
    try {
      await ownerFetch(`/api/owner/orders/${order.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: receiptMethod === "upi" && attempt ? "verify_upi" : "record_counter_payment",
          method: receiptMethod, paymentId, amountPaise: Math.round(Number(amount) * 100), utr, bankChecked: checked,
        }),
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Payment was not verified");
      setBusy(false);
      return;
    }
    receiptIds.current.delete(order.id);
    setChecked(false);
    toast.success("Verified receipt recorded");
    try { await openOrder(order); await refreshList(); }
    catch { setError("The receipt was saved. Refresh the order to see the updated balance."); }
    finally { setBusy(false); }
  }

  async function updateStage(event: FormEvent) {
    event.preventDefault();
    if (!selected || busy) return;
    const order = selected;
    setBusy(true);
    setError("");
    try {
      await ownerFetch(`/api/owner/orders/${order.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, review }),
      });
      toast.success("Production status saved");
      await openOrder(order);
      await refreshList();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Production status could not be refreshed");
    } finally { setBusy(false); }
  }

  const filtered = orders.filter((order) => {
    const match = `${order.customer_name} ${order.public_ref} ${order.phone}`.toLowerCase();
    if (!match.includes(search.trim().toLowerCase())) return false;
    if (filter === "payment") return !isClosed(order) && order.verified_paid_paise < order.total_amount_paise;
    if (filter === "production") return ["received", "editing", "review", "printing", "framing"].includes(order.status);
    if (filter === "ready") return order.status === "ready";
    if (filter === "closed") return isClosed(order);
    return true;
  });

  const items = selected ? parseStored<Item[]>(selected.items_json, []) : [];
  const balance = selected ? Math.max(0, selected.total_amount_paise - selected.verified_paid_paise) : 0;

  return <div className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-display text-4xl">Gift orders &amp; payments</h1>
        <p className="mt-2 text-sm text-muted-foreground">Track production and record receipts you’ve verified.</p></div>
      <div className="flex flex-wrap gap-2"><Link to="/admin/gifts" className="studio-secondary">Gift requests</Link>
        <button type="button" className="studio-secondary" disabled={busy} onClick={() => void load()}><RefreshCw className="size-4" /> Refresh</button></div>
    </header>
    {error && <div role="alert" className="studio-panel border-destructive/30 text-sm">
      <p className="font-medium text-destructive">{error}</p>
      {error.includes("database is not configured") && <p className="mt-2">Cloudflare needs the existing order database connected. <Link to="/admin/settings" search={{ tab: "connections" }} className="underline">Check studio connections</Link>.</p>}
    </div>}
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(17rem,1fr)_minmax(0,1.5fr)]">
      <section className="studio-panel">
        <div className="flex flex-wrap gap-2">
          <input className="studio-field flex-1" type="search" placeholder="Find an order" aria-label="Find by name, phone or reference" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className="studio-field" aria-label="Order status filter" value={filter} onChange={(event) => setFilter(event.target.value as OrderFilter)}>
            <option value="all">All orders</option><option value="payment">Payment due</option>
            <option value="production">In production</option><option value="ready">Ready</option><option value="closed">Closed</option>
          </select>
        </div>
        {initialLoad && <p className="py-4 text-sm text-muted-foreground" role="status">Loading orders…</p>}
        {!initialLoad && !error && !filtered.length && <p className="py-4 text-sm text-muted-foreground">{orders.length ? "No orders match." : "No gift orders yet."}</p>}
        <ul className="mt-2 divide-y divide-onyx/10">
          {filtered.map((order) => <li key={order.id}>
            <button type="button" disabled={busy} aria-pressed={selected?.id === order.id} className="w-full rounded-lg p-3 text-left hover:bg-onyx/5 aria-pressed:bg-[#e5ece3]" onClick={() => void choose(order)}>
              <strong className="block truncate text-sm">{order.customer_name} · {order.public_ref}</strong>
              <span className="block text-xs text-muted-foreground">{formatLabel(order.status)} · {formatLabel(order.payment_status)}</span>
              <span className="text-xs">{money(order.total_amount_paise)} · {order.photo_count} photos</span>
            </button>
          </li>)}
        </ul>
      </section>

      {selected && <section className="studio-panel space-y-5">
        <div><h2 className="text-xl font-semibold">{selected.public_ref}</h2><p className="text-sm text-muted-foreground">{selected.customer_name} · {selected.phone}</p>
          <p className="mt-2 text-sm">{formatLabel(selected.fulfillment_type)} · {formatLabel(selected.payment_status)}</p>
          <p className="mt-1 text-sm font-medium">{money(selected.total_amount_paise)} total · {money(selected.verified_paid_paise)} verified · {money(balance)} due</p>
        </div>
        <details>
          <summary className="cursor-pointer text-sm font-semibold">Products and design notes</summary>
          {Array.isArray(items) && items.map((item, index) => <article key={index} className="mt-2 rounded-lg border p-3 text-sm">
            <strong>{item.productName || "Gift product"} · {item.size || "Size to confirm"} · Qty {item.quantity || 1}</strong>
            {Object.entries(item.design?.settings ?? {}).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)).map(([key, value]) =>
              <p key={key} className="text-xs text-muted-foreground">{formatLabel(key)} · {String(value)}</p>)}
          </article>)}
          {selected.notes && <p className="mt-2 whitespace-pre-wrap text-sm">{selected.notes}</p>}
        </details>
        {photos.length > 0 && <div className="flex flex-wrap gap-2">{photos.map((photo, index) => <button key={photo.id} type="button" className="studio-secondary" disabled={busy} onClick={() => void viewOriginal(photo.id)}>View private photo {index + 1}</button>)}</div>}
        {photoUrl && <figure><img src={photoUrl} alt="Private customer original" className="max-h-[26rem] max-w-full object-contain" /><a href={photoUrl} className="studio-secondary mt-2" download="customer-original">Download original</a></figure>}
        {balance > 0 && <form onSubmit={verify} className="grid gap-3 border-t pt-4">
          <h3 className="font-semibold">Record a verified receipt</h3>
          <label className="grid gap-1 text-sm">Receipt method<select className="studio-field" value={receiptMethod} onChange={(event) => { setReceiptMethod(event.target.value); setChecked(false); }}>
            <option value="upi">Bank-verified UPI</option><option value="cash">Cash received at the studio</option>
          </select></label>
          <label className="grid gap-1 text-sm">Amount received (₹)<input className="studio-field" required type="number" min="0.01" max={balance / 100} step="0.01" value={amount} onChange={(event) => { setAmount(event.target.value); setChecked(false); }} /></label>
          {receiptMethod === "upi" && <label className="grid gap-1 text-sm">Bank-verified UTR<input className="studio-field" required minLength={6} maxLength={40} value={utr} onChange={(event) => { setUtr(event.target.value); setChecked(false); }} /></label>}
          <label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" required checked={checked} onChange={(event) => setChecked(event.target.checked)} />{receiptMethod === "upi" ? "I checked the beneficiary, amount and UTR in the bank statement." : "I received this cash at the studio."}</label>
          <button type="submit" className="studio-primary justify-self-start" disabled={busy || !checked}>Record receipt</button>
        </form>}
        <form onSubmit={updateStage} className="grid gap-3 border-t pt-4">
          <h3 className="font-semibold">Production and fulfilment</h3>
          <label className="grid gap-1 text-sm">Stage<select className="studio-field" value={status} onChange={(event) => setStatus(event.target.value)}>
            {stages.map((stage) => <option key={stage} value={stage}>{formatLabel(stage)}</option>)}
          </select></label>
          {checks.map(([key, label]) => <label className="flex items-center gap-2 text-sm" key={key}><input type="checkbox" checked={Boolean(review[key])} onChange={(event) => setReview({ ...review, [key]: event.target.checked })} /> {label}</label>)}
          <button type="submit" className="studio-secondary justify-self-start" disabled={busy}>Save production status</button>
        </form>
      </section>}
    </div>
  </div>;
}
