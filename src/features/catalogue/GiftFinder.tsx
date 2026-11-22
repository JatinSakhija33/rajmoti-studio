import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  ArrowRight,
  Heart,
  Gift,
  Users,
  Baby,
  Compass,
  Briefcase,
  CheckCircle,
  SlidersHorizontal,
} from "lucide-react";
import { useProducts, type Product } from "./store";
import { minimumGiftPrice } from "./gift-pricing";


interface GiftFinderProps {
  onSelectProduct?: (productId: string) => void;
  onOpenStudio?: (studio: "frames" | "mugs" | "translight" | "devotional" | "magazines") => void;
}

const RECIPIENTS = [
  { id: "partner", label: "Partner / Spouse", icon: Heart },
  { id: "family", label: "Parents & Family", icon: Users },
  { id: "baby", label: "Baby & Kids", icon: Baby },
  { id: "friends", label: "Friends & Siblings", icon: Gift },
  { id: "mandir", label: "Home Mandir", icon: Compass },
  { id: "colleague", label: "Colleague / Corporate", icon: Briefcase },
] as const;

const OCCASIONS = [
  { id: "anniversary", label: "Anniversary" },
  { id: "birthday", label: "Birthday" },
  { id: "wedding", label: "Wedding Keepsake" },
  { id: "pooja", label: "Pooja & Housewarming" },
  { id: "appreciation", label: "Appreciation" },
  { id: "anytime", label: "Just Because" },
] as const;

const BUDGETS = [
  { id: "under500", label: "Under ₹499", max: 499, min: 0 },
  { id: "mid", label: "₹500 – ₹1,499", max: 1499, min: 500 },
  { id: "premium", label: "₹1,500+", max: 99999, min: 1500 },
] as const;

const STYLES = [
  { id: "romantic", label: "Romantic & Sentimental" },
  { id: "heritage", label: "Handcrafted & Heritage" },
  { id: "contemporary", label: "Sleek Modern Acrylic" },
  { id: "devotional", label: "Sacred & Devotional" },
  { id: "fun", label: "Fun & Cheerful" },
] as const;

function getSampleImageForProduct(prod: Product): string {
  const cat = prod.category;
  const pId = prod.id.toLowerCase();
  if (cat === "drinkware" || pId.includes("mug")) return "/products/mug-sample-couple.jpg";
  if (cat === "led" || pId.includes("translight")) return "/products/translight-sample.jpg";
  if (cat === "gods-collection" || cat === "devotional" || pId.includes("deity"))
    return "/deities/shrinathji.jpg";
  if (cat === "magazines" || pId.includes("mag")) return "/products/magazine-cover.jpg";
  if (cat === "acrylic") return "/products/frame-sample-anniversary.jpg";
  if (cat === "canvas") return "/products/frame-sample-family.jpg";
  if (cat === "prints") return "/products/frame-sample-baby.jpg";
  return "/products/frame-sample-wedding.jpg";
}

function getProductRoute(prod: Product): string { return `/gifts?product=${encodeURIComponent(prod.id)}`; }

