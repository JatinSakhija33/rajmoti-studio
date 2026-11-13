import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Heart, Package, Upload, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useStyles, useQuote, useProducts } from "@/features/catalogue/store";

export const Route = createFileRoute("/contact")({
  validateSearch: (s: Record<string, unknown>) => ({
    package: typeof s.package === "string" ? s.package : undefined,
    session: typeof s.session === "string" ? s.session : undefined,
  }),
  head: () => ({ meta: [{ title: "Plan your session or photo gift — Rajmoti Studio" }] }),
  component: Contact,
});
type UploadGrant = { id: string; reference: string; uploadToken: string };
type TurnstileWidget = { render: (el: HTMLElement, options: Record<string, unknown>) => string; reset: (id?: string) => void; remove: (id: string) => void };
function Contact() {
  const search = Route.useSearch();
  const [styles] = useStyles();
  const [quote] = useQuote();
  const [products] = useProducts();
  const [type, setType] = useState(quote.length ? "Photo gifting" : search.session || "Baby");
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");
  const [grant, setGrant] = useState<UploadGrant | null>(null);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploaded, setUploaded] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const requestId = useRef(crypto.randomUUID());
  const turnstileKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const isProduction = import.meta.env.PROD;

  useEffect(() => {
    if (!isProduction || !turnstileKey || !widgetRef.current) return;
    let cancelled = false;
    const scriptId = "rajmoti-turnstile";
    const render = () => {
      const ts = (window as Window & { turnstile?: TurnstileWidget }).turnstile;
      if (!cancelled && widgetRef.current && ts && !widgetId.current) {
        widgetId.current = ts.render(widgetRef.current, {
          sitekey: turnstileKey,
          callback: (t: string) => setTurnstileToken(t),
          "expired-callback": () => setTurnstileToken(""),
          "error-callback": () => setTurnstileToken(""),
          theme: "light",
        });
      }
    };
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", render);
    render();
    return () => {
      cancelled = true;
      script?.removeEventListener("load", render);
      const ts = (window as Window & { turnstile?: TurnstileWidget }).turnstile;
      if (ts && widgetId.current) ts.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [isProduction, turnstileKey]);

  const today = new Date().toLocaleDateString("en-CA");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!turnstileKey || !turnstileToken) {
      setError("Secure ordering is being set up. Please contact the studio using WhatsApp for now.");
      return;
    }
    if (!/^(?:91)?[6-9]\d{9}$/.test(phone.replace(/\D/g, ""))) {
      setError("Enter a valid 10-digit Indian mobile number."); return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRequestId: requestId.current, name, phone, type, date, age,
          package: search.package || "", notes,
          styles: styles.map((s) => ({ id: s.id, title: s.title })),
          quote, turnstileToken,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Could not save your request");
      setGrant(result);
      setTurnstileToken("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed. Please retry.");
      (window as Window & { turnstile?: TurnstileWidget }).turnstile?.reset(widgetId.current || undefined);
      setTurnstileToken("");
    } finally { setBusy(false); }
  }

  async function sendPhotos(files: FileList | null) {
    if (!grant || !files?.length || uploaded >= 5) return;
    setUploading(true); setUploadError("");
    try {
      const selected = Array.from(files);
      if (selected.length + uploaded > 5) throw Error("Maximum five photos per request.");
      for (const file of selected) {
        if (file.size > 10_000_000 || !["image/jpeg", "image/png", "image/webp"].includes(file.type))
          throw Error("Please upload JPG, PNG or WebP files smaller than 10 MB each.");
        const form = new FormData();
        form.append("photo", file);
        const response = await fetch("/api/orders/" + encodeURIComponent(grant.id) + "/photos", {
          method: "POST", headers: { "X-Rajmoti-Upload-Token": grant.uploadToken }, body: form,
        });
        const result = await response.json();
        if (!response.ok) throw Error(result.error || "Upload failed");
        setUploaded((n) => n + 1);
      }
    } catch (e) { setUploadError(e instanceof Error ? e.message : "Upload failed"); }
    finally { setUploading(false); }
  }

  return <div className="editorial">
    <SiteNav />
    <main className="ed-wrap enquiry-page">
      {grant ? <section className="enquiry-success">
        <CheckCircle2 size={42}/>
        <p className="ed-kicker">Request received securely</p>
        <h1>Thank you. <em>We'll be in touch.</em></h1>
        <p>Reference <strong>{grant.reference}</strong>. Your request is not a confirmed booking or payment; we will discuss details with you.</p>
        <div className="mt-8 border border-stone-200 bg-white p-6">
          <h2 className="text-2xl font-display mb-2">Add photos for your order</h2>
          <p className="text-sm mb-4">Optional. Up to 5 originals, 10 MB each. For the best print quality, upload the original photograph rather than a WhatsApp-compressed copy.</p>
          <label className="ed-button cursor-pointer inline-flex items-center gap-2">
            <Upload size={17}/>{uploading ? "Uploading…" : "Choose photographs"}
            <input aria-label="Upload order photographs" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={uploading || uploaded>=5}
              onChange={(e) => { void sendPhotos(e.target.files); e.currentTarget.value = ""; }}/>
          </label>
          <p className="text-sm mt-3">{uploaded} of 5 uploaded</p>
          {uploadError && <p role="alert" className="form-error">{uploadError}</p>}
          <p className="ed-footnote">Customer files are private and kept only while needed for production and the agreed retention period.</p>
        </div>
        <div className="ed-actions"><Link to="/" className="ed-text-button">Back to home</Link></div>
      </section> : <>
        <div className="enquiry-heading">
          <p className="ed-kicker">An experience made personal</p>
          <h1>Your story. <em>Beautifully preserved.</em></h1>
          <p className="ed-copy">Tell us about your photography session or personalised gift. A real person at Rajmoti Studio will confirm the details.</p>
        </div>
        <div className="enquiry-layout">
          <form className="enquiry-form" onSubmit={submit}>
            <label>What are you planning?
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {["Baby","Maternity","Family","Wedding","Photo gifting","Corporate / bulk gifts","Passport / ID","Restoration","Memorial portrait","Other"].map(t=><option key={t}>{t}</option>)}
              </select>
            </label>
            {type==="Baby" && <label>Baby's age
              <select value={age} onChange={(e) => setAge(e.target.value)}>
                <option value="">Please select</option>
                {["Newborn (0–2 months)","3–6 months","7–12 months","1–3 years","Older / not sure"].map(x=><option key={x}>{x}</option>)}
              </select>
            </label>}
            <label>Preferred date (optional)
              <input type="date" min={today} value={date} onChange={e=>setDate(e.target.value)}/>
            </label>
            <label>Your name
              <input required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Full name"/>
            </label>
            <label>WhatsApp number
              <input type="tel" required inputMode="tel" autoComplete="tel" maxLength={16} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91"/>
            </label>
            <label>Details (optional)
              <textarea rows={3} maxLength={1000} value={notes} onChange={e=>setNotes(e.target.value)}
                placeholder="Print size, occasion, quantity, special instructions…" />
            </label>
            <label className="text-sm flex gap-2 items-start"><input type="checkbox" required className="mt-1"/> I consent to Rajmoti Studio using these details and any uploaded photos only to respond to and fulfil my request.</label>
            {turnstileKey && <div ref={widgetRef}/>}
            {error && <p className="form-error" role="alert">{error}</p>}
            {!turnstileKey && <p className="ed-notice">Online submissions will open when secure verification is configured. For now, please use the studio's WhatsApp contact.</p>}
            <button type="submit" className="ed-button" disabled={busy || !turnstileKey || !turnstileToken}>
              {busy ? "Saving request…" : "Send enquiry"} <ArrowRight size={16}/>
            </button>
            <p className="ed-footnote"><ShieldCheck size={14} className="inline"/> Your information is private. Prices, dates and payments are confirmed personally.</p>
          </form>
          <aside className="enquiry-summary">
            <h2>Everything in one place.</h2>
            <div className="summary-section"><h3><Heart size={17}/> Saved styles <span>{styles.length}</span></h3>
              {styles.length ? styles.map(s=><p key={s.id}>{s.title}</p>):<p>Browse our photography collections and save the styles you love.</p>}
              <Link to="/portfolios" className="ed-text-button">Explore portfolio <ArrowRight size={14}/></Link>
            </div>
            <div className="summary-section"><h3><Package size={17}/> Selected gifts <span>{quote.length}</span></h3>
              {quote.length?quote.map((v,i)=>{
                const p=products.find(p=>p.id===v.productId);
                const option=p?.variants.find(x=>x.id===v.variantId);
                return <p key={i}>{p?.name||v.productId} · {option?.size||v.variantId} · Qty {v.quantity}</p>;
              }):<p>Add custom photo gifts to your shortlist.</p>}
              <Link to="/gifts" className="ed-text-button">Explore gifts <ArrowRight size={14}/></Link>
            </div>
            <p className="ed-footnote">We confirm every order before printing. No payment is collected on this page.</p>
          </aside>
        </div>
      </>}
    </main>
    <SiteFooter/>
  </div>;
}
