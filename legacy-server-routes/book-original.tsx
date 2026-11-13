import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { supabase } from "@/integrations/supabase/client";
import { SITE, telLink, waMessage, whatsappLink } from "@/lib/site";
import { servicePortfolioUrl } from "@/lib/customer-directory";
import { absUrl, breadcrumbJsonLd, localBusinessJsonLd } from "@/lib/seo";

const searchSchema = z.object({ service: z.string().optional() });

/** Public service chooser. Portfolio slug is null for services without a page. */
const SERVICES: { key: string; title: string; blurb: string; slug: string | null }[] = [
  { key: "baby", title: "Baby", blurb: "Newborn, sitter & cake smash sessions", slug: "baby" },
  { key: "maternity", title: "Maternity", blurb: "Soft, elegant portraits of this chapter", slug: "maternity" },
  { key: "family", title: "Family", blurb: "Warm, unhurried family portraits", slug: "family" },
  { key: "wedding", title: "Wedding", blurb: "Candid coverage & full-day storytelling", slug: "wedding" },
  { key: "other", title: "Something else", blurb: "Birthdays, pre-wedding, events & more", slug: null },
];

export const Route = createFileRoute("/book")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => {
    const title = "Plan your shoot | Rajmoti Studio, Jetpur";
    const desc =
      "Tell us what you'd like photographed and talk to Rajmoti Studio, Jetpur on WhatsApp or by phone — baby, maternity, family and wedding sessions.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: absUrl("/book") },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: absUrl("/book") }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(localBusinessJsonLd()) },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Plan your shoot", path: "/book" },
            ]),
          ),
        },
      ],
    };
  },
  component: BookPage,
});

function BookPage() {
  const { service: serviceParam } = Route.useSearch();
  const initial = SERVICES.some((s) => s.key === serviceParam) ? (serviceParam as string) : "";
  const [service, setService] = useState(initial);
  const [note, setNote] = useState("");
  const [callback, setCallback] = useState({ name: "", phone: "" });
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  const selected = SERVICES.find((s) => s.key === service) ?? null;

  const waHref = useMemo(() => {
    if (!selected) return whatsappLink(waMessage.booking());
    return whatsappLink(
      waMessage.service({
        title: selected.title === "Something else" ? "a photography session" : selected.title,
        portfolioUrl: servicePortfolioUrl(selected.slug),
        note,
      }),
    );
  }, [selected, note]);

  async function requestCallback() {
    if (callback.name.trim().length < 2 || callback.phone.trim().length < 6) {
      toast.error("Please add your name and mobile number.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("inquiries").insert({
      name: callback.name.trim(),
      phone: callback.phone.trim(),
      service_type: selected?.key ?? null,
      category_label: selected?.title ?? null,
      message: note.trim() || null,
    } as never);
    setSaving(false);
    if (error) {
      toast.error("Could not send that — please WhatsApp us instead.");
      return;
    }
    setSent(true);
    toast.success("Thank you — we'll call you back shortly.");
  }

  return (
    <div className="min-h-screen bg-cream">
      <SiteNav />
      <main className="pt-28 md:pt-36 pb-28 md:pb-32">
        <div className="container-page max-w-3xl">
          <motion.header
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <p className="eyebrow text-gold mb-3">Let's plan your shoot</p>
            <h1 className="font-display text-4xl md:text-5xl">
              Tell us what you'd like photographed
            </h1>
            <p className="text-muted-foreground mt-4 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
              No long forms. Choose what you're planning and we'll continue the conversation on
              WhatsApp or over a call — most families book in a two-minute chat.
            </p>
          </motion.header>

          <section aria-labelledby="service-heading" className="mt-12">
            <h2 id="service-heading" className="eyebrow text-muted-foreground mb-4">
              What are you interested in?
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {SERVICES.map((s) => {
                const active = s.key === service;
                return (
                  <button
                    key={s.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setService(active ? "" : s.key)}
                    className={`text-left border px-5 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                      active ? "border-gold bg-white" : "border-onyx/10 hover:border-onyx/30 bg-white/60"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-display text-xl">{s.title}</span>
                      {active && <Check className="size-4 text-gold" aria-hidden />}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-1">{s.blurb}</span>
                  </button>
                );
              })}
            </div>

            {selected?.slug && (
              <p className="text-xs text-muted-foreground mt-3">
                See our{" "}
                <Link
                  to="/portfolios/$category"
                  params={{ category: selected.slug }}
                  className="border-b border-onyx/20 hover:text-gold hover:border-gold"
                >
                  {selected.title.toLowerCase()} photography in Jetpur
                </Link>{" "}
                before you message us.
              </p>
            )}
          </section>

          <section className="mt-10">
            <label className="block text-sm">
              <span className="eyebrow text-muted-foreground block mb-2">
                Anything you'd like us to know? (optional)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Date you have in mind, baby's age, city, or anything special."
                className="w-full border border-onyx/15 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              />
            </label>
          </section>

          <section className="mt-10 flex flex-col sm:flex-row gap-3">
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-onyx text-cream px-6 py-4 text-xs uppercase tracking-widest font-semibold hover:bg-gold transition-colors"
            >
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp Rajmoti
            </a>
            <a
              href={telLink()}
              className="flex-1 inline-flex items-center justify-center gap-2 border border-onyx/20 px-6 py-4 text-xs uppercase tracking-widest font-semibold hover:border-gold hover:text-gold transition-colors"
            >
              <Phone className="size-4" aria-hidden />
              Call Rajmoti
            </a>
          </section>

          <section className="mt-14 border-t border-onyx/10 pt-10">
            <h2 className="font-display text-2xl">Prefer we call you?</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Leave your number and we'll ring you back from {SITE.location.split(",")[0]}.
            </p>
            {sent ? (
              <p className="mt-5 inline-flex items-center gap-2 text-sm text-gold">
                <Check className="size-4" aria-hidden /> Thank you — we'll be in touch shortly.
              </p>
            ) : (
              <div className="mt-5 grid sm:grid-cols-[1fr_1fr_auto] gap-3">
                <label className="block text-sm">
                  <span className="sr-only">Your name</span>
                  <input
                    value={callback.name}
                    onChange={(e) => setCallback((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Your name"
                    autoComplete="name"
                    className="w-full border border-onyx/15 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  />
                </label>
                <label className="block text-sm">
                  <span className="sr-only">Mobile number</span>
                  <input
                    value={callback.phone}
                    onChange={(e) => setCallback((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="Mobile number"
                    inputMode="tel"
                    autoComplete="tel"
                    className="w-full border border-onyx/15 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  />
                </label>
                <button
                  type="button"
                  onClick={requestCallback}
                  disabled={saving}
                  className="border border-onyx/20 px-6 py-3 text-xs uppercase tracking-widest font-semibold hover:border-gold hover:text-gold transition-colors disabled:opacity-50"
                >
                  {saving ? "Sending…" : "Request a call"}
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
      <WhatsAppFloat />
      <MobileCtaBar />
    </div>
  );
}
