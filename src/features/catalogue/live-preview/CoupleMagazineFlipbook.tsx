import React, { useState, useEffect, useRef } from "react";
import { PageFlip } from "page-flip";
import {
  BookOpen,
  Eye,
  Grid3X3,
  Sparkles,
  Maximize2,
  Upload,
  QrCode,
  Music,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { SITE, whatsappLink } from "@/lib/site";

export type MagazineSize = "8x11" | "8x8" | "10x10" | "12x12";
export type CoverFinish = "velvet" | "gloss" | "linen";
export type PageCountOption = 8 | 12 | 16 | 20;

export interface MagazineConfig {
  size: MagazineSize;
  coverFinish: CoverFinish;
  pageCount: PageCountOption;
  theme: "love_story" | "wedding" | "anniversary";
  coupleNames: string;
  specialDate: string;
  title: string;
  songUrl: string;
  customQuote: string;
  photos: string[];
}

export const MAGAZINE_SIZES: { id: MagazineSize; label: string; metric: string; desc: string }[] = [
  { id: "8x11", label: "8×11 in (A4 Portrait)", metric: "21×30 cm", desc: "Vogue / Harper's style vertical magazine" },
  { id: "8x8", label: "8×8 in (Square Coffee Table)", metric: "20×20 cm", desc: "Modern compact keepsake format" },
  { id: "10x10", label: "10×10 in (Luxury Square)", metric: "25×25 cm", desc: "Most popular wedding photobook" },
  { id: "12x12", label: "12×12 in (Grand Heirloom)", metric: "30×30 cm", desc: "Large format full-spread album" },
];

export const COVER_FINISHES: { id: CoverFinish; label: string; desc: string }[] = [
  { id: "velvet", label: "Hardcover Velvet Matte", desc: "Soft-touch anti-scratch tactile lamination" },
  { id: "gloss", label: "Lustre Gloss Hardcover", desc: "High-definition photographic gloss finish" },
  { id: "linen", label: "Natural Textured Linen", desc: "Embossed archival bookcloth binding" },
];

const DEFAULT_MAGAZINE_PHOTOS = [
  "/products/magazine-cover.jpg",
  "/products/frame-sample-wedding.jpg",
  "/products/frame-sample-anniversary.jpg",
  "/products/translight-sample.jpg",
  "/products/frame-sample-family.jpg",
  "/products/frame-sample-baby.jpg",
];

export function CoupleMagazineFlipbook({
  onConfigChanged,
}: {
  onConfigChanged?: (config: MagazineConfig) => void;
}) {
  const [size, setSize] = useState<MagazineSize>("8x11");
  const [coverFinish, setCoverFinish] = useState<CoverFinish>("velvet");
  const [pageCount, setPageCount] = useState<PageCountOption>(12);
  const [theme, setTheme] = useState<"love_story" | "wedding" | "anniversary">("wedding");
  const [coupleNames, setCoupleNames] = useState("Aarav & Riya");
  const [specialDate, setSpecialDate] = useState("24 November 2026");
  const [title, setTitle] = useState("A LIFETIME OF TOGETHERNESS");
  const [songUrl, setSongUrl] = useState("https://spotify.com");
  const [customQuote, setCustomQuote] = useState(
    "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.",
  );
  const [photos, setPhotos] = useState<string[]>(DEFAULT_MAGAZINE_PHOTOS);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"flipbook" | "flat">("flipbook");

  const bookContainerRef = useRef<HTMLDivElement>(null);
  const pageFlipInstanceRef = useRef<PageFlip | null>(null);

  // Initialize PageFlip instance
  useEffect(() => {
    if (viewMode !== "flipbook" || !bookContainerRef.current) return;

    if (pageFlipInstanceRef.current) {
      try {
        pageFlipInstanceRef.current.destroy();
      } catch (err) {}
      pageFlipInstanceRef.current = null;
    }

    const container = bookContainerRef.current;
    const pagesElements = container.querySelectorAll<HTMLElement>(".magazine-page");
    if (!pagesElements.length) return;

    try {
      const pageFlip = new PageFlip(container, {
        width: 320,
        height: 440,
        size: "stretch",
        minWidth: 260,
        maxWidth: 420,
        minHeight: 360,
        maxHeight: 580,
        drawShadow: true,
        flippingTime: 650,
        usePortrait: true,
        startZIndex: 10,
        autoSize: true,
        maxShadowOpacity: 0.45,
        showCover: true,
        mobileScrollSupport: false,
      });

      pageFlip.loadFromHTML(pagesElements);

      pageFlip.on("flip", (e: { data: number }) => {
        setCurrentPage(e.data);
      });

      pageFlipInstanceRef.current = pageFlip;
    } catch (err) {
      console.warn("PageFlip init notice:", err);
    }

    return () => {
      if (pageFlipInstanceRef.current) {
        try {
          pageFlipInstanceRef.current.destroy();
        } catch {}
        pageFlipInstanceRef.current = null;
      }
    };
  }, [viewMode, photos.length, theme, size, coverFinish]);

  const flipPrev = () => {
    if (pageFlipInstanceRef.current) {
      pageFlipInstanceRef.current.flipPrev();
    } else {
      setCurrentPage((p) => Math.max(0, p - 1));
    }
  };

  const flipNext = () => {
    if (pageFlipInstanceRef.current) {
      pageFlipInstanceRef.current.flipNext();
    } else {
      setCurrentPage((p) => Math.min(5, p + 1));
    }
  };

  const handleMultiplePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const newUrls: string[] = [];

    for (let i = 0; i < files.length && photos.length + newUrls.length < 20; i++) {
      newUrls.push(URL.createObjectURL(files[i]));
    }

    setPhotos([...photos, ...newUrls]);
  };

  const qrCodeUrl = songUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(songUrl)}`
    : "";

  const spineWidthMm = ((pageCount * 0.12) + 2.5).toFixed(1);

  const whatsappUrl = whatsappLink(
    `Namaste ${SITE.name}! 📖 I would like to order a Personalised Couple Story Magazine / Photobook:
