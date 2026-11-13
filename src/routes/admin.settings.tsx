import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, categoriesQuery } from "@/lib/queries";
import { SlotManager } from "@/components/admin/slot-manager";
import { useMotionPrefs } from "@/lib/motion";
import {
  communicationQuery, templatesQuery, saveSetting, buildMessage, portfolioUrlFor,
  TEMPLATE_ORDER, TEMPLATE_VARIABLES, DEFAULT_TEMPLATES,
  type Communication, type Templates, type TemplateKey,
} from "@/lib/studio-settings";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Rajmoti Studio" }] }),
  component: AdminSettings,
});

const TABS = [
  { id: "general", label: "General" },
  { id: "communication", label: "Communication" },
  { id: "website", label: "Website" },
  { id: "messages", label: "Messages" },
  { id: "studio", label: "Studio day" },
  { id: "seo", label: "Local SEO & AEO" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function AdminSettings() {
  const [tab, setTab] = useState<TabId>("general");
  const m = useMotionPrefs();

  return (
    <div className="max-w-5xl">
      <header className="mb-6">
        <p className="eyebrow text-gold mb-2">Settings</p>
        <h1 className="font-display text-4xl">Studio configuration</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          Everything the studio says and shares lives here — identity, channels, links and the messages you send on WhatsApp.
        </p>
      </header>

      <div role="tablist" aria-label="Settings sections" className="flex gap-1 border-b border-onyx/10 mb-8 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id} role="tab" aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-2.5 text-sm whitespace-nowrap outline-none focus-visible:ring-1 focus-visible:ring-gold ${
              tab === t.id ? "text-onyx" : "text-muted-foreground hover:text-onyx"
            }`}
          >
            {t.label}
            {tab === t.id && (
              <motion.span layoutId="settings-tab" transition={m.card}
                className="absolute left-0 right-0 -bottom-px h-px bg-gold" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {tab === "general" && <GeneralSection />}
        {tab === "communication" && <CommunicationSection />}
        {tab === "website" && <WebsiteSection />}
        {tab === "messages" && <MessagesSection />}
        {tab === "studio" && <SlotManager />}
        {tab === "seo" && <LocalSeoSection />}
      </div>
    </div>
  );
}

/* -------------------- shared pieces -------------------- */

function useSaver() {
  const qc = useQueryClient();
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  async function run(key: string, value: unknown, label: string) {
    setState("saving");
    try {
      await saveSetting(key, value);
      await qc.invalidateQueries({ queryKey: ["settings"] });
      setState("saved");
      toast.success(label);
      window.setTimeout(() => setState("idle"), 1800);
    } catch (e: any) {
      setState("idle");
      toast.error(e?.message ?? "Could not save. Please try again.");
    }
  }
  return { state, run };
}

function SectionCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-onyx/10 p-6">
      <h2 className="font-display text-xl mb-1">{title}</h2>
      {hint && <p className="text-xs text-muted-foreground mb-5 max-w-lg">{hint}</p>}
      {children}
    </section>
  );
}

function SaveBar({ dirty, state, onSave, label = "Save changes" }: {
  dirty: boolean; state: "idle" | "saving" | "saved"; onSave: () => void; label?: string;
}) {
  const m = useMotionPrefs();
  return (
    <div className="mt-6 flex items-center gap-3">
      <motion.button
        whileTap={m.press} onClick={onSave} disabled={!dirty || state === "saving"}
        className="eyebrow px-5 py-2.5 bg-onyx text-cream hover:bg-gold hover:text-onyx disabled:opacity-40 disabled:hover:bg-onyx disabled:hover:text-cream inline-flex items-center gap-2 transition-colors"
      >
        {state === "saving" && <Loader2 className="size-3.5 animate-spin" />}
        {state === "saving" ? "Saving…" : label}
      </motion.button>
      <AnimatePresence>
        {state === "saved" && (
          <motion.span initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs text-gold inline-flex items-center gap-1"><Check className="size-3" /> Saved</motion.span>
        )}
        {dirty && state !== "saving" && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-xs text-muted-foreground">Unsaved changes</motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, className, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string; type?: string;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="eyebrow text-[10px] text-muted-foreground block mb-1.5">{label}</span>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-onyx/15 px-3 py-2 outline-none focus:border-gold transition-colors"
      />
    </label>
  );
}

/* -------------------- General -------------------- */

function GeneralSection() {
  const { data: settings = [] } = useQuery(settingsQuery);
  const { data: comm } = useQuery(communicationQuery);
  const saver = useSaver();
  const mapsSaver = useSaver();
  const site = (settings.find((s: any) => s.key === "site")?.value as any) ?? {};
  const mapsEmbed = (settings.find((s: any) => s.key === "maps_embed_url")?.value as string) ?? "";

  const [form, setForm] = useState({ name: "", tagline: "", email: "", whatsapp: "", location: "" });
  const [maps, setMaps] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setForm({
      name: site.name ?? "Rajmoti Studio", tagline: site.tagline ?? "", email: site.email ?? "",
      whatsapp: site.whatsapp ?? "", location: site.location ?? "",
    });
    setMaps(mapsEmbed);
    setReady(true);
  }, [settings.length]);

  const dirty = ready && JSON.stringify(form) !== JSON.stringify({
    name: site.name ?? "Rajmoti Studio", tagline: site.tagline ?? "", email: site.email ?? "",
    whatsapp: site.whatsapp ?? "", location: site.location ?? "",
  });

  async function save() {
    await saver.run("site", form, "Studio details saved");
    if (comm) {
      await saveSetting("communication", {
        ...comm,
        studio: { ...comm.studio, name: form.name, tagline: form.tagline, whatsapp: form.whatsapp, address: form.location },
      });
    }
  }

  return (
    <>
      <SectionCard title="Studio identity" hint="Used across messages and the public site. Stored privately — only signed-in staff can read it.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Studio name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Tagline" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="WhatsApp number" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} placeholder="+91…" />
          <Field label="Studio address" value={form.location} onChange={(v) => setForm({ ...form, location: v })} className="sm:col-span-2" />
        </div>
        <SaveBar dirty={dirty} state={saver.state} onSave={save} label="Save studio details" />
      </SectionCard>

      <SectionCard title="Google Maps embed" hint="Google Maps → search your studio → Share → Embed a map → paste the URL or the full iframe. Shown on the home page.">
        <textarea
          value={maps} onChange={(e) => setMaps(e.target.value)} rows={4}
          placeholder='https://www.google.com/maps/embed?pb=…'
          className="w-full border border-onyx/15 px-3 py-2 text-sm font-mono outline-none focus:border-gold"
        />
        <SaveBar dirty={ready && maps !== mapsEmbed} state={mapsSaver.state}
          onSave={() => mapsSaver.run("maps_embed_url", maps, "Maps embed saved")} label="Save maps embed" />
        {maps && extractSrc(maps) && (
          <div className="mt-6">
            <p className="eyebrow text-[10px] text-muted-foreground mb-2">Preview</p>
            <iframe src={extractSrc(maps)!} className="w-full aspect-video border border-onyx/10" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        )}
      </SectionCard>
    </>
  );
}

/* -------------------- Communication -------------------- */

function CommunicationSection() {
  const { data: comm } = useQuery(communicationQuery);
  const saver = useSaver();
  const [draft, setDraft] = useState<Communication | null>(null);
  useEffect(() => { if (comm) setDraft(structuredClone(comm)); }, [comm]);

  if (!draft || !comm) return <SkeletonCard />;
  const dirty = JSON.stringify(draft) !== JSON.stringify(comm);

  return (
    <>
      <SectionCard title="WhatsApp" hint="The number customers are messaged from, and the default sending name.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="WhatsApp number" value={draft.studio.whatsapp}
            onChange={(v) => setDraft({ ...draft, studio: { ...draft.studio, whatsapp: v } })} placeholder="+91…" />
          <Field label="Studio phone" value={draft.studio.phone}
            onChange={(v) => setDraft({ ...draft, studio: { ...draft.studio, phone: v } })} />
        </div>
      </SectionCard>

      <SectionCard title="Instagram" hint="Instagram cannot pre-fill a chat, so the app simply opens your profile.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Profile URL" value={draft.instagram.url}
            onChange={(v) => setDraft({ ...draft, instagram: { ...draft.instagram, url: v } })} placeholder="https://instagram.com/…" />
          <Field label="Display name" value={draft.instagram.handle}
            onChange={(v) => setDraft({ ...draft, instagram: { ...draft.instagram, handle: v } })} placeholder="@rajmotistudio" />
        </div>
        <label className="flex items-center gap-2 mt-4 text-sm">
          <input type="checkbox" checked={draft.instagram.shareMessage}
            onChange={(e) => setDraft({ ...draft, instagram: { ...draft.instagram, shareMessage: e.target.checked } })} />
          Add the Instagram link to every WhatsApp message
        </label>
      </SectionCard>

      <SectionCard title="Google profile" hint="Your reviews / business share link. Every message that offers reviews uses this value.">
        <Field label="Google profile URL" value={draft.google.profileUrl}
          onChange={(v) => setDraft({ ...draft, google: { ...draft.google, profileUrl: v } })} />
      </SectionCard>

      <div className="sticky bottom-4">
        <div className="bg-white border border-onyx/10 px-4 py-3">
          <SaveBar dirty={dirty} state={saver.state}
            onSave={() => saver.run("communication", draft, "Communication settings saved")} />
        </div>
      </div>
    </>
  );
}

/* -------------------- Website -------------------- */

function WebsiteSection() {
  const { data: comm } = useQuery(communicationQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const saver = useSaver();
  const [draft, setDraft] = useState<Communication | null>(null);
  useEffect(() => { if (comm) setDraft(structuredClone(comm)); }, [comm]);

  const services = useMemo(() => (categories as any[]).map((c) => ({ slug: c.slug as string, name: c.name as string })), [categories]);

  if (!draft || !comm) return <SkeletonCard />;
  const dirty = JSON.stringify(draft) !== JSON.stringify(comm);

  function pathFor(slug: string) {
    return draft!.website.services.find((s) => s.slug === slug)?.path ?? `/portfolios/${slug}`;
  }
  function setPath(slug: string, name: string, path: string) {
    const rest = draft!.website.services.filter((s) => s.slug !== slug);
    setDraft({ ...draft!, website: { ...draft!.website, services: [...rest, { slug, name, path }] } });
  }

  return (
    <>
      <SectionCard title="Canonical website" hint="Used to build every portfolio link the studio shares.">
        <Field label="Website URL" value={draft.website.url}
          onChange={(v) => setDraft({ ...draft, website: { ...draft.website, url: v } })} />
      </SectionCard>

      <SectionCard title="Service portfolio links" hint="Where each service sends customers. Changing it here changes every message and share menu.">
        <div className="space-y-3">
          {services.length === 0 && <p className="text-sm text-muted-foreground">Add services in Categories first.</p>}
          {services.map((s) => (
            <div key={s.slug} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[180px_minmax(0,1fr)] items-center gap-3">
              <span className="text-sm truncate">{s.name}</span>
              <div className="flex items-center gap-2 min-w-0">
                <input
                  value={pathFor(s.slug)} onChange={(e) => setPath(s.slug, s.name, e.target.value)}
                  className="flex-1 min-w-0 border border-onyx/15 px-3 py-2 text-sm outline-none focus:border-gold"
                />
              </div>
              <p className="col-span-2 text-[11px] text-muted-foreground -mt-1 truncate">
                {portfolioUrlFor(draft, s.slug)}
              </p>
            </div>
          ))}
        </div>
        <SaveBar dirty={dirty} state={saver.state} onSave={() => saver.run("communication", draft, "Website settings saved")} />
      </SectionCard>
    </>
  );
}

/* -------------------- Messages -------------------- */

function MessagesSection() {
  const { data: comm } = useQuery(communicationQuery);
  const { data: templates } = useQuery(templatesQuery);
  const saver = useSaver();
  const m = useMotionPrefs();
  const [active, setActive] = useState<TemplateKey>("portfolio");
  const [draft, setDraft] = useState<Templates | null>(null);
  useEffect(() => { if (templates) setDraft(structuredClone(templates)); }, [templates]);

  if (!draft || !templates || !comm) return <SkeletonCard />;
  const dirty = JSON.stringify(draft) !== JSON.stringify(templates);
  const tpl = draft[active];

  const preview = buildMessage({
    comm, templates: draft, kind: active,
    customerName: "Priya", serviceSlug: comm.website.services[0]?.slug ?? "baby", serviceName: comm.website.services[0]?.name ?? "Baby Photography",
  });

  function insert(token: string) {
    setDraft({ ...draft!, [active]: { ...tpl, body: `${tpl.body}${tpl.body.endsWith("\n") ? "" : "\n"}${token}` } });
  }

  return (
    <SectionCard title="WhatsApp messages" hint="Edit what customers receive. The preview on the right is exactly what will be sent.">
      <div className="flex gap-1 flex-wrap mb-5">
        {TEMPLATE_ORDER.map((k) => (
          <button key={k} onClick={() => setActive(k)}
            className={`text-xs px-3 py-1.5 border transition-colors ${active === k ? "border-gold bg-gold/10 text-onyx" : "border-onyx/15 text-muted-foreground hover:border-gold"}`}>
            {draft[k].name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <Field label="Message name" value={tpl.name} onChange={(v) => setDraft({ ...draft, [active]: { ...tpl, name: v } })} />
          <label className="block mt-4">
            <span className="eyebrow text-[10px] text-muted-foreground block mb-1.5">Message</span>
            <textarea
              value={tpl.body} rows={14}
              onChange={(e) => setDraft({ ...draft, [active]: { ...tpl, body: e.target.value } })}
              className="w-full border border-onyx/15 px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-gold"
            />
          </label>
          <div className="mt-3">
            <p className="eyebrow text-[10px] text-muted-foreground mb-1.5">Insert a variable</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <motion.button key={v.token} whileTap={m.press} onClick={() => insert(v.token)}
                  className="text-[11px] px-2 py-1 border border-onyx/15 hover:border-gold font-mono">{v.token}</motion.button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setDraft({ ...draft, [active]: DEFAULT_TEMPLATES[active] })}
            className="text-xs text-muted-foreground hover:text-onyx underline mt-4"
          >
            Reset to the default wording
          </button>
        </div>

        <div>
          <p className="eyebrow text-[10px] text-muted-foreground mb-1.5">Preview · Priya Patel</p>
          <div className="bg-[#e6ded3] p-4 min-h-[220px]">
            <div className="bg-white p-3 text-[13px] whitespace-pre-wrap leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.15)] max-w-[92%]">
              {preview}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Empty variables are removed automatically — customers never see blanks or placeholders.
          </p>
        </div>
      </div>

      <SaveBar dirty={dirty} state={saver.state} onSave={() => saver.run("message_templates", draft, "Templates saved")} label="Save template" />
    </SectionCard>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-onyx/10 p-6 space-y-3">
      <div className="h-5 w-40 bg-onyx/5 animate-pulse" />
      <div className="h-3 w-64 bg-onyx/5 animate-pulse" />
      <div className="h-10 w-full bg-onyx/5 animate-pulse" />
      <div className="h-10 w-full bg-onyx/5 animate-pulse" />
    </div>
  );
}

export function extractSrc(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("http")) return trimmed;
  const match = trimmed.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function LocalSeoSection() {
  const saver = useSaver();
  const [title, setTitle] = useState(
    "Rajmoti Studio — Photography, Framing & Personalised Photo Gifts in Jetpur",
  );
  const [desc, setDesc] = useState(
    "Rajmoti Studio in Jetpur, Gujarat (Est. 1982). Baby photoshoots, maternity, family, wedding photography, personalized photo framing, and thoughtful photo gifts.",
  );
  const [phone, setPhone] = useState("+91 94290 70317");
  const [address, setAddress] = useState("Jetpur, Gujarat 360370");
  const [hours, setHours] = useState("Contact on WhatsApp for visiting hours");

  return (
    <div className="space-y-6">
      {/* Google Search Simulator Preview */}
      <SectionCard
        title="Google Search Result Simulator"
        hint="Live preview of how Rajmoti Studio appears on Google Search for Jetpur local queries."
      >
        <div className="bg-white p-5 rounded-2xl border border-stone-200 font-sans max-w-2xl shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-900">
              RS
            </div>
            <div>
              <span className="text-xs font-medium text-stone-800 block leading-tight">Rajmoti Studio</span>
              <span className="text-[11px] text-stone-500 font-mono block leading-tight">https://rajmotistudio.in</span>
            </div>
          </div>
          <h3 className="text-lg text-[#1a0dab] hover:underline cursor-pointer font-medium leading-snug">
            {title}
          </h3>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
            {desc}
          </p>
          <div className="mt-3 pt-2 border-t border-stone-100 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#1a0dab]">
            <span className="hover:underline cursor-pointer">Photo gifts in Jetpur</span>
            <span className="hover:underline cursor-pointer">Baby photoshoot</span>
            <span className="hover:underline cursor-pointer">Handcrafted Teak Frames</span>
            <span className="hover:underline cursor-pointer">Contact & Studio Hours</span>
          </div>
        </div>
      </SectionCard>

      {/* Meta & Heading Details */}
      <SectionCard
        title="On-Page Metadata (Target: Jetpur Local Market)"
        hint="Optimized for local search discovery across Saurashtra."
      >
        <div className="space-y-4 max-w-xl">
          <label className="block text-xs font-semibold text-stone-800">
            Homepage SEO Title Tag
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-stone-300 rounded-lg p-2.5 mt-1 text-xs"
            />
            <span className="text-[10px] text-stone-400 mt-0.5 block">Recommended length: 50–65 characters ({title.length} characters)</span>
          </label>

          <label className="block text-xs font-semibold text-stone-800">
            Meta Description (Search Snippet)
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full border border-stone-300 rounded-lg p-2.5 mt-1 text-xs"
            />
            <span className="text-[10px] text-stone-400 mt-0.5 block">Recommended length: 120–160 characters ({desc.length} characters)</span>
          </label>
        </div>
      </SectionCard>

      {/* Local Business Facts */}
      <SectionCard
        title="Google Business Profile & NAP Consistency"
        hint="Name, Address, Phone must exactly match Google Maps and business citations."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl text-xs">
          <label className="block">
            <span className="font-semibold text-stone-800">Verified Business Address</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-stone-300 rounded-lg p-2 mt-1"
            />
          </label>

          <label className="block">
            <span className="font-semibold text-stone-800">Studio Phone / WhatsApp</span>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-stone-300 rounded-lg p-2 mt-1 font-mono"
            />
          </label>

          <label className="col-span-2 block">
            <span className="font-semibold text-stone-800">Studio Opening Hours</span>
            <input
              type="text"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full border border-stone-300 rounded-lg p-2 mt-1"
            />
          </label>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() =>
              saver.run(
                "local_seo_settings",
                { title, desc, phone, address, hours },
                "Local SEO configuration updated successfully",
              )
            }
            disabled={saver.state === "saving"}
            className="ed-button text-xs py-2 px-4 bg-stone-900 text-amber-100 hover:bg-stone-800 font-semibold"
          >
            {saver.state === "saving" ? "Saving Changes…" : "Save SEO & Business Info"}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
