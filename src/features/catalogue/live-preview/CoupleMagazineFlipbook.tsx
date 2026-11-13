import React, { useState, useEffect, useRef } from "react";
import { PageFlip } from "page-flip";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  QrCode,
  Music,
  BookOpen,
  Eye,
  Grid3X3,
  Sparkles,
  Info,
} from "lucide-react";
import { SITE, whatsappLink } from "@/lib/site";

export interface MagazineConfig {
  theme: "love_story" | "wedding" | "anniversary";
  coupleNames: string;
  specialDate: string;
  title: string;
  songUrl: string;
  customQuote: string;
  photos: string[];
}

export function CoupleMagazineFlipbook({
  onConfigChanged,
}: {
  onConfigChanged?: (config: MagazineConfig) => void;
}) {
  const [theme, setTheme] = useState<"love_story" | "wedding" | "anniversary">("love_story");
  const [coupleNames, setCoupleNames] = useState("Aarav & Riya");
  const [specialDate, setSpecialDate] = useState("24 November 2026");
  const [title, setTitle] = useState("The Story of Us");
  const [songUrl, setSongUrl] = useState("https://spotify.com");
  const [customQuote, setCustomQuote] = useState(
    "Every love story is beautiful, but ours is my favourite.",
  );
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(6);
  const [viewMode, setViewMode] = useState<"flipbook" | "flat">("flipbook");

  const bookContainerRef = useRef<HTMLDivElement>(null);
  const pageFlipInstanceRef = useRef<PageFlip | null>(null);

  const handleMultiplePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const newUrls: string[] = [];

    for (let i = 0; i < files.length && photos.length + newUrls.length < 20; i++) {
      newUrls.push(URL.createObjectURL(files[i]));
    }

    const updated = [...photos, ...newUrls];
    setPhotos(updated);
    notifyChange(updated);
  };

  const notifyChange = (updatedPhotos = photos) => {
    onConfigChanged?.({
      theme,
      coupleNames,
      specialDate,
      title,
      songUrl,
      customQuote,
      photos: updatedPhotos,
    });
  };

  // Initialize PageFlip instance
  useEffect(() => {
    if (viewMode !== "flipbook" || !bookContainerRef.current) return;

    if (pageFlipInstanceRef.current) {
      try {
        pageFlipInstanceRef.current.destroy();
      } catch (err) {
        console.warn("Error destroying previous flipbook", err);
      }
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

      pageFlip.on("init", () => {
        setTotalPages(pageFlip.getPageCount());
      });

      pageFlipInstanceRef.current = pageFlip;
    } catch (err) {
      console.warn("PageFlip initialization notice:", err);
    }

    return () => {
      if (pageFlipInstanceRef.current) {
        try {
          pageFlipInstanceRef.current.destroy();
        } catch {}
        pageFlipInstanceRef.current = null;
      }
    };
  }, [viewMode, photos.length, theme]);

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
      setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
    }
  };

  const qrCodeUrl = songUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(songUrl)}`
    : "";

  const whatsappUrl = whatsappLink(
    `Namaste ${SITE.name}! 📖 I would like to order a Personalised Couple Story Magazine:
Title: "${title}"
Couple: ${coupleNames}
Date: ${specialDate}
Photos Prepared: ${photos.length} uploaded (8–20 photo editorial package)
Music Link: ${songUrl}
Could you please confirm the digital draft timeline and pricing? Thank you!`,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header Banner */}
      <div className="bg-[#FAF7F1] border border-stone-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <span className="text-[10px] font-bold text-[#8B6D3F] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={13} /> Personalised Couple Magazine · 8–20 Photographs
          </span>
          <h3 className="font-display text-lg text-stone-900 font-semibold mt-0.5">
            Tactile Digital Page-Flip Experience
          </h3>
          <p className="text-xs text-stone-600 mt-0.5">
            Drag any page corner with your finger or mouse to flip naturally.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-stone-300 overflow-hidden bg-white p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("flipbook")}
              className={`py-1 px-2.5 rounded font-medium flex items-center gap-1 transition-colors ${
                viewMode === "flipbook"
                  ? "bg-[#29251F] text-amber-100"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <BookOpen size={12} /> 3D Flipbook
            </button>
            <button
              type="button"
              onClick={() => setViewMode("flat")}
              className={`py-1 px-2.5 rounded font-medium flex items-center gap-1 transition-colors ${
                viewMode === "flat"
                  ? "bg-[#29251F] text-amber-100"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <Grid3X3 size={12} /> Flat Spreads
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex gap-1">
            {(["love_story", "wedding", "anniversary"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTheme(t);
                  notifyChange();
                }}
                className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                  theme === t ? "bg-[#8B6D3F] text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Magazine Viewer Stage */}
      {viewMode === "flipbook" ? (
        <div className="relative mx-auto w-full max-w-[500px] min-h-[460px] bg-stone-900/5 rounded-2xl border border-stone-300 p-4 flex flex-col items-center justify-center shadow-lg overflow-hidden">
          {/* Page Counter & Corner Hint */}
          <div className="w-full flex items-center justify-between pb-2 px-1 text-xs text-stone-600">
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Sparkles size={11} /> Drag corner to turn page
            </span>
            <span className="font-semibold text-stone-700">
              Page {currentPage + 1} of {totalPages}
            </span>
          </div>

          {/* PageFlip Container */}
          <div
            ref={bookContainerRef}
            className="w-full max-w-[420px] aspect-[3/4] relative mx-auto overflow-hidden shadow-2xl rounded-md"
          >
            {/* Page 0: Hardcover Front */}
            <div
              className="magazine-page relative size-full bg-[#FAF7F1] border-r-2 border-stone-400 p-6 flex flex-col justify-between shadow-md"
              data-density="hard"
            >
              <div className="border-b-2 border-stone-900 pb-2 text-center">
                <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#B49A72]">
                  RAJMOTI EDITORIAL ARCHIVE · JETPUR
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-1 uppercase">
                  {title || "MEMORIES"}
                </h1>
                <p className="text-[10px] text-stone-600 tracking-wider uppercase mt-0.5">{specialDate}</p>
              </div>

              <div className="relative flex-1 my-3 bg-stone-200 overflow-hidden rounded shadow-inner flex items-center justify-center">
                {photos[0] ? (
                  <img src={photos[0]} alt="Magazine cover" className="size-full object-cover" />
                ) : (
                  <div className="text-center p-4 text-stone-500">
                    <Upload size={22} className="mx-auto mb-1 text-stone-400" />
                    <span className="text-xs font-semibold block">Cover Portrait</span>
                    <span className="text-[10px]">Tap 'Add Photos' below</span>
                  </div>
                )}
                <div className="absolute bottom-2 inset-x-2 bg-white/85 backdrop-blur-sm p-2 rounded text-center">
                  <span className="font-display text-sm font-bold text-stone-900">{coupleNames}</span>
                </div>
              </div>

              <div className="text-center pt-1 border-t border-stone-200">
                <p className="text-[10px] text-stone-600 italic">
                  "A lifetime of togetherness begins with one chapter"
                </p>
              </div>
            </div>

            {/* Page 1: Chapter I Left Spread */}
            <div
              className="magazine-page relative size-full bg-[#FFFCF7] p-5 flex flex-col justify-between shadow-inner"
              data-density="soft"
            >
              <div>
                <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400">
                  Chapter I · The Prelude
                </span>
                <h3 className="font-display text-lg font-semibold text-stone-900 mt-0.5">{coupleNames}</h3>
                <p className="text-[10px] text-[#B49A72] italic mt-1 leading-snug">"{customQuote}"</p>
              </div>

              <div className="my-2 flex-1 bg-stone-200 rounded overflow-hidden flex items-center justify-center">
                {photos[1] ? (
                  <img src={photos[1]} alt="Chapter photo 1" className="size-full object-cover" />
                ) : (
                  <span className="text-xs text-stone-400">Portrait 2</span>
                )}
              </div>

              <div className="text-left text-[9px] text-stone-400">Page 1</div>
            </div>

            {/* Page 2: Chapter I Right Spread */}
            <div
              className="magazine-page relative size-full bg-[#FFFCF7] p-5 flex flex-col justify-between shadow-inner"
              data-density="soft"
            >
              <div className="grid grid-cols-1 gap-2 flex-1">
                <div className="bg-stone-200 rounded overflow-hidden flex items-center justify-center">
                  {photos[2] ? (
                    <img src={photos[2]} alt="Chapter photo 2" className="size-full object-cover" />
                  ) : (
                    <span className="text-xs text-stone-400">Portrait 3</span>
                  )}
                </div>
                <div className="bg-stone-200 rounded overflow-hidden flex items-center justify-center">
                  {photos[3] ? (
                    <img src={photos[3]} alt="Chapter photo 3" className="size-full object-cover" />
                  ) : (
                    <span className="text-xs text-stone-400">Portrait 4</span>
                  )}
                </div>
              </div>

              <div className="text-right text-[9px] text-stone-400">Page 2</div>
            </div>

            {/* Page 3: Chapter II Left Spread */}
            <div
              className="magazine-page relative size-full bg-[#FFFCF7] p-5 flex flex-col justify-between shadow-inner"
              data-density="soft"
            >
              <div>
                <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400">
                  Chapter II · Golden Moments
                </span>
                <p className="text-xs text-stone-700 font-display mt-1">Celebrating our eternal vows</p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 flex-1 my-2">
                {[4, 5].map((idx) => (
                  <div key={idx} className="bg-stone-200 rounded overflow-hidden flex items-center justify-center">
                    {photos[idx] ? (
                      <img src={photos[idx]} alt={`Moment ${idx + 1}`} className="size-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-stone-400">Photo {idx + 1}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-left text-[9px] text-stone-400">Page 3</div>
            </div>

            {/* Page 4: Chapter II Right Spread */}
            <div
              className="magazine-page relative size-full bg-[#FFFCF7] p-5 flex flex-col justify-between shadow-inner"
              data-density="soft"
            >
              <div className="grid grid-cols-2 gap-1.5 flex-1 my-2">
                {[6, 7].map((idx) => (
                  <div key={idx} className="bg-stone-200 rounded overflow-hidden flex items-center justify-center">
                    {photos[idx] ? (
                      <img src={photos[idx]} alt={`Moment ${idx + 1}`} className="size-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-stone-400">Photo {idx + 1}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-right text-[9px] text-stone-400">Page 4</div>
            </div>

            {/* Page 5: Hardcover Back Cover with Music QR */}
            <div
              className="magazine-page relative size-full bg-[#29251F] text-amber-100 p-6 flex flex-col items-center justify-between text-center shadow-2xl"
              data-density="hard"
            >
              <div className="pt-1">
                <span className="text-[8px] font-bold tracking-[0.25em] uppercase text-[#B49A72]">
                  OUR SOUNDTRACK
                </span>
                <h3 className="font-display text-xl font-semibold mt-0.5">Scan to Play Our Song</h3>
                <p className="text-[10px] text-stone-400">Point your smartphone camera at the printed QR</p>
              </div>

              <div className="p-3 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Couple Song QR Code" className="size-24 object-contain" />
                ) : (
                  <QrCode size={70} className="text-stone-800" />
                )}
                <span className="text-[9px] font-bold text-stone-900 mt-1 flex items-center gap-1">
                  <Music size={11} className="text-emerald-600" /> Spotify / YouTube Link
                </span>
              </div>

              <div className="pb-1 text-center">
                <p className="text-xs font-display font-semibold">{coupleNames}</p>
                <p className="text-[9px] text-stone-400">{specialDate}</p>
                <p className="text-[8px] text-stone-500 mt-1">Archival Edition · Rajmoti Studio Jetpur</p>
              </div>
            </div>
          </div>

          {/* Accessible Turn Page Controls */}
          <button
            type="button"
            onClick={flipPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/95 shadow-md flex items-center justify-center text-stone-700 hover:bg-white transition-all z-20"
            aria-label="Previous Page"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={flipNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/95 shadow-md flex items-center justify-center text-stone-700 hover:bg-white transition-all z-20"
            aria-label="Next Page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      ) : (
        /* Flat Spread Fallback Mode */
        <div className="grid sm:grid-cols-2 gap-3 p-4 bg-stone-100 rounded-2xl border border-stone-200">
          <div className="bg-[#FAF7F1] border border-stone-300 p-4 rounded-xl shadow-xs">
            <span className="text-[9px] font-bold uppercase text-[#B49A72] block">Front Cover</span>
            <h4 className="font-display font-bold text-stone-900 text-lg mt-1">{title}</h4>
            <p className="text-xs text-stone-600">{coupleNames} · {specialDate}</p>
            <div className="aspect-[4/3] bg-stone-200 rounded mt-2 overflow-hidden">
              {photos[0] ? (
                <img src={photos[0]} alt="Cover" className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center text-xs text-stone-400">
                  Cover Photo Slot
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#29251F] text-amber-100 border border-stone-800 p-4 rounded-xl shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-bold uppercase text-[#B49A72] block">Back Cover & Song QR</span>
              <h4 className="font-display font-bold text-white text-lg mt-1">Our Soundtrack</h4>
              <p className="text-xs text-stone-400">Scannable QR code linked to your couple song</p>
            </div>
            <div className="my-2 p-2 bg-white rounded-lg self-center">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="size-20 object-contain" />
              ) : (
                <QrCode size={60} className="text-stone-800" />
              )}
            </div>
            <p className="text-[10px] text-stone-400 text-center">Printed by Rajmoti Studio · Jetpur</p>
          </div>
        </div>
      )}

      {/* Magazine Personalization Details Form */}
      <div className="p-4 bg-white border border-stone-200 rounded-2xl grid sm:grid-cols-2 gap-3 text-xs shadow-xs">
        <label>
          Magazine Headline / Title
          <input
            className="w-full border border-stone-300 rounded-lg p-2 mt-1 bg-white font-medium"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              notifyChange();
            }}
          />
        </label>

        <label>
          Couple / Family Names
          <input
            className="w-full border border-stone-300 rounded-lg p-2 mt-1 bg-white font-medium"
            value={coupleNames}
            onChange={(e) => {
              setCoupleNames(e.target.value);
              notifyChange();
            }}
          />
        </label>

        <label>
          Anniversary / Wedding Date
          <input
            className="w-full border border-stone-300 rounded-lg p-2 mt-1 bg-white"
            value={specialDate}
            onChange={(e) => {
              setSpecialDate(e.target.value);
              notifyChange();
            }}
          />
        </label>

        <label>
          Couple Song Link (Spotify or YouTube for QR)
          <input
            type="url"
            className="w-full border border-stone-300 rounded-lg p-2 mt-1 bg-white"
            value={songUrl}
            onChange={(e) => {
              setSongUrl(e.target.value);
              notifyChange();
            }}
            placeholder="https://open.spotify.com/track/..."
          />
        </label>

        <label className="sm:col-span-2">
          Dedication Quote or Vow Line
          <input
            className="w-full border border-stone-300 rounded-lg p-2 mt-1 bg-white"
            value={customQuote}
            onChange={(e) => {
              setCustomQuote(e.target.value);
              notifyChange();
            }}
          />
        </label>
      </div>

      {/* Multi-Photo Uploader (8 to 20 Photos) */}
      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-stone-800 block">
            Magazine Editorial Photographs ({photos.length}/20 selected)
          </span>
          <span className="text-[11px] text-stone-500">
            Select 8 to 20 high-resolution photos for full magazine layout.
          </span>
        </div>

        <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#29251F] text-amber-100 hover:bg-stone-800 flex items-center gap-1.5 transition-colors">
          <Upload size={13} /> Add Photos
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleMultiplePhotoUpload}
          />
        </label>
      </div>

      {/* Order via WhatsApp Direct CTA */}
      <div className="flex justify-end pt-1">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ed-button flex items-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858] text-xs font-semibold px-4 py-2 rounded-xl"
        >
          <BookOpen size={15} /> Order Couple Magazine on WhatsApp
        </a>
      </div>
    </div>
  );
}