Title: "${title}"
Couple: ${coupleNames}
Date: ${specialDate}
Format Size: ${size}
Cover Finish: ${coverFinish === "velvet" ? "Hardcover Velvet Matte" : coverFinish === "gloss" ? "Lustre Gloss Hardcover" : "Textured Linen Bound"}
Page Count: ${pageCount} Pages (250 GSM Matte Art Paper)
Photos Ready: ${photos.length} uploaded
Music Song QR: ${songUrl}
Please confirm production timeline and proof draft. Thank you!`,
  );

  return (
    <div className="flex flex-col gap-5">
      {/* SECTION 1: SIZE & SPECIFICATION BAR */}
      <div className="bg-[#FAF7F1] border border-stone-300 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Maximize2 size={14} className="text-amber-800" />
            <span className="text-xs font-bold text-stone-900">Select Magazine Photobook Size:</span>
          </div>
          <span className="text-[11px] font-mono text-stone-500">
            Selected: <strong className="text-amber-900">{MAGAZINE_SIZES.find((s) => s.id === size)?.label}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MAGAZINE_SIZES.map((sz) => {
            const isSelected = size === sz.id;
            return (
              <button
                key={sz.id}
                type="button"
                onClick={() => setSize(sz.id)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "bg-[#29251F] text-amber-100 border-[#29251F] shadow-xs"
                    : "bg-white text-stone-700 border-stone-200 hover:border-amber-700 hover:bg-stone-50"
                }`}
              >
                <span className="text-xs font-bold block">{sz.label}</span>
                <span className={`text-[9px] block mt-0.5 ${isSelected ? "text-amber-300" : "text-stone-400"}`}>
                  {sz.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: COVER FINISH & PAGE COUNT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-white border border-stone-200 rounded-xl">
          <label className="text-xs font-bold text-stone-800 block mb-1.5">Cover Finish:</label>
          <div className="grid grid-cols-3 gap-1.5">
            {COVER_FINISHES.map((cf) => (
              <button
                key={cf.id}
                type="button"
                onClick={() => setCoverFinish(cf.id)}
                className={`py-1.5 px-2 rounded-lg border text-center text-xs transition-all ${
                  coverFinish === cf.id
                    ? "bg-amber-100 text-amber-950 border-amber-800 font-bold shadow-2xs"
                    : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-white"
                }`}
              >
                <span className="block text-[11px] font-semibold">{cf.label.split(" ")[0]} {cf.label.split(" ")[1]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-white border border-stone-200 rounded-xl">
          <label className="text-xs font-bold text-stone-800 block mb-1.5">
            Editorial Page Count (250 GSM Matte Spreads):
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {([8, 12, 16, 20] as PageCountOption[]).map((pc) => (
              <button
                key={pc}
                type="button"
                onClick={() => setPageCount(pc)}
                className={`py-1.5 px-2 rounded-lg border text-center text-xs transition-all ${
                  pageCount === pc
                    ? "bg-[#29251F] text-amber-100 border-[#29251F] font-bold shadow-2xs"
                    : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-white"
                }`}
              >
                <span>{pc} Pages</span>
                <span className="block text-[9px] opacity-75">{pc / 2} Spreads</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: 3D PAGE-FLIP STAGE */}
      <div className="relative mx-auto w-full max-w-[500px] min-h-[470px] bg-stone-900/5 rounded-2xl border border-stone-300 p-4 flex flex-col items-center justify-between shadow-lg overflow-hidden">
        {/* Navigation & Controls */}
        <div className="w-full flex items-center justify-between pb-2 px-1 text-xs text-stone-600">
          <button
            type="button"
            onClick={flipPrev}
            className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 flex items-center gap-1 text-[11px] font-medium"
          >
            <ChevronLeft size={13} /> Prev Page
          </button>

          <span className="flex items-center gap-1 text-[11px] font-medium text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            <Sparkles size={11} /> Turn page corner to flip naturally
          </span>

          <button
            type="button"
            onClick={flipNext}
            className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 flex items-center gap-1 text-[11px] font-medium"
          >
            Next Page <ChevronRight size={13} />
          </button>
        </div>

        {/* Flipbook Container */}
        <div
          ref={bookContainerRef}
          className="w-full max-w-[420px] aspect-[3/4] relative mx-auto overflow-hidden shadow-2xl rounded-md"
        >
          {/* Page 1: Hardcover Front */}
          <div className="magazine-page relative size-full bg-[#FAF7F1] border-r-2 border-stone-400 p-6 flex flex-col justify-between shadow-md">
            <div className="border-b-2 border-stone-900 pb-2 text-center">
              <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#B49A72]">
                RAJMOTI EDITORIAL ARCHIVE · JETPUR
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-1 uppercase">
                {title || "MEMORIES"}
              </h1>
              <p className="text-[10px] text-stone-600 tracking-wider uppercase mt-0.5">
                {specialDate}
              </p>
            </div>

            <div className="relative flex-1 my-3 bg-stone-200 overflow-hidden rounded shadow-inner flex items-center justify-center">
              <img
                src={photos[0] || DEFAULT_MAGAZINE_PHOTOS[0]}
                alt="Magazine cover"
                className="size-full object-cover"
              />
              <div className="absolute bottom-2 inset-x-2 bg-white/90 backdrop-blur-xs p-2 rounded text-center">
                <span className="font-display text-sm font-bold text-stone-900">{coupleNames}</span>
              </div>
            </div>

            <div className="text-center pt-1 border-t border-stone-200">
              <p className="text-[10px] text-stone-600 italic">
                "{customQuote.slice(0, 75)}..."
              </p>
            </div>
          </div>

          {/* Page 2: Chapter I - The Prelude */}
          <div className="magazine-page relative size-full bg-[#FFFCF7] p-6 flex flex-col justify-between shadow-inner">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400">
                Chapter I · The Prelude
              </span>
              <h3 className="font-display text-lg font-semibold text-stone-900 mt-0.5">
                {coupleNames}
              </h3>
              <p className="text-[10px] text-[#B49A72] italic mt-1 leading-snug">
                "{customQuote}"
              </p>
            </div>

            <div className="my-2 flex-1 bg-stone-200 rounded overflow-hidden flex items-center justify-center">
              <img
                src={photos[1] || DEFAULT_MAGAZINE_PHOTOS[1]}
                alt="Inside portrait"
                className="size-full object-cover"
              />
            </div>

            <div className="flex justify-between items-center text-[8px] text-stone-400 font-mono pt-1 border-t border-stone-200">
              <span>RAJMOTI STUDIO</span>
              <span>02</span>
            </div>
          </div>

          {/* Page 3: Chapter II - The Vows */}
          <div className="magazine-page relative size-full bg-[#FAF7F1] p-6 flex flex-col justify-between shadow-inner">
            <div className="text-center">
              <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400">
                Chapter II · Sacred Vows
              </span>
              <h3 className="font-display text-base font-semibold text-stone-900 mt-0.5">
                Two Souls, Seven Steps
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 my-2 flex-1">
              <div className="bg-stone-200 rounded overflow-hidden">
                <img
                  src={photos[2] || DEFAULT_MAGAZINE_PHOTOS[2]}
                  alt="Wedding vow"
                  className="size-full object-cover"
                />
              </div>
              <div className="bg-stone-200 rounded overflow-hidden">
                <img
                  src={photos[3] || DEFAULT_MAGAZINE_PHOTOS[3]}
                  alt="Ceremony"
                  className="size-full object-cover"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-[8px] text-stone-400 font-mono pt-1 border-t border-stone-200">
              <span>{specialDate}</span>
              <span>03</span>
            </div>
          </div>

          {/* Page 4: Hardcover Back with Song QR */}
          <div className="magazine-page relative size-full bg-[#FAF7F1] border-l-2 border-stone-400 p-6 flex flex-col justify-between shadow-md">
            <div className="text-center pt-2">
              <span className="text-[8px] font-bold tracking-[0.25em] uppercase text-stone-400">
                A RAJMOTI STUDIO ORIGINAL
              </span>
              <h4 className="font-display text-sm font-semibold text-stone-900 mt-1">
                Scan to Play Our Song
              </h4>
            </div>

            <div className="flex flex-col items-center justify-center my-3">
              {qrCodeUrl && (
                <div className="p-2 bg-white rounded-lg shadow-sm border border-stone-200">
                  <img src={qrCodeUrl} alt="Couple Song QR" className="size-24 object-contain" />
                </div>
              )}
              <span className="text-[9px] text-stone-500 mt-2 flex items-center gap-1 font-mono">
                <Music size={10} className="text-amber-800" />
                Linked to Spotify / YouTube
              </span>
            </div>

            <div className="text-center pt-2 border-t border-stone-200 text-[8px] text-stone-400 font-mono">
              <p>Printed on 250 GSM Matte Art Paper</p>
              <p className="mt-0.5">Rajmoti Studio · Station Road, Jetpur</p>
            </div>
          </div>
        </div>

        {/* Print-Ready Metadata Card */}
        <div className="w-full mt-3 p-2.5 rounded-xl bg-white border border-stone-200 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-stone-600">
            <FileCheck size={14} className="text-emerald-700" />
            <span>Spine: <strong>{spineWidthMm} mm</strong> ({pageCount} Pages · {coverFinish})</span>
          </div>
          <span className="text-[10px] text-stone-500 font-mono">
            CMYK 300 DPI Pre-Flight Ready
          </span>
        </div>
      </div>

      {/* SECTION 4: EDITORIAL PERSONALIZATION CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
        <div>
          <label className="font-bold text-stone-800 block mb-1">Couple Names / Couple Heading:</label>
          <input
            type="text"
            value={coupleNames}
            onChange={(e) => setCoupleNames(e.target.value)}
            className="w-full border border-stone-300 rounded p-2 text-xs bg-white"
            placeholder="e.g. Aarav & Riya"
          />
        </div>

        <div>
          <label className="font-bold text-stone-800 block mb-1">Special Date / Anniversary:</label>
          <input
            type="text"
            value={specialDate}
            onChange={(e) => setSpecialDate(e.target.value)}
            className="w-full border border-stone-300 rounded p-2 text-xs bg-white"
            placeholder="e.g. 24 November 2026"
          />
        </div>

        <div>
          <label className="font-bold text-stone-800 block mb-1">Magazine Title / Header:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-stone-300 rounded p-2 text-xs bg-white"
            placeholder="e.g. A LIFETIME OF TOGETHERNESS"
          />
        </div>

        <div>
          <label className="font-bold text-stone-800 block mb-1">Couple Song Link (Generates QR Code):</label>
          <input
            type="text"
            value={songUrl}
            onChange={(e) => setSongUrl(e.target.value)}
            className="w-full border border-stone-300 rounded p-2 text-xs bg-white"
            placeholder="e.g. https://open.spotify.com/track/..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="font-bold text-stone-800 block mb-1">Custom Romantic Quote / Vow Lines:</label>
          <textarea
            value={customQuote}
            onChange={(e) => setCustomQuote(e.target.value)}
            rows={2}
            className="w-full border border-stone-300 rounded p-2 text-xs bg-white"
            placeholder="Custom romantic quote or chapter dedication..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <label className="ed-button outline cursor-pointer text-xs flex items-center gap-2 py-2.5 px-4 w-full sm:w-auto justify-center">
          <Upload size={14} />
          <span>Add More Photos ({photos.length}/20)</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleMultiplePhotoUpload}
            className="hidden"
          />
        </label>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ed-button flex items-center justify-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858] text-xs py-2.5 px-4 w-full sm:w-auto shadow-xs"
        >
          <BookOpen size={15} />
          <span>Order Magazine on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
