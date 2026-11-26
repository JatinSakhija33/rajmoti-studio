import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, ArrowUpRight, Images } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GalleryPhotoPicker } from "@/components/admin/gallery-photo-picker";
import { adminCategoriesQuery, siteContentQuery } from "@/lib/queries";
import { InstagramFeed, lightwidgetUrl, type InstagramCms } from "@/components/instagram-feed";
import { homeHeroSlides } from "@/lib/homepage-gallery";
import { instagramHandle } from "@/lib/site";

export const Route = createFileRoute("/admin/content")({
  head: () => ({ meta: [{ title: "Content — Rajmoti Studio Admin" }] }),
  component: AdminContent,
});

type Hero = {
  eyebrow?: string;
  heading?: string;
  heading_italic?: string;
  description?: string;
  cta_primary_label?: string;
  cta_primary_href?: string;
  cta_secondary_label?: string;
  cta_secondary_href?: string;
  overlay_opacity?: number; // 0..100
  slideshow?: boolean;
  slideshow_seconds?: number;
  images?: string[];
  fallback_image?: string;
  badges?: { text: string }[];
  stats?: { value: string; label: string }[];
};

type About = { eyebrow?: string; heading?: string; body?: string; image?: string };
type Contact = { address?: string; phone?: string; email?: string; hours?: string };
type Seo = { title?: string; description?: string; og_image?: string };
type Footer = { blurb?: string; copyright?: string };

function AdminContent() {
  const qc = useQueryClient();
  const { data: content = {}, isLoading, isError, refetch } = useQuery(siteContentQuery);

  async function save(section: string, data: any): Promise<void> {
    const published = section === "hero" || section === "footer" ? { ...data, published_from_admin: true } : data;
    const { error } = await supabase.from("site_content").upsert({ section_key: section, data: published, updated_at: new Date().toISOString() });
    if (error) { toast.error(error.message); return; }
    toast.success(`${section[0].toUpperCase() + section.slice(1)} saved`);
    qc.setQueryData(siteContentQuery.queryKey, (previous) => ({ ...previous, [section]: published }));
  }

  if (isLoading) return <p role="status" className="text-muted-foreground">Loading website content…</p>;
  if (isError && !Object.keys(content).length) return <p role="alert" className="text-destructive">Website content couldn’t load. <button className="underline" onClick={() => void refetch()}>Try again</button></p>;

  return (
    <div data-owner-uploads="enabled" className="max-w-4xl space-y-10">
      <header>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h1 className="font-display text-4xl">Website content</h1>
            <p className="mt-2 text-sm text-muted-foreground">Reuse approved photos for the homepage and portfolio covers.</p></div>
          <Link to="/admin/images" hash="photo-upload" className="studio-secondary"><Images className="size-4" /> Add photos</Link>
        </div>
        <nav aria-label="Content sections" className="mt-5 flex flex-wrap gap-2">
          {[["homepage-hero", "Homepage hero"], ["portfolio-covers", "Portfolio covers"], ["about-content", "About"], ["contact-content", "Contact"], ["instagram-content", "Instagram"], ["seo-content", "SEO"], ["footer-content", "Footer"]].map(([id, text]) => (
            <a key={id} href={`#${id}`} className="studio-secondary">{text}</a>
          ))}
        </nav>
      </header>

      <HeroEditor initial={content.hero ?? {}} onSave={(v) => save("hero", v)} />
      <CategoryDefaultsEditor initial={(content.category_defaults ?? {}) as Record<string, string>} onSave={(v) => save("category_defaults", v)} />
      <AboutEditor initial={content.about ?? {}} onSave={(v) => save("about", v)} />
      <ContactEditor initial={content.contact ?? {}} onSave={(v) => save("contact", v)} />
      <InstagramEditor initial={(content.instagram ?? {}) as InstagramCms} onSave={(v) => save("instagram", v)} />
      <SeoEditor initial={content.seo ?? {}} onSave={(v) => save("seo", v)} />
      <FooterEditor initial={content.footer ?? {}} onSave={(v) => save("footer", v)} />
    </div>
  );
}

