import React, { useState, useRef } from "react";
import { Upload, Sparkles, Clock, ShieldCheck, Heart, Download } from "lucide-react";
import { RAJMOTI_NOVELTY_SPECS, PhysicalSizeSpec } from "./types";

export type NoveltyProductType = "clock" | "cushion" | "plaque" | "puzzle" | "keychain" | "phone_cover";

export interface GiftTemplateEngineProps {
  productType: NoveltyProductType;
  defaultPhotoUrl?: string;
  customText?: string;
  subText?: string;
  onPhotoUploaded?: (url: string) => void;
  className?: string;
}

export function GiftTemplateEngine({
  productType,
  defaultPhotoUrl = "/products/frame-sample-anniversary.jpg",
  customText = "Together Forever",
  subText = "Est. 2024",
  onPhotoUploaded,
  className = "",
}: GiftTemplateEngineProps) {
  const [photoUrl, setPhotoUrl] = useState<string>(defaultPhotoUrl);
  const [activeText, setActiveText] = useState<string>(customText);
  const [activeSubText, setActiveSubText] = useState<string>(subText);
  const [phoneModel, setPhoneModel] = useState<string>("iPhone 15 Pro");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const spec: PhysicalSizeSpec = RAJMOTI_NOVELTY_SPECS[productType] || RAJMOTI_NOVELTY_SPECS.clock;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    onPhotoUploaded?.(url);
  };

  return (
    <div className={`bg-[#FCFAF6] border border-stone-200 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 ${className}`}>
      {/* Product Spec Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
            Novelty Gift Visualizer · {spec.label} ({spec.metric})
          </span>
          <h3 className="text-xl sm:text-2xl font-display font-bold text-stone-900 capitalize mt-0.5">
            Personalized {productType.replace("_", " ")} Studio
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-stone-900 text-amber-100 text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-800 transition-colors shadow-xs"
          >
            <Upload size={14} className="text-amber-400" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* Visualizer Stage */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-gradient-to-b from-stone-100 to-stone-200/70 rounded-2xl border border-stone-300 relative overflow-hidden min-h-[360px]">
        {/* 1. CLOCK TEMPLATE */}
        {productType === "clock" && (
          <div className="relative size-64 sm:size-72 rounded-3xl bg-white shadow-2xl border-8 border-stone-800 overflow-hidden flex items-center justify-center">
            <img src={photoUrl} alt="Clock Face" className="size-full object-cover" />
            {/* Clock Overlay Glass & Vignette */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/30 pointer-events-none" />

            {/* Roman Numerals */}
            <div className="absolute top-2 inset-x-0 text-center font-display font-bold text-white text-sm drop-shadow-md">
              XII
            </div>
            <div className="absolute bottom-2 inset-x-0 text-center font-display font-bold text-white text-sm drop-shadow-md">
              VI
            </div>
            <div className="absolute right-3 inset-y-0 flex items-center font-display font-bold text-white text-sm drop-shadow-md">
              III
            </div>
            <div className="absolute left-3 inset-y-0 flex items-center font-display font-bold text-white text-sm drop-shadow-md">
              IX
            </div>

            {/* Clock Hands */}
            <div className="absolute size-3 rounded-full bg-amber-400 border-2 border-stone-900 z-20 shadow-md" />
            <div
              className="absolute w-1 h-20 bg-stone-900 rounded-full origin-bottom z-10 shadow-sm"
              style={{ transform: "rotate(45deg) translateY(-50%)" }}
            />
            <div
              className="absolute w-1.5 h-14 bg-stone-900 rounded-full origin-bottom z-10 shadow-sm"
              style={{ transform: "rotate(160deg) translateY(-50%)" }}
            />
            <div
              className="absolute w-0.5 h-24 bg-red-600 origin-bottom z-15"
              style={{ transform: "rotate(280deg) translateY(-50%)" }}
            />

            {/* Caption */}
            {activeText && (
              <div className="absolute bottom-10 inset-x-0 text-center text-white text-xs font-bold drop-shadow-md font-display">
                {activeText}
              </div>
            )}
          </div>
        )}

        {/* 2. CUSHION TEMPLATE */}
        {productType === "cushion" && (
          <div className="relative size-64 sm:size-72 rounded-[40px] bg-white shadow-2xl border-4 border-amber-900/30 overflow-hidden flex items-center justify-center transform rotate-1">
            <img src={photoUrl} alt="Velvet Cushion" className="size-full object-cover" />
            {/* Soft velvet shimmer and wrinkle shadows */}
            <div className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/40 pointer-events-none" />
            <div className="absolute inset-2 border-2 border-dashed border-white/50 rounded-[34px] pointer-events-none" />

            {activeText && (
              <div className="absolute bottom-6 inset-x-0 text-center text-white text-sm font-bold font-display drop-shadow-md">
                {activeText}
              </div>
            )}
          </div>
        )}

        {/* 3. DESK PLAQUE TEMPLATE */}
        {productType === "plaque" && (
          <div className="relative w-72 h-52 rounded-xl bg-amber-950 shadow-2xl p-3 border-4 border-amber-900/60 flex flex-col justify-between">
            <div className="relative size-full rounded-lg overflow-hidden bg-white shadow-inner">
              <img src={photoUrl} alt="Desk Plaque" className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-2 inset-x-2 text-center text-amber-100">
                <p className="font-display text-sm font-bold">{activeText}</p>
                <p className="text-[10px] text-amber-200/90">{activeSubText}</p>
              </div>
            </div>
            {/* Wooden Base stand simulation */}
            <div className="absolute -bottom-3 inset-x-8 h-4 bg-amber-900 rounded-b-md shadow-lg border-t border-amber-700" />
          </div>
        )}

        {/* 4. PUZZLE TEMPLATE */}
        {productType === "puzzle" && (
          <div className="relative w-72 h-52 rounded-lg bg-white shadow-xl overflow-hidden border border-stone-300">
            <img src={photoUrl} alt="Jigsaw Puzzle" className="size-full object-cover" />
            {/* SVG Jigsaw Grid Overlay */}
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 10px 10px, rgba(0,0,0,0.4) 2px, transparent 2px), linear-gradient(to right, rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.15) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 text-[10px] text-white font-mono">
              120 Pieces
            </div>
          </div>
        )}

        {/* 5. ACRYLIC KEYCHAIN TEMPLATE */}
        {productType === "keychain" && (
          <div className="flex flex-col items-center">
            {/* Metal Key Ring */}
            <div className="size-12 rounded-full border-4 border-stone-400 shadow-md mb-2 flex items-center justify-center">
              <div className="size-4 rounded-full border-2 border-stone-500" />
            </div>
            {/* Split Chain */}
            <div className="w-1.5 h-6 bg-stone-400 rounded-full -mt-2 mb-1" />
            {/* Acrylic Pendant */}
            <div className="relative size-36 rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl border-4 border-white/80 overflow-hidden ring-1 ring-black/10">
              <img src={photoUrl} alt="Keychain Pendant" className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-black/20 pointer-events-none" />
            </div>
            <span className="text-[10px] font-mono text-stone-500 mt-2">Double-Sided 5mm Cast Acrylic</span>
          </div>
        )}

        {/* 6. PHONE COVER TEMPLATE */}
        {productType === "phone_cover" && (
          <div className="relative w-40 h-72 rounded-[32px] bg-stone-900 p-2 shadow-2xl border-4 border-stone-700 overflow-hidden">
            <div className="relative size-full rounded-[24px] overflow-hidden bg-white">
              <img src={photoUrl} alt="Phone Cover" className="size-full object-cover" />
              {/* Camera Island Cutout */}
              <div className="absolute top-2.5 left-2.5 size-10 rounded-xl bg-stone-950/90 border border-stone-600 flex items-center justify-center p-1 shadow-md">
                <div className="grid grid-cols-2 gap-1 size-full">
                  <div className="size-3 rounded-full bg-stone-800 border border-stone-700" />
                  <div className="size-3 rounded-full bg-stone-800 border border-stone-700" />
                  <div className="size-3 rounded-full bg-stone-800 border border-stone-700" />
                  <div className="size-1.5 rounded-full bg-amber-400 self-center justify-self-center" />
                </div>
              </div>
              {/* Glossy reflection */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Customization Text Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-stone-800 block mb-1">
            Personalized Title / Message:
          </label>
          <input
            type="text"
            value={activeText}
            onChange={(e) => setActiveText(e.target.value)}
            placeholder="e.g. Together Forever"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
          />
        </div>

        {productType === "phone_cover" ? (
          <div>
            <label className="text-xs font-bold text-stone-800 block mb-1">Select Phone Model:</label>
            <select
              value={phoneModel}
              onChange={(e) => setPhoneModel(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-white"
            >
              <option value="iPhone 15 Pro">iPhone 15 Pro / Max</option>
              <option value="iPhone 14 / 13">iPhone 14 / 13</option>
              <option value="Samsung S24 Ultra">Samsung S24 Ultra</option>
              <option value="OnePlus 12">OnePlus 12 / 12R</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="text-xs font-bold text-stone-800 block mb-1">Date / Milestone Subtitle:</label>
            <input
              type="text"
              value={activeSubText}
              onChange={(e) => setActiveSubText(e.target.value)}
              placeholder="e.g. Est. 2024"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
            />
          </div>
        )}
      </div>
    </div>
  );
}
