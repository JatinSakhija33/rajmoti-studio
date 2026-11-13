import React, { useState } from "react";
import { Sparkles, Check, MessageCircle, ArrowRight } from "lucide-react";
import { SITE, whatsappLink } from "@/lib/site";

export interface DeityItem {
  id: string;
  nameEn: string;
  nameGu: string;
  templeCity: string;
  description: string;
  defaultFormat: "acrylic" | "frame" | "translight";
  imageUrl: string;
}

export const DEITIES: DeityItem[] = [
  {
    id: "radha-krishna",
    nameEn: "Shree Radha Krishna",
    nameGu: "શ્રી રાધા-કૃષ્ણ",
    templeCity: "વૃંદાવન / દ્વારકા",
    description: "Devotional blessing and divine love for home mandir and living spaces.",
    defaultFormat: "translight",
    imageUrl: "/editorial/family-hero.png", // Clean fallback
  },
  {
    id: "srinathji",
    nameEn: "Shree Srinathji",
    nameGu: "શ્રી નાથજી (ઝાંખી)",
    templeCity: "નાથદ્વારા",
    description: "Pushtimargiya divine darshan in traditional Gujarati/Haveli style.",
    defaultFormat: "acrylic",
    imageUrl: "/editorial/gift-still-life.png",
  },
  {
    id: "ganeshji",
    nameEn: "Shree Ganeshji",
    nameGu: "સિદ્ધિ વિનાયક ગણેશ",
    templeCity: "પ્રથમ પૂજ્ય",
    description: "Auspicious beginnings, prosperity, and blessings for new homes.",
    defaultFormat: "frame",
    imageUrl: "/editorial/family-hero.png",
  },
  {
    id: "shiv-parvati",
    nameEn: "Shree Shiv Parvati",
    nameGu: "શ્રી શિવ-પાર્વતી",
    templeCity: "સોમનાથ / કૈલાશ",
    description: "Calm spiritual energy and harmonious family blessings.",
    defaultFormat: "acrylic",
    imageUrl: "/editorial/gift-still-life.png",
  },
  {
    id: "ambaji",
    nameEn: "Maa Ambaji",
    nameGu: "માં અંબા (આરાસુરી)",
    templeCity: "અંબાજી ધામ",
    description: "Shakti protection, grace, and devotional sanctum art.",
    defaultFormat: "translight",
    imageUrl: "/editorial/family-hero.png",
  },
  {
    id: "jalaram-bapa",
    nameEn: "Sant Shree Jalaram Bapa",
    nameGu: "સંત શ્રી જલારામ બાપા",
    templeCity: "વીરપુર",
    description: "Selfless service, gratitude, and devotion from Saurashtra.",
    defaultFormat: "frame",
    imageUrl: "/editorial/gift-still-life.png",
  },
  {
    id: "hanumanji",
    nameEn: "Shree Kashtbhanjan Dev",
    nameGu: "કષ્ટભંજન દેવ હનુમાનજી",
    templeCity: "સાળંગપુર ધામ",
    description: "Strength, protection, and overcoming obstacles.",
    defaultFormat: "translight",
    imageUrl: "/editorial/family-hero.png",
  },
  {
    id: "balaji",
    nameEn: "Shree Tirupati Balaji",
    nameGu: "શ્રી વેંકટેશ્વર બાલાજી",
    templeCity: "તિરુમાલા",
    description: "Divine abundance, peace, and spiritual devotion.",
    defaultFormat: "acrylic",
    imageUrl: "/editorial/gift-still-life.png",
  },
];