/* ============================== HERO ============================== */
function HeroEditor({ initial, onSave }: { initial: Hero; onSave: (v: Hero) => Promise<void> }) {
  const [v, setV] = useState<Hero>(initial);
  useEffect(() => setV(initial), [initial]);
  const update = (patch: Partial<Hero>) => setV((x) => ({ ...x, ...patch }));

  return (
    <Section title="Homepage hero" id="homepage-hero">
      <HeroImageManager images={v.images ?? []} onChange={(images) => update({ images })} />
      <details className="mt-5 rounded-xl border border-onyx/10 p-3">
        <summary className="cursor-pointer text-sm font-semibold">Check desktop and phone framing</summary>
        <div className="mt-3">
          <HeroCropPreview url={v.images?.[0] || v.fallback_image || homeHeroSlides[0].src} />
        </div>
      </details>

      <div className="mt-6">
        <SingleImage label="Fallback hero image (shown if no slideshow images above)" url={v.fallback_image ?? ""} onChange={(x) => update({ fallback_image: x })} size="large" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <F label="Eyebrow line" value={v.eyebrow ?? ""} onChange={(x) => update({ eyebrow: x })} placeholder="Est. Rajmoti Studio" />
        <F label="Heading — main" value={v.heading ?? ""} onChange={(x) => update({ heading: x })} placeholder="Capturing Life's" />
        <F label="Heading — italic accent" value={v.heading_italic ?? ""} onChange={(x) => update({ heading_italic: x })} placeholder="Most Beautiful Moments" />
        <F label="Description" value={v.description ?? ""} onChange={(x) => update({ description: x })} placeholder="One line under the heading" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <F label="Primary CTA label" value={v.cta_primary_label ?? ""} onChange={(x) => update({ cta_primary_label: x })} placeholder="View portfolios" />
        <F label="Primary CTA link" value={v.cta_primary_href ?? ""} onChange={(x) => update({ cta_primary_href: x })} placeholder="/portfolios" />
        <F label="Secondary CTA label" value={v.cta_secondary_label ?? ""} onChange={(x) => update({ cta_secondary_label: x })} placeholder="Begin your story" />
        <F label="Secondary CTA link" value={v.cta_secondary_href ?? ""} onChange={(x) => update({ cta_secondary_href: x })} placeholder="/contact" />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-4 items-end">
        <label className="block text-sm">
          <span className="eyebrow text-muted-foreground block mb-1">Overlay darkness</span>
          <input type="range" min={0} max={100} value={v.overlay_opacity ?? 30} onChange={(e) => update({ overlay_opacity: Number(e.target.value) })} className="w-full" />
          <span className="text-xs text-muted-foreground">{v.overlay_opacity ?? 30}%</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={v.slideshow !== false} onChange={(e) => update({ slideshow: e.target.checked })} />
          <span>Enable slideshow (cycles hero images)</span>
        </label>
        <label className="block text-sm">
          <span className="eyebrow text-muted-foreground block mb-1">Slideshow seconds</span>
          <input type="number" min={2} max={30} value={v.slideshow_seconds ?? 10} onChange={(e) => update({ slideshow_seconds: Number(e.target.value) })} className="w-full border border-onyx/15 px-3 py-2" />
        </label>
      </div>

      <Repeater
        label="Floating badges"
        items={v.badges ?? []}
        onChange={(badges) => update({ badges })}
        empty={{ text: "" }}
        render={(item, set) => (
          <F label="Text" value={item.text} onChange={(x) => set({ text: x })} placeholder="Award-winning studio" />
        )}
      />

      <Repeater
        label="Statistics"
        items={v.stats ?? []}
        onChange={(stats) => update({ stats })}
        empty={{ value: "", label: "" }}
        render={(item, set) => (
          <div className="grid grid-cols-2 gap-3">
            <F label="Value" value={item.value} onChange={(x) => set({ ...item, value: x })} placeholder="500+" />
            <F label="Label" value={item.label} onChange={(x) => set({ ...item, label: x })} placeholder="Families served" />
          </div>
        )}
      />

      <SaveBar onSave={() => onSave(v)} />
      <a href="/" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm underline">Open published homepage <ArrowUpRight className="size-4" /></a>
    </Section>
  );
}

