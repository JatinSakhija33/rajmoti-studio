import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Upload, QrCode, Music, Sparkles, BookOpen, Check } from "lucide-react";
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
  const [customQuote, setCustomQuote] = useState("Every love story is beautiful, but ours is my favourite.");
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0); // 0: Cover, 1: Spread 1, 2: Spread 2, 3: Back Cover

  const handleMultiplePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const newUrls: string[] = [];
    const limit = Math.min(20, photos.length + files.length);

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

  // Generate QR code URL using standard Google Chart / QR service or SVG
  const qrCodeUrl = songUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(songUrl)}`
    : "";

  const whatsappUrl = whatsappLink(
    `Namaste ${SITE.name}! 📖 I would like to order a Personalised Couple Magazine:
Title: "${title}"
Couple: ${coupleNames}
Date: ${specialDate}
Photos Prepared: ${photos.length} uploaded (8–20 photo package)
Music Link: ${songUrl}
Please confirm magazine pricing and digital draft review timeline.`,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header Banner */}
      <div className="bg-[#FAF7F1] border border-stone-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold text-[#8B6D3F] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={13} /> Personalised Couple Magazine · 8–20 Photographs
          </span>
          <h3 className="font-display text-lg text-stone-900 font-semibold mt-0.5">
            Interactive Digital Flipbook Designer
          </h3>
          <p className="text-xs text-stone-600 mt-0.5">
            Curate your story, vow lines, and a scannable Spotify/YouTube music QR code.
          </p>
        </div>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setTheme("love_story")}
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              theme === "love_story" ? "bg-[#29251F] text-amber-100" : "bg-stone-100 text-stone-700"
            }`}
          >
            Love Story
          </button>
          <button
            type="button"
            onClick={() => setTheme("wedding")}
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              theme === "wedding" ? "bg-[#29251F] text-amber-100" : "bg-stone-100 text-stone-700"
            }`}
          >
            Wedding
          </button>
          <button
            type="button"
            onClick={() => setTheme("anniversary")}
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              theme === "anniversary" ? "bg-[#29251F] text-amber-100" : "bg-stone-100 text-stone-700"
            }`}
          >
            Anniversary
          </button>
        </div>
      </div>

      {/* The Digital Flipbook Stage */}
      <div className="relative mx-auto w-full max-w-[460px] aspect-[3/4] bg-stone-900/5 rounded-2xl border border-stone-300 p-4 flex items-center justify-center shadow-lg">
        {/* Magazine Cover Page (Page 0) */}
        {currentPage === 0 && (
          <div className="relative size-full bg-[#FAF7F1] border border-[#EAE4DC] shadow-xl rounded-md overflow-hidden flex flex-col p-6 animate-fade-in-up">
            <div className="border-b-2 border-stone-900 pb-2 text-center">
              <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#B49A72]">
                RAJMOTI SPECIAL EDITION · JETPUR
              </span>
              <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 mt-1 uppercase">
                {title || "MEMORIES"}
              </h1>
              <p className="text-[10px] text-stone-600 tracking-wider uppercase mt-0.5">{specialDate}</p>
            </div>

            <div className="relative flex-1 my-3 bg-stone-200 overflow-hidden rounded shadow-inner flex items-center justify-center">
              {photos[0] ? (
                <img src={photos[0]} alt="Magazine cover photograph" className="size-full object-cover" />
              ) : (
                <div className="text-center p-4 text-stone-500">
                  <Upload size={24} className="mx-auto mb-1 text-stone-400" />
                  <span className="text-xs font-semibold block">Cover Photograph</span>
                  <span className="text-[10px]">Upload photos to preview</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded text-center">
                <span className="font-display text-sm font-bold text-stone-900">{coupleNames}</span>
              </div>
            </div>

            <div className="text-center pt-1 border-t border-stone-200">
              <p className="text-[10px] text-stone-600 italic">"A lifetime of togetherness begins with one chapter"</p>
            </div>
          </div>
        )}

        {/* Magazine Spread 1 (Page 1) */}
        {currentPage === 1 && (
          <div className="relative size-full bg-[#FFFCF7] border border-stone-300 shadow-xl rounded-md overflow-hidden flex flex-col p-5 animate-fade-in-up">
            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Chapter I · The Journey</span>
            <h3 className="font-display text-xl font-semibold text-stone-900 mt-1">{coupleNames}</h3>
            <p className="text-[11px] text-[#B49A72] italic mb-3">"{customQuote}"</p>

            <div className="grid grid-cols-2 gap-2 flex-1">
              <div className="bg-stone-200 rounded overflow-hidden flex items-center justify-center">
                {photos[1] ? (
                  <img src={photos[1]} alt="Spread 1" className="size-full object-cover" />
                ) : (
                  <span className="text-[10px] text-stone-500">Photo 2</span>
                )}
              </div>
              <div className="bg-stone-200 rounded overflow-hidden flex items-center justify-center">
                {photos[2] ? (
                  <img src={photos[2]} alt="Spread 2" className="size-full object-cover" />
                ) : (
                  <span className="text-[10px] text-stone-500">Photo 3</span>
                )}
              </div>
            </div>

            <div className="mt-3 text-right">
              <span className="text-[9px] text-stone-400">Page 2 — 3</span>
            </div>
          </div>
        )}

        {/* Magazine Spread 2 (Page 2) */}
        {currentPage === 2 && (
          <div className="relative size-full bg-[#FFFCF7] border border-stone-300 shadow-xl rounded-md overflow-hidden flex flex-col p-5 animate-fade-in-up">
            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Chapter II · Cherished Moments</span>
            <div className="grid grid-cols-3 gap-1.5 flex-1 my-3">
              {[3, 4, 5].map((idx) => (
                <div key={idx} className="bg-stone-200 rounded overflow-hidden flex items-center justify-center">
                  {photos[idx] ? (
                    <img src={photos[idx]} alt={`Spread ${idx}`} className="size-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-stone-400">Photo {idx + 1}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-center text-stone-600">8–20 editorial pages professionally curated and bound</p>
            <div className="mt-2 text-right">
              <span className="text-[9px] text-stone-400">Page 4 — 5</span>
            </div>
          </div>
        )}

        {/* Back Cover with Music QR (Page 3) */}
        {currentPage === 3 && (
          <div className="relative size-full bg-[#29251F] text-amber-100 shadow-xl rounded-md overflow-hidden flex flex-col items-center justify-between p-6 text-center animate-fade-in-up">
            <div className="pt-2">
              <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#B49A72]">OUR SOUNDTRACK</span>
              <h3 className="font-display text-2xl font-semibold mt-1">Scan to Play Our Song</h3>
              <p className="text-xs text-stone-400 mt-1">Point your camera to stream our special music</p>
            </div>

            {/* Generated QR Code Card */}
            <div className="p-3 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Couple Song QR Code" className="size-28 object-contain" />
              ) : (
                <QrCode size={80} className="text-stone-800" />
              )}
              <span className="text-[10px] font-bold text-stone-900 mt-1.5 flex items-center gap-1">
                <Music size={11} className="text-emerald-600" /> Scan with Phone
              </span>
            </div>

            <div className="pb-2">
              <p className="text-xs font-display font-semibold">{coupleNames}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">Printed by Rajmoti Studio · Jetpur</p>
            </div>
          </div>
        )}

        {/* Page Flip Navigation Buttons */}
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-stone-700 disabled:opacity-30 hover:bg-white"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.min(3, p + 1))}
          disabled={currentPage === 3}
          className="absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-stone-700 disabled:opacity-30 hover:bg-white"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>

        {/* Bottom Page Indicator Dots */}
        <div className="absolute bottom-1 inset-x-0 flex justify-center gap-1.5">
          {["Cover", "Spread 1", "Spread 2", "Back & Music"].map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => setCurrentPage(idx)}
              className={`size-2 rounded-full transition-all ${
                currentPage === idx ? "bg-[#B49A72] w-5" : "bg-stone-300"
              }`}
              title={label}
            />
          ))}
        </div>
      </div>

      {/* Magazine Details Form */}
      <div className="p-4 bg-white border border-stone-200 rounded-2xl grid sm:grid-cols-2 gap-3 text-xs">
        <label>
          Magazine Title
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
          Special Date
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
          Favorite Song Link (Spotify / YouTube for QR)
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
          Personal Quote or Dedication
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

      {/* Multi-Photo Uploader (Up to 20 Photos) */}
      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-stone-800 block">
            Upload Magazine Photographs ({photos.length}/20 selected)
          </span>
          <span className="text-[11px] text-stone-500">
            Select 8 to 20 photos for full multi-page editorial layout
          </span>
        </div>

        <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#29251F] text-amber-100 hover:bg-stone-800 flex items-center gap-1.5">
          <Upload size={13} /> Add Photos
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={handleMultiplePhotoUpload}
          />
        </label>
      </div>

      {/* WhatsApp Order Action */}
      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-emerald-900 block">Ready to produce your couple magazine?</span>
          <span className="text-[11px] text-emerald-700">
            A digital proof will be confirmed with you on WhatsApp before printing.
          </span>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ed-button py-2 px-4 text-xs font-semibold rounded-full bg-[#25D366] text-white border-[#25D366] hover:bg-[#20ba59] shadow-sm flex items-center gap-1.5"
        >
          Order Magazine on WhatsApp
        </a>
      </div>
    </div>
  );
}
