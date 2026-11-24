import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, X, Heart, Package, ArrowLeft } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { StudioMap } from "@/components/studio-map";
import { directionsLink, SITE, whatsappLink } from "@/lib/site";
import { canonicalFor } from "@/lib/seo";
import { useStyles, useQuote, useProducts } from "@/features/catalogue/store";
import { giftPrice } from "@/features/catalogue/gift-pricing";
export const Route = createFileRoute("/contact")({
  validateSearch: (s: Record<string, unknown>) => ({
    package: typeof s.package === "string" ? s.package : undefined,
    session: typeof s.session === "string" ? s.session : undefined,
  }),
  head: () => ({
    meta: [{ title: "Contact Rajmoti Studio — Sessions & Photo Gifts" }, canonicalFor("/contact").ogUrl],
    links: canonicalFor("/contact").links,
  }),
  component: Contact,
});
const services = [
  ["Baby", "બાળકની ફોટોગ્રાફી"],
  ["Maternity", "મેટરનિટી ફોટોગ્રાફી"],
  ["Family", "પરિવારની ફોટોગ્રાફી"],
  ["Wedding", "લગ્નની ફોટોગ્રાફી"],
  ["Cinematic reels", "સિનેમેટિક રીલ્સ"],
  ["Photo gifting", "ફોટો ભેટ"],
  ["Corporate / bulk gifts", "કોર્પોરેટ / મોટી સંખ્યામાં ભેટ"],
  ["Passport photos", "પાસપોર્ટ ફોટા"],
  ["Photo restoration", "જૂના ફોટાનું રિસ્ટોરેશન"],
  ["Memorial photos", "સ્મૃતિ ફોટા"],
  ["Other", "અન્ય"],
] as const;

