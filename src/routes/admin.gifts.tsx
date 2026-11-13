import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Gift, Image as ImageIcon, MessageCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { whatsappLink } from "@/lib/site";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/gifts")({ component: GiftInbox });

type GiftOrder = {
  id: string; customer_name: string; phone: string; email: string | null; product_slug: string;
  product_name: string; requested_size: string; customer_message: string; photo_paths: string[];
  status: string; quoted_price: number | null; created_at: string;
};
const STATES = ["new", "confirmed", "in_production", "ready", "fulfilled", "cancelled"];

function GiftInbox() {
  const [orders, setOrders] = useState<GiftOrder[]>([]);
  const [selected, setSelected] = useState<GiftOrder | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setBusy(true);
    const { data, error: err } = await supabase.from("gift_orders" as any).select("*").order("created_at", { ascending: false }).limit(300);
    if (err) setError(err.message); else { setError(""); setOrders((data ?? []) as unknown as GiftOrder[]); }
    setBusy(false);
  }
  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    let active = true;
    setPhotoUrls([]);
    if (!selected?.photo_paths?.length) return;
    void Promise.all(selected.photo_paths.map(async (path) => {
      const { data } = await supabase.storage.from("gift-order-photos").createSignedUrl(path, 300);
      return data?.signedUrl || "";
    })).then((urls) => { if (active) setPhotoUrls(urls); });
    return () => { active = false; };
  }, [selected?.id]);

  async function changeStatus(status: string) {
    if (!selected) return;
    const { error: err } = await supabase.from("gift_orders" as any).update({ status }).eq("id", selected.id);
    if (err) return toast.error(err.message);
    setSelected({ ...selected, status });
    setOrders((list) => list.map((o) => o.id === selected.id ? { ...o, status } : o));
    toast.success("Gift status updated");
  }
  async function createJob() {
    if (!selected) return;
    const { error: err } = await supabase.from("studio_jobs" as any).insert({
      source_gift_order_id: selected.id,
      customer_name: selected.customer_name,
      phone: selected.phone,
      photo_type: "Photo gift",
      template_type: "gift",
      requested_size: selected.requested_size,
      notes: `Gift product: ${selected.product_name}\nCustomer instructions: ${selected.customer_message}\nGift request: ${selected.id}\nOriginal photos are in the private Gift inbox.`,
      assumptions: "Finish, quantity, delivery deadline and payment to confirm with customer.",
    });
    if (err) return toast.error(err.code === "23505" ? "This gift has already been converted into a production job." : err.message);
    toast.success("Gift added to production workflow");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4 items-end justify-between mb-8"><div><p className="eyebrow text-gold mb-3">Orders & personalisation</p><h1 className="text-4xl">Gift inbox</h1><p className="text-sm text-muted-foreground mt-2">Private requests and uploaded customer photographs.</p></div><button onClick={() => void refresh()} className="flex items-center gap-2 px-4 py-2 border border-onyx/20 text-xs" disabled={busy}><RefreshCw className="size-4" /> Refresh</button></div>
      {error && <p role="alert" className="border border-red-200 bg-red-50 p-4 text-sm mb-5">{error}</p>}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(290px,0.9fr)] gap-5">
        <div className="bg-white border border-onyx/10 divide-y divide-onyx/10">
          {orders.length === 0 && <div className="p-12 text-center text-muted-foreground text-sm"><Gift className="size-10 mx-auto mb-4" />{busy ? "Loading gift requests…" : "No gift requests found. New requests will appear here after the database and upload endpoint are deployed."}</div>}
          {orders.map((order) => <button type="button" key={order.id} onClick={() => setSelected(order)} className={`w-full p-5 text-left flex items-center gap-4 hover:bg-[#f9f6ef] transition-colors ${selected?.id === order.id ? "bg-[#f7f1e7] border-l-2 border-gold" : ""}`}>
            <div className="size-11 bg-[#f1e8d6] grid place-items-center"><Gift className="size-5 text-[#9c7c45]" /></div>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-3"><strong className="text-sm truncate">{order.customer_name}</strong><span className="text-[10px] border px-2 py-0.5 uppercase">{order.status.replace(/_/g, " ")}</span></div><p className="text-xs text-muted-foreground truncate mt-1">{order.product_name} · {order.requested_size} · {order.photo_paths?.length || 0} photos</p><p className="text-[10px] text-muted-foreground mt-2">{new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p></div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </button>)}
        </div>
        <aside className="bg-white border border-onyx/10 p-6 min-h-80">
          {!selected ? <div className="h-full grid place-items-center text-sm text-muted-foreground text-center"><span>Select a request to view details and its uploaded photographs.</span></div> : <div>
            <p className="eyebrow text-gold mb-2">Gift request</p><h2 className="text-2xl mb-5">{selected.customer_name}</h2>
            <dl className="grid grid-cols-[95px_1fr] gap-y-3 text-sm mb-6"><dt className="text-muted-foreground">Phone</dt><dd>{selected.phone}</dd><dt className="text-muted-foreground">Email</dt><dd className="break-all">{selected.email || "—"}</dd><dt className="text-muted-foreground">Product</dt><dd>{selected.product_name}</dd><dt className="text-muted-foreground">Size</dt><dd>{selected.requested_size}</dd><dt className="text-muted-foreground">Instructions</dt><dd className="whitespace-pre-wrap">{selected.customer_message || "Not supplied"}</dd></dl>
            <p className="text-xs font-semibold mb-3">Customer photo previews (private, five-minute links)</p><div className="grid grid-cols-3 gap-2 mb-5">{(selected.photo_paths || []).map((path, idx) => <div key={path} className="aspect-square bg-[#f3f0e9] grid place-items-center overflow-hidden">{photoUrls[idx] ? <a href={photoUrls[idx]} target="_blank" rel="noreferrer"><img src={photoUrls[idx]} alt={`Gift photo ${idx + 1}`} className="size-full object-cover" /></a> : <ImageIcon className="size-5 text-muted-foreground" />}</div>)}</div>
            <label htmlFor="gift-order-status" className="text-xs font-semibold block mb-2">Order status</label><select id="gift-order-status" value={selected.status} onChange={(e) => void changeStatus(e.target.value)} className="w-full bg-white border border-onyx/20 px-3 py-2 text-sm mb-4">{STATES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}</select>
            <div className="flex flex-col gap-2"><button onClick={() => void createJob()} className="bg-onyx text-cream text-xs px-4 py-3">Create production job</button><a href={whatsappLink(`Hello ${selected.customer_name}, this is Rajmoti Studio regarding your ${selected.product_name} request.`, selected.phone)} target="_blank" rel="noreferrer" className="border border-onyx/20 text-xs text-center py-3 flex items-center gap-2 justify-center"><MessageCircle className="size-4" /> Message customer</a><Link to="/admin/workflow" className="text-xs text-center underline py-2">Open studio workflow</Link></div>
          </div>}
        </aside>
      </div>
    </div>
  );
}