function HeroCropPreview({ url }: { url: string }) {
  return <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
    <figure><img className="aspect-[16/7] w-full rounded-lg bg-onyx/5 object-contain" src={url} alt="Wide frame around the first hero image" /><figcaption className="mt-1 text-xs text-muted-foreground">Desktop framing</figcaption></figure>
    <figure><img className="mx-auto aspect-[4/5] max-h-48 w-full rounded-lg bg-onyx/5 object-contain" src={url} alt="Vertical frame around the first hero image" /><figcaption className="mt-1 text-xs text-muted-foreground">Phone framing</figcaption></figure>
  </div>;
}

function HeroImageManager({ images, onChange }: { images: string[]; onChange: (v: string[]) => void }) {
  function move(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm font-semibold">Hero photographs</p>
        <div className="flex flex-wrap items-start gap-2">
          <button type="button" className="studio-secondary" onClick={() => {
            if (images.length && !confirm("Replace the current selection with Rajmoti’s eight studio picks?")) return;
            onChange(homeHeroSlides.map((slide) => slide.src));
          }}>Use 8 studio picks</button>
          <GalleryPhotoPicker size="large" onSelect={(url) => {
            if (!images.includes(url)) onChange([...images, url]);
          }} />
        </div>
      </div>
      {images.length === 0 ? (
        <p className="text-xs text-muted-foreground border border-dashed border-onyx/15 py-6 text-center">The homepage uses studio-selected photographs until you select your own.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={url + i} className="relative group border border-onyx/10">
              <img src={url} alt="" className="w-full aspect-[4/3] object-cover" />
              <div className="flex flex-wrap items-center justify-center gap-1 p-1">
                <button aria-label={`Move photo ${i + 1} earlier`} disabled={i === 0} onClick={() => move(i, i - 1)} className="studio-icon">←</button>
                <button aria-label={`Move photo ${i + 1} later`} disabled={i === images.length - 1} onClick={() => move(i, i + 1)} className="studio-icon">→</button>
                <button aria-label={`Remove photo ${i + 1}`} onClick={() => onChange(images.filter((_, j) => j !== i))} className="studio-icon">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== ABOUT ============================== */
/* ============================== CATEGORY DEFAULT COVERS ============================== */
function CategoryDefaultsEditor({ initial, onSave }: { initial: Record<string, string>; onSave: (v: Record<string, string>) => Promise<void> }) {
  const [v, setV] = useState<Record<string, string>>(initial);
  useEffect(() => setV(initial), [initial]);
  const { data: categories = [] } = useQuery(adminCategoriesQuery);

  return (
    <Section title="Category default covers" id="portfolio-covers">
      <p className="text-xs text-muted-foreground mb-6">
        Shown on the homepage and portfolios page when a category doesn't have its own cover set in <span className="font-mono">Admin → Categories</span>. Uploading here replaces the built-in default images that shipped with the site.
      </p>
      {categories.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No categories yet — add one in Admin → Categories.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {categories.map((c: any) => (
            <div key={c.id} className="border border-onyx/10 p-4">
              <p className="font-display text-lg mb-3">{c.name}</p>
              <SingleImage
                label={`Default cover for ${c.slug}`}
                url={v[c.slug] ?? ""}
                onChange={(url) => setV({ ...v, [c.slug]: url })}
                size="medium"
              />
            </div>
          ))}
        </div>
      )}
      <SaveBar onSave={() => onSave(v)} />
    </Section>
  );
}

function AboutEditor({ initial, onSave }: { initial: About; onSave: (v: About) => Promise<void> }) {
  const [v, setV] = useState<About>(initial);
  useEffect(() => setV(initial), [initial]);
  return (
    <Section title="About section" id="about-content">
      <div className="grid sm:grid-cols-2 gap-4">
        <F label="Eyebrow" value={v.eyebrow ?? ""} onChange={(x) => setV({ ...v, eyebrow: x })} placeholder="Our story" />
        <F label="Heading" value={v.heading ?? ""} onChange={(x) => setV({ ...v, heading: x })} placeholder="Quiet craft, since…" />
      </div>
      <label className="block text-sm mt-4">
        <span className="eyebrow text-muted-foreground block mb-1">Body</span>
        <textarea value={v.body ?? ""} onChange={(e) => setV({ ...v, body: e.target.value })} rows={5} className="w-full border border-onyx/15 px-3 py-2" />
      </label>
      <div className="mt-4">
        <SingleImage label="About image" url={v.image ?? ""} onChange={(x) => setV({ ...v, image: x })} size="large" />
      </div>
      <SaveBar onSave={() => onSave(v)} />
    </Section>
  );
}

function ContactEditor({ initial, onSave }: { initial: Contact; onSave: (v: Contact) => Promise<void> }) {
  const [v, setV] = useState<Contact>(initial);
  useEffect(() => setV(initial), [initial]);
  return (
    <Section title="Contact details" id="contact-content">
      <div className="grid sm:grid-cols-2 gap-4">
        <F label="Address" value={v.address ?? ""} onChange={(x) => setV({ ...v, address: x })} className="sm:col-span-2" />
        <F label="Phone" value={v.phone ?? ""} onChange={(x) => setV({ ...v, phone: x })} />
        <F label="Email" value={v.email ?? ""} onChange={(x) => setV({ ...v, email: x })} />
        <F label="Hours" value={v.hours ?? ""} onChange={(x) => setV({ ...v, hours: x })} className="sm:col-span-2" placeholder="Mon–Sat 10am–8pm" />
      </div>
      <SaveBar onSave={() => onSave(v)} />
    </Section>
  );
}

function SeoEditor({ initial, onSave }: { initial: Seo; onSave: (v: Seo) => Promise<void> }) {
  const [v, setV] = useState<Seo>(initial);
  useEffect(() => setV(initial), [initial]);
  return (
    <Section title="SEO defaults" id="seo-content">
      <div className="grid sm:grid-cols-2 gap-4">
        <F label="Default page title" value={v.title ?? ""} onChange={(x) => setV({ ...v, title: x })} />
        <F label="Meta description" value={v.description ?? ""} onChange={(x) => setV({ ...v, description: x })} />
      </div>
      <div className="mt-4">
        <SingleImage label="Social share image (og:image)" url={v.og_image ?? ""} onChange={(x) => setV({ ...v, og_image: x })} size="large" />
      </div>
      <SaveBar onSave={() => onSave(v)} />
    </Section>
  );
}

function FooterEditor({ initial, onSave }: { initial: Footer; onSave: (v: Footer) => Promise<void> }) {
  const [v, setV] = useState<Footer>(initial);
  useEffect(() => setV(initial), [initial]);
  return (
    <Section title="Footer" id="footer-content">
      <F label="Blurb / short about" value={v.blurb ?? ""} onChange={(x) => setV({ ...v, blurb: x })} />
      <div className="mt-4"><F label="Copyright line" value={v.copyright ?? ""} onChange={(x) => setV({ ...v, copyright: x })} placeholder="© Rajmoti Studio" /></div>
      <SaveBar onSave={() => onSave(v)} />
    </Section>
  );
}

/* ============================== INSTAGRAM ============================== */
function InstagramEditor({ initial, onSave }: { initial: InstagramCms; onSave: (v: InstagramCms) => Promise<void> }) {
  const [v, setV] = useState<InstagramCms>(initial);
  useEffect(() => setV(initial), [initial]);
  const update = (patch: Partial<InstagramCms>) => setV((x) => ({ ...x, ...patch }));

  return (
    <Section title="Instagram section (homepage)" id="instagram-content">
      <p className="text-xs text-muted-foreground mb-4">
        The feed is served by LightWidget. Create a widget for {instagramHandle()} at lightwidget.com, copy the widget
        link (or the whole embed code) and paste it below — new Instagram posts then appear automatically.
      </p>
      <label className="flex items-center gap-2 text-sm mb-4">
        <input type="checkbox" checked={v.enabled !== false} onChange={(e) => update({ enabled: e.target.checked })} />
        <span>Show the Instagram section</span>
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <F
          label="LightWidget widget link or ID"
          className="sm:col-span-2"
          value={v.widget_id ?? ""}
          onChange={(x) => update({ widget_id: x })}
          placeholder="https://cdn.lightwidget.com/widgets/xxxxxxxxxxxxxxxx.html"
        />
        <F label="Eyebrow" value={v.eyebrow ?? ""} onChange={(x) => update({ eyebrow: x })} placeholder="Recently on Instagram" />
        <F label="Heading" value={v.heading ?? ""} onChange={(x) => update({ heading: x })} placeholder={instagramHandle()} />
        <F label="Description" value={v.description ?? ""} onChange={(x) => update({ description: x })} placeholder="New sessions and studio moments." />
        <F label="Follow button label" value={v.cta_label ?? ""} onChange={(x) => update({ cta_label: x })} placeholder={`Follow ${instagramHandle()}`} />
        <label className="block text-sm sm:col-span-2">
          <span className="eyebrow text-muted-foreground block mb-1">On mobile phones</span>
          <select
            value={v.mobile_mode ?? "full"}
            onChange={(e) => update({ mobile_mode: e.target.value as InstagramCms["mobile_mode"] })}
            className="w-full border border-onyx/15 px-3 py-2 bg-white"
          >
            <option value="full">Show full showcase</option>
            <option value="compact">Show compressed (shorter, keeps CTAs above the fold)</option>
            <option value="hidden">Hide on mobile (desktop only)</option>
          </select>
          <span className="text-xs text-muted-foreground mt-1 block">
            Use compressed or hidden to keep the portfolio and booking buttons most prominent on phones.
          </span>
        </label>
      </div>

      {v.widget_id && !lightwidgetUrl(v.widget_id) && (
        <p className="text-xs text-destructive mt-2">That does not look like a LightWidget link or ID.</p>
      )}
      <div className="mt-8">
        <p className="eyebrow text-muted-foreground mb-3">Preview</p>
        <div className="border border-onyx/10">
          <InstagramFeed cms={{ ...v, enabled: true }} />
        </div>
      </div>
      <SaveBar onSave={() => onSave(v)} />
    </Section>

  );
}

/* ============================== reusable UI ============================== */
function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="studio-panel scroll-mt-24">
      <h2 className="font-display text-2xl mb-6">{title}</h2>
      {children}
    </section>
  );
}

function F({ label, value, onChange, placeholder, className }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="eyebrow text-muted-foreground block mb-1">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-onyx/15 px-3 py-2" />
    </label>
  );
}