function serviceFor(session: string | undefined, hasGifts: boolean) {
  if (!session) return hasGifts ? "Photo gifting" : "Baby";
  const value = session.toLowerCase().replaceAll("-", " ");
  return services.find(([label]) => label.toLowerCase() === value)?.[0] ??
    services.slice(0, 4).find(([label]) => new RegExp("\\b" + label.toLowerCase() + "\\b").test(value))?.[0] ??
    "Other";
}
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
  const [type, setType] = useState<string>(serviceFor(search.session, quote.length > 0));
  const [venue, setVenue] = useState("");
  const [coverage, setCoverage] = useState("");
  const [fulfilment, setFulfilment] = useState("");
  const [notes, setNotes] = useState("");
  const [maternityWeeks, setMaternityWeeks] = useState("");
  const isGift = type === "Photo gifting" || type === "Corporate / bulk gifts";
  const selectedPackage = type === serviceFor(search.session, quote.length > 0) ? search.package : undefined;
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
    const items = isGift ? quote.map((line) => {
      const product = products.find((item) => item.id === line.productId);
      const variant = product?.variants.find((item) => item.id === line.variantId);
      return [
        product?.name || line.productId,
        variant?.size,
        variant?.finish,
        variant?.thickness,
        line.productId + " / " + line.variantId,
        "Qty " + line.quantity,
        line.personalisation,
        line.packaging,
        line.orderType,
      ].filter(Boolean).join(" · ");
    }) : [];
    const message = [
      "Hello Rajmoti Studio, I’d like to ask about " + type.toLowerCase() + ".",
      gu && "Please reply in Gujarati if possible.",
      "Name: " + name.trim(),
      "Contact: " + phone,
      type === "Other" && search.session && "Service: " + search.session,
      selectedPackage && "Session package: " + selectedPackage,
      date && (isGift ? "Needed by: " : "Preferred date: ") + date,
      type === "Baby" && age && "Baby’s age: " + age,
      type === "Maternity" && maternityWeeks && "Pregnancy week: " + maternityWeeks,
      type === "Wedding" && venue.trim() && "Venue / city: " + venue.trim(),
      type === "Wedding" && coverage.trim() && "Coverage: " + coverage.trim(),
      isGift && fulfilment && "Preferred fulfilment: " + fulfilment,
      !isGift && styles.length > 0 && "Saved styles: " + styles.slice(0, 8).map((style) => style.title).join(", "),
      ...items.map((item) => "• " + item),
      notes.trim() && "Notes: " + notes.trim(),
    ].filter(Boolean).join("\n");
    setSent(message);
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
            <p className="whitespace-pre-wrap break-words p-4 text-left text-sm bg-white/70 border border-onyx/10 my-5 max-h-80 overflow-auto">{sent}</p>
            <div className="ed-actions">
              <a href={whatsappLink(sent)} target="_blank" rel="noopener noreferrer" className="ed-button">
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
              <button type="button" lang={gu ? "en" : "gu"} onClick={() => setGu(!gu)} className="ed-text-button">
                {t.language}
              </button>
            </div>
            <div className="enquiry-layout">
              <form lang={gu ? "gu" : "en"} className="enquiry-form" onSubmit={submit}>
                <p className="ed-notice">{t.notice}</p>
                {selectedPackage && <p className="status-pill">{gu ? "પેકેજ" : "Session package"} · {selectedPackage}</p>}
                <label>
                  {t.type}
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    {services.map(([value, guLabel]) => (
                      <option key={value} value={value}>{gu ? guLabel : value}</option>
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
                {type === "Maternity" && (
                  <label>
                    {gu ? "ગર્ભાવસ્થાનું અઠવાડિયું (વૈકલ્પિક)" : "Pregnancy week (optional)"}
                    <input type="number" min={1} max={42} value={maternityWeeks}
                      onChange={(e) => setMaternityWeeks(e.target.value)} />
                  </label>
                )}
                {type === "Wedding" && (
                  <>
                    <label>
                      {gu ? "સ્થળ અથવા શહેર" : "Venue or city (optional)"}
                      <input maxLength={120} value={venue} onChange={(e) => setVenue(e.target.value)} />
                    </label>
                    <label>
                      {gu ? "કયા પ્રસંગો આવરી લેવા છે?" : "Events and coverage (optional)"}
                      <input maxLength={180} value={coverage} onChange={(e) => setCoverage(e.target.value)} />
                    </label>
                  </>
                )}
                {isGift && (
                  <label>
                    {gu ? "ભેટ કેવી રીતે મેળવવી છે?" : "How would you like to receive it?"}
                    <select aria-label={gu ? "ભેટ કેવી રીતે મેળવવી છે?" : "How would you like to receive it?"} value={fulfilment} onChange={(e) => setFulfilment(e.target.value)}>
                      <option value="">{gu ? "હજુ નક્કી નથી" : "Undecided"}</option>
                      <option value="Jetpur studio pickup">{gu ? "જેતપુર સ્ટુડિયોથી લેવું" : "Pick up at the Jetpur studio"}</option>
                      <option value="Ask about delivery">{gu ? "ડિલિવરી વિશે પૂછવું છે" : "Ask about delivery"}</option>
                    </select>
                  </label>
                )}
                <label>
                  {isGift ? (gu ? "ભેટ ક્યારે જોઈએ છે? (વૈકલ્પિક)" : "Needed by (optional)") : t.date}
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
                <label>
                  {isGift
                    ? (gu ? "નામ, સંદેશ અથવા ભેટની વિગતો" : "Name, message or other gift details (optional)")
                    : (gu ? "બીજી વિગતો (વૈકલ્પિક)" : "Anything else we should know? (optional)")}
                  <textarea rows={3} maxLength={350} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
                      const price = p && v ? giftPrice(p, v) : null;
                      return (
                        <div className="quote-summary-row" key={i}>
                          <div>
                            <strong>{p?.name || line.productId}</strong>
                            <small>
                              {[v?.size, v?.finish, "Qty " + line.quantity].filter(Boolean).join(" · ")}
                            </small>
                            <small>
                              {line.personalisation} · {line.packaging}
                            </small>
                            <small>{line.variantId} · {price == null ? "Price to confirm" : "₹" + price.toLocaleString("en-IN") + " each"}</small>
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
                  WhatsApp receives the details only when you send the message. Your preview photos stay on this device.
                </p>
              </aside>
            </div>
          </>
        )}
        <section className="mt-16 border-t border-onyx/10 pt-10">
          <h2 className="mb-3 font-display text-3xl">{gu ? "સ્ટુડિયોની મુલાકાત લો" : "Visit the studio"}</h2>
          <p className="mb-3 text-sm">{gu ? "જેતપુર, ગુજરાત, ભારત" : SITE.location}</p>
          <a className="text-sm underline" href={directionsLink()}>
            {gu ? "માર્ગ જુઓ" : "Get directions"}
          </a>
          <StudioMap />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
function ArrowUpRightMini() {
  return <ArrowRight size={14} />;
}
