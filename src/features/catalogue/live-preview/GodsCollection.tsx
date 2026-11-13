import { useState } from "react";
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
    id: "shrinathji",
    nameEn: "Shree Shrinathji Swaroop",
    nameGu: "શ્રીનાથજી દર્શન (ઝાંખી)",
    templeCity: "નાથદ્વારા ધામ",
    description: "Pushtimargiya divine darshan in traditional Gujarati Haveli style with lotus and gold details.",
    defaultFormat: "translight",
    imageUrl: "/deities/shrinathji.svg",
  },
  {
    id: "ganesha",
    nameEn: "Shree Siddhivinayak Ganesha",
    nameGu: "સિદ્ધિ વિનાયક ગણેશ",
    templeCity: "પ્રથમ પૂજ્ય · સિદ્ધિ ક્ષેત્ર",
    description: "Auspicious beginnings, prosperity, and blessings for home mandir and new ventures.",
    defaultFormat: "acrylic",
    imageUrl: "/deities/ganesha.svg",
  },
  {
    id: "radha-krishna",
    nameEn: "Shree Radha Krishna",
    nameGu: "શ્રી રાધા-કૃષ્ણ જુગલ જોડી",
    templeCity: "વૃંદાવન / દ્વારકા",
    description: "Devotional blessing and divine love for home mandir and living spaces.",
    defaultFormat: "translight",
    imageUrl: "/deities/radha-krishna.svg",
  },
  {
    id: "shiva-parvati",
    nameEn: "Kailash Pati Shiva Parvati",
    nameGu: "શ્રી શિવ-પાર્વતી પરિવાર",
    templeCity: "સોમનાથ / કૈલાશ",
    description: "Calm spiritual energy, trishul aura, and harmonious family blessings.",
    defaultFormat: "acrylic",
    imageUrl: "/deities/shiva-parvati.svg",
  },
  {
    id: "ram-darbar",
    nameEn: "Maryada Purushottam Ram Darbar",
    nameGu: "શ્રી રામ દરબાર (અયોધ્યા)",
    templeCity: "અયોધ્યા ધામ",
    description: "Shri Ram, Sita Mata, Lakshmanji and Hanumanji in royal divine grace.",
    defaultFormat: "frame",
    imageUrl: "/deities/ram-darbar.svg",
  },
  {
    id: "tirupati-balaji",
    nameEn: "Sri Venkateswara Balaji",
    nameGu: "શ્રી વેંકટેશ્વર બાલાજી",
    templeCity: "તિરુમાલા તિરુપતિ",
    description: "Govinda divine abundance, shankha, chakra and sacred namam blessings.",
    defaultFormat: "acrylic",
    imageUrl: "/deities/tirupati-balaji.svg",
  },
  {
    id: "umiya-mataji",
    nameEn: "Jagat Janani Maa Umiya",
    nameGu: "જગત જનની માં ઉમિયા",
    templeCity: "ઊંઝા લક્ષચંડી ધામ",
    description: "Sacred Kuldevi protection and auspicious presence for Gujarati homes.",
    defaultFormat: "translight",
    imageUrl: "/deities/umiya-mataji.svg",
  },
  {
    id: "khodiyar-mataji",
    nameEn: "Aai Shri Khodiyar Maa",
    nameGu: "આઈ શ્રી ખોડિયાર માં",
    templeCity: "માટેલ / ગળધરા ધામ",
    description: "Trishul and crocodile vahana darshan for divine guidance and grace.",
    defaultFormat: "frame",
    imageUrl: "/deities/khodiyar-mataji.svg",
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
Please confirm sanctum framing finish and delivery timeline.`,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Visual Showcase Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Product Mockup */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div
            className={`relative w-full max-w-[360px] aspect-[2/3] rounded-2xl overflow-hidden transition-all duration-500 shadow-2xl p-4 flex items-center justify-center ${
              format === "translight"
                ? "bg-[#14120E] border-4 border-amber-900/60 shadow-[0_0_60px_rgba(250,190,90,0.35)]"
                : format === "acrylic"
                  ? "bg-stone-900 border-2 border-stone-200/50 shadow-2xl"
                  : "bg-[#29251F] border-[14px] border-[#3E2718] shadow-2xl"
            }`}
          >
            {/* Glass / Acrylic Shine */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none z-10" />

            {/* Translight Glow Overlay */}
            {format === "translight" && (
              <div className="absolute inset-0 bg-radial from-amber-400/20 via-transparent to-transparent pointer-events-none z-10" />
            )}

            <img
              src={selectedDeity.imageUrl}
              alt={selectedDeity.nameEn}
              className={`size-full object-cover rounded-sm transition-all duration-500 ${
                format === "translight" ? "brightness-110 saturate-115 drop-shadow-[0_0_15px_rgba(255,215,120,0.4)]" : ""
              }`}
            />

            <div className="absolute bottom-6 inset-x-6 bg-stone-950/80 backdrop-blur-md text-center py-2 px-3 rounded-xl border border-amber-400/30 text-white z-20">
              <span className="text-[10px] uppercase font-bold text-amber-300 block tracking-wider">
                {selectedDeity.templeCity}
              </span>
              <p className="font-display font-bold text-sm text-amber-100">{selectedDeity.nameGu}</p>
            </div>
          </div>

          <p className="text-xs text-stone-500 mt-3 text-center">
            {format === "translight" && "✨ Backlit LED simulation with glowing warm sanctum illumination"}
            {format === "acrylic" && "💎 5mm Diamond-polished acrylic block with beveled edges"}
            {format === "frame" && "🖼️ Handcrafted Saurashtra teak wood frame with archival matting"}
          </p>
        </div>

        {/* Right: Customization & Deity Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <span className="text-xs uppercase font-bold text-amber-800 tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-600" /> Sacred Devotional Art
            </span>
            <h3 className="font-display text-2xl font-bold text-stone-900 mt-1">
              {selectedDeity.nameEn}
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {selectedDeity.description}
            </p>
          </div>

          {/* Deity Selector Grid */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 block">
              Choose Sacred Deity ({DEITIES.length} Available)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {DEITIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDeity(d)}
                  className={`p-2 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                    selectedDeity.id === d.id
                      ? "border-amber-700 bg-amber-50/80 font-bold text-amber-950 shadow-2xs"
                      : "border-stone-200 bg-white hover:border-stone-300 text-stone-700"
                  }`}
                >
                  <img src={d.imageUrl} alt="" className="size-8 rounded-lg object-cover shrink-0" />
                  <div className="overflow-hidden">
                    <span className="truncate block font-medium">{d.nameGu}</span>
                    <span className="text-[10px] text-stone-500 truncate block">{d.nameEn}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 block">Craftsmanship Style</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "translight", label: "LED Translight" },
                { id: "acrylic", label: "Acrylic Block" },
                { id: "frame", label: "Teak Frame" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id as any)}
                  className={`py-2 px-2.5 rounded-xl border text-center text-xs transition-all font-semibold ${
                    format === f.id
                      ? "border-amber-800 bg-stone-900 text-amber-100 shadow-2xs"
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 block">Product Size</label>
            <div className="grid grid-cols-3 gap-2">
              {["8×12 in", "12×18 in", "16×24 in"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`py-1.5 px-2 rounded-lg border text-center text-xs font-medium ${
                    size === s
                      ? "border-amber-800 bg-amber-100/70 text-amber-950 font-bold"
                      : "border-stone-200 bg-white text-stone-600"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ed-button flex items-center justify-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858] text-xs py-3 w-full shadow-xs"
            >
              <MessageCircle size={16} />
              <span>Order {selectedDeity.nameEn} on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
