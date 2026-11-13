import { useState } from "react";
import { Sparkles, Check, MessageCircle, ArrowRight, Sun, Moon, Frame, ShieldCheck } from "lucide-react";
import { SITE, whatsappLink } from "@/lib/site";

export type DeityFormat = "acrylic" | "frame" | "translight";

export interface RegionalDeity {
  id: string;
  nameEn: string;
  nameGu: string;
  dham: string;
  mantra: string;
  description: string;
  imageUrl: string;
  availableFormats: DeityFormat[];
  sizes: {
    acrylic: string[];
    frame: string[];
    translight: string[];
  };
}

export const REGIONAL_DEITIES: RegionalDeity[] = [
  {
    id: "dwarkadhish",
    nameEn: "Bhagwan Shri Dwarkadhish (Ranchhodrai)",
    nameGu: "શ્રી દ્વારકાધીશ રાજાધિરાજ (રણછોડરાય)",
    dham: "જગત મંદિર · દ્વારકા ધામ",
    mantra: "ૐ ક્લીં કૃષ્ણાય નમઃ · જય દ્વારકાધીશ",
    description: "Revered King of Dwarka with jewel-studded Swaroop, sacred Shankha, Chakra, Gada and holy tulsi shringar.",
    imageUrl: "/deities/shrinathji.jpg", // owner customizable
    availableFormats: ["acrylic", "frame", "translight"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
    },
  },
  {
    id: "somnath",
    nameEn: "Aadi Jyotirlinga Somnath Mahadev",
    nameGu: "પ્રથમ જ્યોતિર્લિંગ શ્રી સોમનાથ મહાદેવ",
    dham: "પ્રભાસ પાટણ · સૌરાષ્ટ્ર તીર્થ",
    mantra: "ૐ નમઃ શિવાય · હર હર મહાદેવ",
    description: "First among the twelve Jyotirlingas, overlooking the Arabian Sea in Saurashtra with silver serpent and sacred bilva shringar.",
    imageUrl: "/deities/shiva-parvati.jpg",
    availableFormats: ["acrylic", "frame", "translight"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
    },
  },
  {
    id: "khodiyar-maa",
    nameEn: "Aai Shri Khodiyar Maa",
    nameGu: "આઈ શ્રી ખોડિયાર માં",
    dham: "માટેલ / રાજપરા / ગળધરા ધામ (સૌરાષ્ટ્ર)",
    mantra: "જય આઈ ખોડિયાર માં · માઁ ખોડલ કૃપા",
    description: "Sacred Kuldevi of Saurashtra with crocodile vahana and holy trishul, bestowing eternal protection and maternal grace.",
    imageUrl: "/deities/khodiyar-mataji.jpg",
    availableFormats: ["acrylic", "frame", "translight"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
    },
  },
  {
    id: "jalaram-bapa",
    nameEn: "Pujya Jalaram Bapa (Virpur)",
    nameGu: "પરમ પૂજ્ય સંત શ્રી જલારામ બાપા",
    dham: "વીરપુર ધામ (જેતપુર સમીપ)",
    mantra: "જય જલારામ · સબસે બડી સેવા",
    description: "Beloved Saint of Virpur (just 12 km from Jetpur) known for eternal sadavrat (annadaan), compassion, and selfless devotion.",
    imageUrl: "/deities/shrinathji.jpg",
    availableFormats: ["acrylic", "frame"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in"],
    },
  },
  {
    id: "swaminarayan",
    nameEn: "Bhagwan Shree Swaminarayan",
    nameGu: "ભગવાન શ્રી સ્વામિનારાયણ",
    dham: "ગઢડા / જેતપુર અક્ષર ભુવન / વડતાલ",
    mantra: "ૐ શ્રી સ્વામિનારાયણાય નમઃ",
    description: "Spiritual sanctuary of divine peace, Akshar Purushottam darshan, and holy presence revered across Gujarat and worldwide.",
    imageUrl: "/deities/shrinathji.jpg",
    availableFormats: ["acrylic", "frame", "translight"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
    },
  },
  {
    id: "kashtabhanjan-hanuman",
    nameEn: "Shree Kashtabhanjan Dev Hanumanji",
    nameGu: "શ્રી કષ્ટભંજન દેવ હનુમાનજી મહારાજ",
    dham: "સાળંગપુર ધામ (બોટાદ, ગુજરાત)",
    mantra: "જય શ્રી કષ્ટભંજન દેવ · સાળંગપુર હનુમાન",
    description: "Dispeller of all obstacles and hardships, the miraculous golden Swaroop of Hanumanji at Sarangpur.",
    imageUrl: "/deities/ram-darbar.jpg",
    availableFormats: ["acrylic", "frame", "translight"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
    },
  },
  {
    id: "ganesha",
    nameEn: "Shree Siddhivinayak Ganesha",
    nameGu: "પ્રથમ પૂજ્ય શ્રી સિદ્ધિ વિનાયક ગણેશ",
    dham: "પ્રથમ પૂજ્ય · સિદ્ધિ ક્ષેત્ર",
    mantra: "ૐ ગં ગણપતયે નમઃ · શુભ લાભ",
    description: "Auspicious beginnings, obstacle removal, and divine prosperity for your home mandir, office, and business sanctum.",
    imageUrl: "/deities/ganesha.jpg",
    availableFormats: ["acrylic", "frame", "translight"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
    },
  },
  {
    id: "radha-krishna",
    nameEn: "Shree Radha Krishna Jugal Jodi",
    nameGu: "શ્રી રાધા-કૃષ્ણ જુગલ જોડી",
    dham: "વૃંદાવન / ગોકુલ / દ્વારકા",
    mantra: "રાધે રાધે · શ્રી કૃષ્ણઃ શરણં મમ",
    description: "Ethereal divine love, peace, and spiritual harmony for home sanctums and wedding gift keepsakes.",
    imageUrl: "/deities/radha-krishna.jpg",
    availableFormats: ["acrylic", "frame", "translight"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
    },
  },
  {
    id: "umiya-mataji",
    nameEn: "Jagat Janani Maa Umiya",
    nameGu: "જગત જનની માં ઉમિયા (ઉંઝા ધામ)",
    dham: "ઊંઝા લક્ષચંડી ધામ (ગુજરાત)",
    mantra: "જય માં ઉમિયા · કુળદેવી સદા સહાયતે",
    description: "Sacred Kuldevi of the Patidar community and thousands of Gujarati families, offering maternal blessings and prosperity.",
    imageUrl: "/deities/umiya-mataji.jpg",
    availableFormats: ["acrylic", "frame", "translight"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
    },
  },
  {
    id: "shiva-parivar",
    nameEn: "Kailash Pati Shiva Parvati Parivar",
    nameGu: "શ્રી શિવ-પાર્વતી-ગણેશ પરિવાર",
    dham: "કૈલાશ માનસરોવર / સોમનાથ",
    mantra: "ૐ ઉમામહેશ્વરાભ્યાં નમઃ",
    description: "Complete divine family portrait representing familial unity, longevity, tranquility, and auspicious blessings.",
    imageUrl: "/deities/shiva-parvati.jpg",
    availableFormats: ["acrylic", "frame", "translight"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
    },
  },
];