export function GodsCollection({ onSelectOrder }: { onSelectOrder?: (msg: string) => void }) {
  const [selectedDeity, setSelectedDeity] = useState<DeityItem>(DEITIES[0]);
  const [format, setFormat] = useState<"acrylic" | "frame" | "translight">("translight");
  const [size, setSize] = useState<string>("12×18 in");

  const whatsappUrl = whatsappLink(
    `Namaste ${SITE.name}! 🪔 I would like to order from your Devotional God's Collection:
Deity: ${selectedDeity.nameEn} (${selectedDeity.nameGu})
Product Style: ${format.toUpperCase()} (${format === "translight" ? "Backlit LED Lightbox" : format === "acrylic" ? "Bitu Diamond Acrylic" : "Heritage Teak Frame"})
Size: ${size}
Please confirm available sanctum designs and delivery timeline.`,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Devotional Banner */}
      <div className="bg-[#FAF4EA] border border-[#E8DAC2] p-4 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#9A7445]">
            સનાતન & પવિત્ર દર્શન સંગ્રહ
          </span>
          <h3 className="font-display text-lg text-stone-900 font-semibold mt-0.5">
            Devotional God's Collection · Jetpur Mandir Prints
          </h3>
          <p className="text-xs text-stone-600 mt-0.5">
            Hand-crafted Bitu acrylics, teak frames, and glowing mandir translights made with reverence.
          </p>
        </div>
      </div>

      {/* Deity Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {DEITIES.map((d) => {
          const isSelected = d.id === selectedDeity.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDeity(d)}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                isSelected
                  ? "bg-[#29251F] text-amber-100 border-[#29251F] shadow-sm"
                  : "bg-white border-stone-200 text-stone-800 hover:bg-stone-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-xs leading-tight block">{d.nameEn}</span>
                {isSelected && <Check size={13} className="text-amber-400 shrink-0" />}
              </div>
              <span className={`text-[11px] block mt-1 font-medium ${isSelected ? "text-amber-300" : "text-[#B49A72]"}`}>
                {d.nameGu}
              </span>
              <span className={`text-[9px] block ${isSelected ? "text-stone-400" : "text-stone-500"}`}>
                {d.templeCity}
              </span>
            </button>
          );
        })}
      </div>

      {/* Substrate & Sizing Selector */}
      <div className="p-4 bg-white border border-stone-200 rounded-2xl grid sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="font-semibold text-stone-800 block mb-1">Product Medium:</label>
          <div className="flex rounded-lg border border-stone-300 overflow-hidden bg-stone-50 p-0.5">
            <button
              type="button"
              onClick={() => setFormat("translight")}
              className={`flex-1 py-1.5 px-2 rounded text-[11px] font-medium transition-colors ${
                format === "translight" ? "bg-amber-600 text-white" : "text-stone-700"
              }`}
            >
              ✨ Translight LED
            </button>
            <button
              type="button"
              onClick={() => setFormat("acrylic")}
              className={`flex-1 py-1.5 px-2 rounded text-[11px] font-medium transition-colors ${
                format === "acrylic" ? "bg-[#29251F] text-white" : "text-stone-700"
              }`}
            >
              💎 Bitu Acrylic
            </button>
            <button
              type="button"
              onClick={() => setFormat("frame")}
              className={`flex-1 py-1.5 px-2 rounded text-[11px] font-medium transition-colors ${
                format === "frame" ? "bg-[#5A3E26] text-white" : "text-stone-700"
              }`}
            >
              🪵 Teak Frame
            </button>
          </div>
        </div>

        <div>
          <label className="font-semibold text-stone-800 block mb-1">Mandir Size:</label>
          <select
            className="w-full border border-stone-300 rounded-lg p-2 bg-white"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            <option value="8×12 in">8×12 in (Standard Mandir)</option>
            <option value="12×18 in">12×18 in (Grand Pooja Sanctum)</option>
            <option value="16×24 in">16×24 in (Large Mandir Wall)</option>
          </select>
        </div>
      </div>

      {/* Selected Deity Preview Plaque */}
      <div className="p-4 bg-gradient-to-r from-[#FAF7F1] to-[#F3ECE1] border border-stone-300 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold text-[#8B6D3F] uppercase tracking-wider">
            Selected Deity Artwork
          </span>
          <h4 className="font-display text-xl text-stone-900 font-semibold">
            {selectedDeity.nameEn} · {selectedDeity.nameGu}
          </h4>
          <p className="text-xs text-stone-600 mt-0.5">
            {format === "translight" ? "Glowing LED Backlight" : format === "acrylic" ? "Diamond-Polished Bitu Acrylic" : "Handcrafted Teak Wood Frame"} · {size}
          </p>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ed-button py-2.5 px-4 text-xs font-semibold rounded-full bg-[#25D366] text-white border-[#25D366] hover:bg-[#20ba59] shadow-sm flex items-center gap-1.5"
        >
          <MessageCircle size={15} /> Order Sanctum Print
        </a>
      </div>
    </div>
  );
}