function SaveBar({ onSave }: { onSave: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  return (
    <div className="mt-6 flex justify-end">
      <button
        onClick={async () => { setSaving(true); try { await onSave(); } finally { setSaving(false); } }}
        disabled={saving}
        className="studio-primary"
      >
        {saving && <Loader2 className="size-3.5 animate-spin" />} {saving ? "Publishing…" : "Save to website"}
      </button>
    </div>
  );
}

function Repeater<T>({ label, items, onChange, render, empty }: { label: string; items: T[]; onChange: (v: T[]) => void; render: (item: T, set: (v: T) => void) => React.ReactNode; empty: T }) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <p className="eyebrow text-muted-foreground">{label}</p>
        <button onClick={() => onChange([...items, { ...(empty as any) }])} className="text-xs inline-flex items-center gap-1 border border-onyx/15 px-2 py-1 hover:border-gold">
          <Plus className="size-3" /> Add
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">None yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="flex gap-3 items-start border border-onyx/10 p-3">
              <div className="flex-1">{render(it, (nv) => onChange(items.map((x, j) => (j === i ? nv : x))))}</div>
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-destructive p-2 hover:bg-destructive/10">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SingleImage({ label, url, onChange, size }: {
  label: string;
  url: string;
  onChange: (value: string) => void;
  size?: "medium" | "large";
}) {
  return (
    <div>
      <p className="eyebrow text-muted-foreground mb-2">{label}</p>
      <div className="flex items-center gap-4">
        {url && <img src={url} alt="" className="h-20 w-28 border border-onyx/10 object-contain" />}
        {url && <button type="button" onClick={() => onChange("")}
          className="text-xs text-destructive hover:underline">Remove selection</button>}
      </div>
      <GalleryPhotoPicker size={size} onSelect={onChange} />
    </div>
  );
}