export function GiftFinder({ onSelectProduct, onOpenStudio }: GiftFinderProps) {
  const [products] = useProducts();
  const [recipient, setRecipient] = useState<string>("partner");
  const [occasion, setOccasion] = useState<string>("anniversary");
  const [budget, setBudget] = useState<string>("mid");
  const [style, setStyle] = useState<string>("romantic");

  const recommendations = useMemo(() => {
    const selectedBudget = BUDGETS.find((b) => b.id === budget) || BUDGETS[1];

    // Score products based on matching criteria
    const scored = products.map((prod) => {
      let score = 0;
      const prodPrice = minimumGiftPrice(prod);

      // Recipient matches
      if (
        recipient === "mandir" &&
        (["devotional","gods-collection"].includes(prod.category) || prod.id.toLowerCase().includes("deity") || prod.id.toLowerCase().includes("translight"))
      ) {
        score += 12;
      }
      if (
        recipient === "partner" &&
        (prod.recipients?.includes("Partner") ||
          prod.id.toLowerCase().includes("mug") ||
          prod.id.toLowerCase().includes("mag") ||
          prod.category === "acrylic")
      ) {
        score += 8;
      }
      if (
        recipient === "family" &&
        (prod.recipients?.includes("Family") ||
          prod.category === "frames" ||
          prod.category === "canvas")
      ) {
        score += 8;
      }
      if (
        recipient === "baby" &&
        (prod.name.toLowerCase().includes("baby") ||
          prod.category === "prints" ||
          prod.category === "frames")
      ) {
        score += 8;
      }
      if (recipient === "friends" && (prod.category === "keychains" || prod.category === "drinkware")) {
        score += 8;
      }
      if (recipient === "colleague" && (prod.category === "drinkware" || prod.material === "Wood")) {
        score += 8;
      }

      // Occasion matches
      if (
        occasion === "anniversary" &&
        (prod.occasions?.some(o => o.toLowerCase() === "anniversary") || prod.category === "frames" || prod.id.toLowerCase().includes("mag"))
      ) {
        score += 6;
      }
      if (
        occasion === "birthday" &&
        (prod.occasions?.some(o => o.toLowerCase() === "birthday") ||
          prod.category === "drinkware" ||
          prod.category === "keychains")
      ) {
        score += 6;
      }
      if (
        occasion === "wedding" &&
        (prod.occasions?.includes("wedding") || prod.category === "frames" || prod.id.toLowerCase().includes("mag"))
      ) {
        score += 6;
      }
      if (occasion === "pooja" && (["devotional","gods-collection"].includes(prod.category) || prod.id.toLowerCase().includes("translight"))) {
        score += 10;
      }

      // Style matches
      if (style === "romantic" && (prod.id.toLowerCase().includes("mug") || prod.id.toLowerCase().includes("mag") || prod.occasions?.some(o => o.toLowerCase() === "anniversary"))) {
        score += 5;
      }
      if (style === "heritage" && (prod.material === "Wood" || prod.category === "frames")) {
        score += 5;
      }
      if (style === "contemporary" && (prod.category === "acrylic" || prod.material === "Acrylic")) {
        score += 5;
      }
      if (style === "devotional" && (["devotional","gods-collection"].includes(prod.category) || prod.id.toLowerCase().includes("deity"))) {
        score += 8;
      }
      if (style === "fun" && (prod.category === "keychains" || prod.category === "drinkware")) {
        score += 5;
      }

      // Budget matches
      if (prodPrice != null && prodPrice >= selectedBudget.min && prodPrice <= selectedBudget.max) {
        score += 7;
      }

      return { product: prod, score, price: prodPrice };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.filter(item => item.price != null && item.price >= selectedBudget.min && item.price <= selectedBudget.max).slice(0, 3);
  }, [recipient, occasion, budget, style, products]);

  const handleStepChange = (
    key: "recipient" | "occasion" | "budget" | "style",
    val: string,
  ) => {
    if (key === "recipient") setRecipient(val);
    if (key === "occasion") setOccasion(val);
    if (key === "budget") setBudget(val);
    if (key === "style") setStyle(val);
  };

  return (
    <div id="gift-finder" className="bg-[#FAF7F1] border border-amber-900/15 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-4xl">
        <div>
          <p className="ed-kicker flex items-center gap-1.5 text-amber-900 font-semibold text-xs tracking-wider uppercase">
            <Sparkles size={14} className="text-amber-700" /> Interactive Gift Finder
          </p>
          <h2 className="text-2xl sm:text-3xl font-display text-stone-900 mt-1">
            Find the perfect personalized keepsake.
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
            Answer 4 quick questions. We'll suggest our most cherished photo gifts tailored to your recipient, occasion, and budget.
          </p>
        </div>

        <a
          href="#all-products"
          className="text-xs font-semibold text-stone-600 hover:text-stone-950 flex items-center gap-1.5 border border-stone-300 rounded-xl px-3 py-2 bg-white self-start sm:self-auto hover:bg-stone-50 transition-colors shadow-2xs whitespace-nowrap"
        >
          <SlidersHorizontal size={13} />
          <span>Skip quiz & browse all</span>
        </a>
      </div>

      {/* 4 Step Taps */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Step 1: Recipient */}
        <div>
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
            1. Who are you buying for?
          </span>
          <div className="flex flex-wrap gap-2">
            {RECIPIENTS.map((r) => {
              const Icon = r.icon;
              const isSelected = recipient === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleStepChange("recipient", r.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-[#29251F] text-amber-100 font-bold shadow-xs"
                      : "bg-white text-stone-700 border border-stone-200 hover:border-amber-700 hover:bg-stone-50"
                  }`}
                >
                  <Icon size={14} className={isSelected ? "text-amber-400" : "text-stone-400"} />
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Occasion */}
        <div>
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
            2. What's the occasion?
          </span>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => {
              const isSelected = occasion === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => handleStepChange("occasion", o.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-[#29251F] text-amber-100 font-bold shadow-xs"
                      : "bg-white text-stone-700 border border-stone-200 hover:border-amber-700 hover:bg-stone-50"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Budget */}
        <div>
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
            3. What is your budget?
          </span>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => {
              const isSelected = budget === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleStepChange("budget", b.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-[#29251F] text-amber-100 font-bold shadow-xs"
                      : "bg-white text-stone-700 border border-stone-200 hover:border-amber-700 hover:bg-stone-50"
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Style Preference */}
        <div>
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
            4. What style do you prefer?
          </span>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => {
              const isSelected = style === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleStepChange("style", s.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-[#29251F] text-amber-100 font-bold shadow-xs"
                      : "bg-white text-stone-700 border border-stone-200 hover:border-amber-700 hover:bg-stone-50"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Suggested Matches Results Grid */}
      <div className="mt-8 pt-6 border-t border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-stone-800 flex items-center gap-1.5 uppercase tracking-wider">
            <CheckCircle size={14} className="text-emerald-600" /> Best matches for your selection:
          </p>
          <span className="text-[11px] text-stone-500 font-medium">Ready for in-browser personalization</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map(({ product: prod, price }) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-stone-200 p-4 hover:border-amber-700 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 mb-3">
                  <img
                    src={getSampleImageForProduct(prod)}
                    alt={prod.name}
                    className="size-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-xs text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {prod.material}
                  </div>
                </div>
                <h4 className="font-display font-bold text-stone-900 text-sm leading-snug">
                  {prod.name}
                </h4>
                <p className="text-stone-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                  {prod.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block font-medium">Starting from</span>
                  <span className="font-display font-bold text-stone-900 text-base">
                    ₹{price!.toFixed(0)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (prod.category === "drinkware" || prod.id.toLowerCase().includes("mug")) onOpenStudio?.("mugs");
                      else if (["devotional","gods-collection"].includes(prod.category) || prod.id.toLowerCase().includes("deity")) onOpenStudio?.("devotional");
                      else if (prod.id.toLowerCase().includes("translight")) onOpenStudio?.("translight");
                      else if (prod.id.toLowerCase().includes("mag")) onOpenStudio?.("magazines");
                      else if (onSelectProduct) onSelectProduct(prod.id);
                      else onOpenStudio?.("frames");
                    }}
                    className="bg-[#29251F] text-amber-100 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-stone-900 transition-colors flex items-center gap-1"
                  >
                    Personalize <ArrowRight size={12} />
                  </button>
                  <Link
                    to={getProductRoute(prod)}
                    className="text-xs text-stone-600 hover:text-stone-950 font-medium px-2 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

