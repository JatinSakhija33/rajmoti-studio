import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, X, Heart, Package, ArrowLeft } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useStyles, useQuote, useProducts, read, write } from "@/features/catalogue/store";
export const Route = createFileRoute("/contact")({
  validateSearch: (s: Record<string, unknown>) => ({
    package: typeof s.package === "string" ? s.package : undefined,
    session: typeof s.session === "string" ? s.session : undefined,
  }),
  head: () => ({ meta: [{ title: "Plan your session — Rajmoti Studio" }] }),
  component: Contact,
});
const texts = {
  en: {
    kicker: "Let’s make a little room for your story",
    title: "Tell us what you have in mind.",
    intro:
      "A few details are all we need to begin. Your selected styles and gifts stay with your enquiry.",
    type: "What are you planning?",
    date: "Preferred date (optional)",
    name: "Your name",
    phone: "WhatsApp number",
    age: "Baby’s age",
    submit: "Save demo enquiry",
    notice: "Private demonstration. Use fictional details. Nothing is sent to the studio.",
    language: "ગુજરાતીમાં મદદ",
    help: "Dates, pricing and delivery are confirmed personally by the studio.",
  },
  gu: {
    kicker: "તમારી યાદોને સાચવવાની શરૂઆત",
    title: "તમને શું કરાવવું છે તે જણાવો.",
    intro: "થોડી વિગતો જણાવો. પસંદ કરેલા ફોટોની શૈલી અને ભેટોની માહિતી તમારી પૂછપરછ સાથે રહેશે.",
    type: "કઈ સેવા જોઈએ છે?",
    date: "પસંદગીની તારીખ (વૈકલ્પિક)",
    name: "તમારું નામ",
    phone: "વોટ્સએપ નંબર",
    age: "બાળકની ઉંમર",
    submit: "નમૂનાની પૂછપરછ સાચવો",
    notice: "આ માત્ર નમૂનો છે. કાલ્પનિક વિગતો વાપરો. સ્ટુડિયોને કંઈ મોકલવામાં આવશે નહીં.",
    language: "English form",
    help: "તારીખ, કિંમત અને ડિલિવરીની પુષ્ટિ સ્ટુડિયો કરશે.",
  },
};
function Contact() {
  const search = Route.useSearch();
  const [gu, setGu] = useState(false);
  const t = gu ? texts.gu : texts.en;
  const [styles, setStyles] = useStyles();
  const [quote, setQuote] = useQuote();
  const [products] = useProducts();
  const [type, setType] = useState(
    [
      "Baby",
      "Maternity",
      "Family",
      "Wedding",
      "Photo gifting",
      "Corporate / bulk gifts",
      "Other",
    ].find((x) => x.toLowerCase() === search.session?.toLowerCase()) ||
      (quote.length ? "Photo gifting" : "Baby"),
  );
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState("");
  const day = new Date();
  const today = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) {
      setError(gu ? "કૃપા કરીને નામ લખો." : "Please enter a name of at least two characters.");
      return;
    }
    if (!/^(?:91)?[6-9]\d{9}$/.test(phone.replace(/\D/g, ""))) {
      setError(
        gu
          ? "સાચા ફોર્મેટમાં ૧૦ અંકનો નમૂનાનો મોબાઇલ નંબર લખો."
          : "Use a 10-digit Indian mobile number format, optionally prefixed with +91.",
      );
      return;
    }
    const id = `DEMO-${Date.now().toString(36).toUpperCase()}`;
    try {
      write("rajmoti:editorial:enquiries:v2", [
        ...read<any[]>("rajmoti:editorial:enquiries:v2", []),
        {
          id,
          type,
          date,
          name: name.trim(),
          phone,
          age: type === "Baby" ? age : null,
          package: search.package || null,
          styles,
          quote,
          status: "awaiting_confirmation",
          demo: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      setSent(id);
    } catch {
      setError("Could not save in this browser. Please check browser storage and retry.");
    }
  }
  return (
    <div className="editorial">
      <SiteNav />
      <main className="ed-wrap enquiry-page">
        {sent ? (
          <section className="enquiry-success">
            <CheckCircle2 size={42} />
            <p className="ed-kicker">Saved on this browser only</p>
            <h1>
              Your demo enquiry
              <br />
              <em>is ready.</em>
            </h1>
            <p className="status-pill">Awaiting confirmation · simulated</p>
            <p>No booking or order has been made. No message was sent to Rajmoti Studio.</p>
            <ol>
              <li>The live studio would review your session or gift selection.</li>
              <li>You would agree on date, inclusions, price and delivery.</li>
              <li>Your booking would be confirmed only after that conversation.</li>
            </ol>
            <code>{sent}</code>
            <div className="ed-actions">
              <button className="ed-button" onClick={() => setSent(null)}>
                Edit another demo enquiry
              </button>
              <Link to="/" className="ed-text-button">
                Return home
              </Link>
            </div>
          </section>
        ) : (
          <>
            <div className="enquiry-heading">
              <p className="ed-kicker">{t.kicker}</p>
              <h1>
                {gu ? (
                  t.title
                ) : (
                  <>
                    A little conversation.
                    <br />
                    <em>A lovely beginning.</em>
                  </>
                )}
              </h1>
              <p className="ed-copy">{t.intro}</p>
              <button onClick={() => setGu(!gu)} className="ed-text-button">
                {t.language}
              </button>
            </div>
            <div className="enquiry-layout">
              <form className="enquiry-form" onSubmit={submit}>
                <p className="ed-notice">{t.notice}</p>
                {search.package && <p className="status-pill">Collection: {search.package}</p>}
                <label>
                  {t.type}
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    {[
                      "Baby",
                      "Maternity",
                      "Family",
                      "Wedding",
                      "Photo gifting",
                      "Corporate / bulk gifts",
                      "Other",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                {type === "Baby" && (
                  <label>
                    {t.age}
                    <select required value={age} onChange={(e) => setAge(e.target.value)}>
                      <option value="">{gu ? "પસંદ કરો" : "Please select"}</option>
                      {[
                        "Newborn (0–2 months)",
                        "3–6 months",
                        "7–12 months",
                        "1–3 years",
                        "Older / not sure",
                      ].map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  {t.date}
                  <input
                    type="date"
                    value={date}
                    min={today}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <label>
                  {t.name}
                  <input
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete="off"
                    placeholder="Demo customer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label>
                  {t.phone}
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    maxLength={16}
                    placeholder="10-digit demo number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                {error && (
                  <p role="alert" className="form-error">
                    {error}
                  </p>
                )}
                <button className="ed-button" type="submit">
                  {t.submit}
                  <ArrowRight size={16} />
                </button>
                <p className="ed-footnote">{t.help} The demo does not promise a response time.</p>
              </form>
              <aside className="enquiry-summary">
                <h2>Your inspiration, together.</h2>
                <div className="summary-section">
                  <h3>
                    <Heart size={17} /> Saved styles <span>{styles.length}</span>
                  </h3>
                  {styles.length ? (
                    styles.map((s) => (
                      <div className="saved-style-row" key={s.id}>
                        <img src={s.image} alt="Saved demonstration style" width="64" height="72" />
                        <div>
                          <strong>{s.title}</strong>
                          <small>{s.id}</small>
                        </div>
                        <button
                          aria-label={`Remove style ${s.title}`}
                          onClick={() => setStyles(styles.filter((x) => x.id !== s.id))}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p>Save a style from a gallery to include it here.</p>
                  )}
                  <Link to="/portfolios" className="ed-text-button">
                    Browse photography <ArrowUpRightMini />
                  </Link>
                </div>
                <div className="summary-section">
                  <h3>
                    <Package size={17} /> Gift shortlist <span>{quote.length}</span>
                  </h3>
                  {quote.length ? (
                    quote.map((line, i) => {
                      const p = products.find((p) => p.id === line.productId);
                      const v = p?.variants.find((v) => v.id === line.variantId);
                      return (
                        <div className="quote-summary-row" key={i}>
                          <div>
                            <strong>{p?.name || line.productId}</strong>
                            <small>
                              {v?.size} · Qty {line.quantity}
                            </small>
                            <small>
                              {line.personalisation} · {line.packaging}
                            </small>
                            <small>{line.variantId} · Price to confirm</small>
                          </div>
                          <button
                            aria-label={`Remove gift ${p?.name}`}
                            onClick={() => setQuote(quote.filter((_, j) => j !== i))}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p>Choose products and variants from the gift directory.</p>
                  )}
                  <Link to="/gifts" className="ed-text-button">
                    Explore photo gifts <ArrowUpRightMini />
                  </Link>
                </div>
                <p className="ed-footnote">
                  No file uploads, payments or external submissions. Your demonstration details
                  remain in this browser.
                </p>
              </aside>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
function ArrowUpRightMini() {
  return <ArrowRight size={14} />;
}
