import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, X, Heart, Package, ArrowLeft } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { whatsappLink } from "@/lib/site";
import { useStyles, useQuote, useProducts } from "@/features/catalogue/store";
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
    submit: "Prepare WhatsApp enquiry",
    notice: "Review your details here, then send your enquiry in WhatsApp.",
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
    submit: "WhatsApp પૂછપરછ તૈયાર કરો",
    notice: "તમારી વિગતો ચકાસીને WhatsApp પર પૂછપરછ મોકલો.",
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
          ? "સાચા ફોર્મેટમાં ૧૦ અંકનો મોબાઇલ નંબર લખો."
          : "Use a 10-digit Indian mobile number format, optionally prefixed with +91.",
      );
      return;
    }
    const items = quote.map((line) => {
      const product = products.find((item) => item.id === line.productId);
      const variant = product?.variants.find((item) => item.id === line.variantId);
      return [
        product?.name || line.productId,
        variant?.size || line.variantId,
        "Qty " + line.quantity,
      ].join(" · ");
    });
    const message = [
      "Hello Rajmoti Studio, I would like to make an enquiry.",
      "Name: " + name.trim(),
      "Contact: " + phone,
      "Interested in: " + type,
      date && "Preferred date: " + date,
      type === "Baby" && age && "Baby’s age: " + age,
      search.package && "Collection: " + search.package,
      styles.length > 0 &&
        "Saved styles: " +
          styles
            .slice(0, 8)
            .map((style) => style.title)
            .join(", "),
      items.length > 0 && "Product shortlist: " + items.slice(0, 8).join("; "),
    ]
      .filter(Boolean)
      .join("\n");
    setSent(whatsappLink(message));
  }
  return (
    <div className="editorial">
      <SiteNav />
      <main className="ed-wrap enquiry-page">
        {sent ? (
          <section className="enquiry-success">
            <CheckCircle2 size={42} />
            <h1>Your enquiry is ready.</h1>
            <p>
              Open WhatsApp to review and send it to the studio. Your session or order is confirmed
              separately.
            </p>
            <div className="ed-actions">
              <a href={sent} target="_blank" rel="noopener noreferrer" className="ed-button">
                Open WhatsApp <ArrowRight size={16} />
              </a>
              <button className="ed-text-button" onClick={() => setSent(null)}>
                Edit enquiry
              </button>
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
                    autoComplete="name"
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
                    autoComplete="tel"
                    maxLength={16}
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
                <p className="ed-footnote">{t.help}</p>
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
                        <img src={s.image} alt="Saved photography style" width="64" height="72" />
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
                  <Link to="/products" className="ed-text-button">
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