export function GodsCollection({ onSelectOrder }: { onSelectOrder?: (msg: string) => void }) {
  const [selectedDeityId, setSelectedDeityId] = useState<string>("dwarkadhish");
  const [format, setFormat] = useState<DeityFormat>("translight");
  const [size, setSize] = useState<string>("12×18 in");
  const [isLightOn, setIsLightOn] = useState(true);

  const deity = REGIONAL_DEITIES.find((d) => d.id === selectedDeityId) || REGIONAL_DEITIES[0];
  const availableSizes = deity.sizes[format] || ["12×18 in"];

  const handleFormatChange = (f: DeityFormat) => {
    setFormat(f);
    const newSizes = deity.sizes[f] || ["12×18 in"];
    if (!newSizes.includes(size)) {
      setSize(newSizes[0]);
    }
  };

  const whatsappMessage = `Namaste ${SITE.name}! 🙏 I would like to order a Sacred Devotional Keepake:
Deity: ${deity.nameEn} (${deity.nameGu})
Dham: ${deity.dham}
Format: ${format === "translight" ? "Backlit LED Translight Frame" : format === "acrylic" ? "Acrylic Block" : "Wood Frame"}
Size: ${size}
Please confirm available finishing and timeline. Jai Shri Krishna / Har Har Mahadev!`;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner: Regional Authenticity Notice */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-950">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-amber-800 shrink-0" />
          <span>
            <strong>Regional Devotional Collection</strong> · Dedicated sacred deity art available in acrylic, wood frame and backlit translight formats.
          </span>
        </div>
        <span className="hidden sm:inline text-[10px] font-mono uppercase bg-amber-200/60 px-2 py-0.5 rounded text-amber-900">
          Owner Certified
        </span>
      </div>

      {/* Deity Selector Tabs */}
      <div>
        <label className="text-xs font-bold text-stone-800 block mb-2">
          Select Sacred Deity / Mandir Dham (10 Available):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {REGIONAL_DEITIES.map((d) => {
            const isSelected = d.id === selectedDeityId;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setSelectedDeityId(d.id);
                  if (!d.sizes[format]?.includes(size)) {
                    setSize(d.sizes[format]?.[0] || "12×18 in");
                  }
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#29251F] text-amber-100 border-[#29251F] shadow-md ring-1 ring-amber-400/40"
                    : "bg-white text-stone-800 border-stone-200 hover:border-amber-700 hover:bg-stone-50"
                }`}
              >
                <div>
                  <span className={`text-[10px] block leading-tight font-medium ${isSelected ? "text-amber-300" : "text-amber-900"}`}>
                    {d.nameGu}
                  </span>
                  <span className="text-xs font-bold block mt-0.5 line-clamp-1">
                    {d.nameEn.split(" ")[0]} {d.nameEn.split(" ")[1] || ""}
                  </span>
                </div>
                <span className={`text-[9px] mt-2 block ${isSelected ? "text-stone-300" : "text-stone-400"}`}>
                  {d.dham.split("·")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Preview Stage & Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-[#FAF7F1] border border-stone-300 rounded-2xl p-6">
        {/* Left: Interactive Preview */}
        <div className="flex flex-col items-center justify-center">
          <div
            style={{ aspectRatio: "2 / 3" }}
            className={`relative w-full max-w-[320px] rounded-xs overflow-hidden transition-all duration-500 shadow-2xl flex items-center justify-center ${
              format === "acrylic"
                ? "border-4 border-white/80 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.25)] ring-1 ring-black/10"
                : format === "frame"
                ? "border-[16px] border-[#5A3E26] shadow-[inset_0_0_10px_rgba(0,0,0,0.7),0_20px_50px_rgba(40,20,10,0.35)]"
                : `border-[12px] border-[#0A0908] ${
                    isLightOn
                      ? "shadow-[0_0_70px_rgba(255,200,80,0.45),inset_0_0_20px_rgba(255,230,150,0.4)]"
                      : "shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]"
                  }`
            }`}
          >
            {/* Deity Sacred Image */}
            <img
              src={deity.imageUrl}
              alt={deity.nameEn}
              className={`size-full object-cover transition-all duration-700 ${
                format === "translight" && !isLightOn
                  ? "brightness-60 contrast-90"
                  : "brightness-105 contrast-105"
              }`}
            />

            {/* Acrylic Standoff Screws */}
            {format === "acrylic" && (
              <>
                <div className="absolute top-2 left-2 size-2.5 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 border border-stone-500 shadow-xs" />
                <div className="absolute top-2 right-2 size-2.5 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 border border-stone-500 shadow-xs" />
                <div className="absolute bottom-2 left-2 size-2.5 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 border border-stone-500 shadow-xs" />
                <div className="absolute bottom-2 right-2 size-2.5 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 border border-stone-500 shadow-xs" />
              </>
            )}

            {/* Translight Warm Diffusion */}
            {format === "translight" && isLightOn && (
              <div className="absolute inset-0 bg-gradient-to-t from-amber-400/25 via-transparent to-amber-200/20 pointer-events-none mix-blend-screen" />
            )}

            {/* Sacred Bottom Mantra Plaque */}
            <div className="absolute bottom-2 inset-x-3 bg-stone-950/85 backdrop-blur-xs text-amber-100 text-center py-1 px-2 rounded">
              <p className="text-[10px] font-bold tracking-wide text-amber-200">{deity.nameGu}</p>
              <p className="text-[8px] text-stone-300 font-mono mt-0.5">{deity.mantra}</p>
            </div>
          </div>

          <p className="text-[11px] text-stone-500 text-center mt-3">
            {format === "acrylic" && "High-gloss acrylic block with polished edges"}
            {format === "frame" && "Wood frame moulding with protective glass"}
            {format === "translight" && "Backlit LED translight with temple illumination"}
          </p>
        </div>

        {/* Right: Format, Size & Product Customization */}
        <div className="flex flex-col justify-between h-full space-y-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-800 block">
              {deity.dham}
            </span>
            <h3 className="font-display text-2xl font-bold text-stone-900 mt-1">
              {deity.nameEn}
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {deity.description}
            </p>
          </div>

          {/* Format Picker */}
          <div>
            <label className="text-xs font-bold text-stone-800 block mb-1.5">
              Craftsmanship Style / Format:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFormatChange("acrylic")}
                className={`py-2 px-2.5 rounded-xl border text-xs text-center transition-all ${
                  format === "acrylic"
                    ? "bg-[#29251F] text-amber-100 border-[#29251F] font-bold shadow-xs"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                }`}
              >
                <span className="block font-semibold">Bitu Acrylic</span>
                <span className="text-[9px] text-stone-400 block mt-0.5">High-Gloss Stand</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange("frame")}
                className={`py-2 px-2.5 rounded-xl border text-xs text-center transition-all ${
                  format === "frame"
                    ? "bg-[#29251F] text-amber-100 border-[#29251F] font-bold shadow-xs"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                }`}
              >
                <span className="block font-semibold">Teak Frame</span>
                <span className="text-[9px] text-stone-400 block mt-0.5">Mandir Wall</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange("translight")}
                className={`py-2 px-2.5 rounded-xl border text-xs text-center transition-all ${
                  format === "translight"
                    ? "bg-[#29251F] text-amber-100 border-[#29251F] font-bold shadow-xs"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                }`}
              >
                <span className="block font-semibold">LED Translight</span>
                <span className="text-[9px] text-stone-400 block mt-0.5">Glowing Art</span>
              </button>
            </div>
          </div>

          {/* Size Selector */}
          <div>
            <label className="text-xs font-bold text-stone-800 block mb-1.5">
              Available Sizes for {format === "acrylic" ? "Bitu Acrylic" : format === "frame" ? "Teak Frame" : "Translight"}:
            </label>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSize(sz)}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                    size === sz
                      ? "bg-amber-100 text-amber-950 border-amber-800 font-bold shadow-2xs"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Translight Light Power Switch */}
          {format === "translight" && (
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-200 text-xs">
              <span className="font-semibold text-stone-700">Internal Sanctum LED:</span>
              <button
                type="button"
                onClick={() => setIsLightOn(!isLightOn)}
                className={`py-1 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isLightOn
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-stone-200 text-stone-700"
                }`}
              >
                {isLightOn ? <Sun size={13} /> : <Moon size={13} />}
                <span>{isLightOn ? "Light Glowing (On)" : "Unlit (Off)"}</span>
              </button>
            </div>
          )}

          {/* Action: WhatsApp Inquiry */}
          <div className="pt-2">
            <a
              href={whatsappLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="ed-button flex items-center justify-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20b858] text-xs py-3 w-full shadow-xs"
            >
              <MessageCircle size={16} />
              <span>Inquire & Order {deity.nameEn.split(" ")[0]} on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
