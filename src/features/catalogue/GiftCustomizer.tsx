import { Component, Suspense, lazy, useState, type ReactNode } from "react";
import type { Product, Variant } from "./store";
import { GiftDesignProvider, validateGiftFiles, type GiftDraft } from "./gift-design";
const Mug = lazy(() => import("./live-preview/ThreePhotoMug").then(m => ({ default: m.ThreePhotoMug })));
const Frame = lazy(() => import("./live-preview/FrameCollageCanvas").then(m => ({ default: m.FrameCollageCanvas })));
const Led = lazy(() => import("./live-preview/TranslightPreview").then(m => ({ default: m.TranslightPreview })));
const Album = lazy(() => import("./live-preview/CoupleMagazineFlipbook").then(m => ({ default: m.CoupleMagazineFlipbook })));
const Keychain = lazy(() => import("./live-preview/KeychainCustomizer").then(m => ({ default: m.KeychainCustomizer })));
const Phone = lazy(() => import("./live-preview/PhoneCoverCustomizer").then(m => ({ default: m.PhoneCoverCustomizer })));
const Gods = lazy(() => import("./live-preview/GodsCollection").then(m => ({ default: m.GodsCollection })));
const Photo = lazy(() => import("./PhotoPersonalizer").then(m => ({ default: m.PhotoPersonalizer })));

class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div role="status"><p>This device could not open the interactive preview. You can still fit your photo below and save the selected product.</p><Photo /></div> : this.props.children; }
}
export function GiftCustomizer({ product: p, variant: v, onChange }: { product: Product; variant: Variant; onChange: (draft: GiftDraft) => void }) {
  const [error, setError] = useState("");
  const [mode, setMode] = useState("product");
  const match = `${p.name} ${p.type}`.toLowerCase();
  const keychain = /keychain/.test(match);
  const phone = /phone.*(cover|case)|mobile.*(cover|case)/.test(match);
  const mug = p.category === "drinkware" && /mug/.test(match);
  const led = p.category === "led";
  const frame = ["frames", "acrylic", "canvas", "gods-collection"].includes(p.category);
  const album = ["albums", "magazines"].includes(p.category);
  const dimensions = v.size.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)/);
  const view = mode === "devotional" ? <Gods /> :
    keychain ? <Keychain /> : phone ? <Phone /> : mug ? <Mug lockType mugType={/magic|colour-changing/.test(match) ? "magic" : /black/.test(match) ? "black" : "white"} /> : led ? <Led lockSize size={v.size} /> : album ? <Album /> : frame ? <Frame lockSize size={v.size} finish={p.category === "acrylic" ? "acrylic" : p.category === "canvas" ? "canvas" : /sparkle/.test(match) ? "sparkle" : "teak"} /> : <Photo targetWidthInches={Number(dimensions?.[1] || 8)} targetHeightInches={Number(dimensions?.[2] || 12)} aspectRatio={dimensions ? `${dimensions[1]} / ${dimensions[2]}` : "2 / 3"} />;
  return <div className="gift-customizer" data-gift-uploads="local" onChangeCapture={e => {
    const input = e.target as HTMLInputElement;
    if (input.type !== "file") return;
    const message = validateGiftFiles(Array.from(input.files || [])); setError(message);
    if (message) { e.stopPropagation(); input.value = ""; }
  }}>
    {(frame || led) && <div className="gift-preview-tabs"><button aria-pressed={mode === "product"} onClick={() => setMode("product")}>Product preview</button><button aria-pressed={mode === "devotional"} onClick={() => setMode("devotional")}>Devotional artwork</button></div>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <GiftDesignProvider onChange={onChange}><Suspense fallback={<p role="status">Opening your interactive studio…</p>}><PreviewBoundary key={`${p.id}-${mode}`}>{view}</PreviewBoundary></Suspense></GiftDesignProvider>
    <p className="ed-footnote">Sample photographs illustrate the design. Your original product, size and finish remain the order selection. Preview finishes and extra design options require studio confirmation.</p>
  </div>;
}
