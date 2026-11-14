import { useState, useMemo } from "react";
import { Sparkles, ArrowRight, Heart, Gift, Users, Baby, Compass, CheckCircle } from "lucide-react";
import { seedProducts, type Product } from "./store";
import { calculateVariantPriceInr } from "@/lib/pricing";

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
] as const;

const OCCASIONS = [
  { id: "anniversary", label: "Anniversary" },
  { id: "birthday", label: "Birthday" },
  { id: "wedding", label: "Wedding Keepsake" },
  { id: "pooja", label: "Pooja & Housewarming" },
  { id: "anytime", label: "Just Because" },
] as const;

const BUDGETS = [
  { id: "under500", label: "Under ₹499", max: 499, min: 0 },
  { id: "mid", label: "₹500 – ₹1,499", max: 1499, min: 500 },
  { id: "premium", label: "₹1,500+", max: 99999, min: 1500 },
] as const;

function getSampleImageForProduct(prod: Product): string {
  const cat = prod.category;
  const pId = prod.id.toLowerCase();
  if (cat === "drinkware" || pId.includes("mug")) return "/products/mug-sample-couple.jpg";
  if (cat === "led" || pId.includes("translight")) return "/products/translight-sample.jpg";
  if (cat === "gods-collection" || cat === "devotional" || pId.includes("deity")) return "/deities/shrinathji.jpg";
  if (cat === "magazines" || pId.includes("mag")) return "/products/magazine-cover.jpg";
  if (cat === "acrylic") return "/products/frame-sample-anniversary.jpg";
  if (cat === "canvas") return "/products/frame-sample-family.jpg";
  if (cat === "prints") return "/products/frame-sample-baby.jpg";
  return "/products/frame-sample-wedding.jpg";
}

export function GiftFinder({ onSelectProduct, onOpenStudio }: GiftFinderProps) {
  const [recipient, setRecipient] = useState<string>("partner");
  const [occasion, setOccasion] = useState<string>("anniversary");
  const [budget, setBudget] = useState<string>("mid");

  const recommendations = useMemo(() => {
    const selectedBudget = BUDGETS.find((b) => b.id === budget) || BUDGETS[1];
    
    // Score products based on matching criteria
    const scored = seedProducts.map((prod) => {
      let score = 0;
      const prodPrice = calculateVariantPriceInr(
        prod.id,
        prod.variants[0]?.size,
        prod.variants[0]?.finish,
      );
      
      // Recipient matches
      if (recipient === "mandir" && (prod.category === "devotional" || prod.id.includes("deity") || prod.id.includes("translight"))) {
        score += 10;
      }
      if (recipient === "partner" && (prod.recipients?.includes("Partner") || prod.id.includes("mug") || prod.id.includes("mag") || prod.category === "acrylic")) {
        score += 8;
      }
      if (recipient === "family" && (prod.recipients?.includes("Family") || prod.category === "frames" || prod.category === "canvas")) {
        score += 8;
      }
      if (recipient === "baby" && (prod.name.toLowerCase().includes("baby") || prod.category === "prints" || prod.category === "frames")) {
        score += 8;
      }
      if (recipient === "friends" && (prod.category === "keychains" || prod.category === "drinkware")) {
        score += 8;
      }

      // Occasion matches
      if (occasion === "anniversary" && (prod.occasions?.includes("anniversary") || prod.category === "frames" || prod.id.includes("mag"))) {
        score += 6;
      }
      if (occasion === "birthday" && (prod.occasions?.includes("birthday") || prod.category === "drinkware" || prod.category === "keychains")) {
        score += 6;
      }
      if (occasion === "wedding" && (prod.occasions?.includes("wedding") || prod.category === "frames" || prod.id.includes("mag"))) {
        score += 6;
      }
      if (occasion === "pooja" && (prod.category === "devotional" || prod.id.includes("translight"))) {
        score += 10;
      }

      // Budget matches
      if (prodPrice >= selectedBudget.min && prodPrice <= selectedBudget.max) {
        score += 5;
      }

      return { product: prod, score, price: prodPrice };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3);
  }, [recipient, occasion, budget]);

  return (
    <div className="bg-[#FAF7F1] border border-amber-900/15 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="max-w-2xl">
        <p className="ed-kicker flex items-center gap-1.5 text-amber-900 font-semibold text-xs tracking-wider uppercase">
          <Sparkles size={14} className="text-amber-700" /> 3-Tap Gift Finder
        </p>
        <h2 className="text-2xl sm:text-3xl font-display text-stone-900 mt-1">
          Find the perfect personalized gift.
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
          Tell us who it is for and your occasion. We'll suggest our most cherished photo keepsakes.
        </p>
      </div>

      {/* 3 Step Taps */}
      <div className="mt-6 space-y-5">
        {/* Step 1: Recipient */}
        <div>
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
            1. Who is this for?
          </span>
          <div className="flex flex-wrap gap-2">
            {RECIPIENTS.map((r) => {
              const Icon = r.icon;
              const isSelected = recipient === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRecipient(r.id)}
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
            2. What is the occasion?
          </span>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => {
              const isSelected = occasion === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOccasion(o.id)}
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
            3. Target budget
          </span>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => {
              const isSelected = budget === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBudget(b.id)}
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
      </div>

      {/* Suggested Matches Results Grid */}
      <div className="mt-8 pt-6 border-t border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-stone-800 flex items-center gap-1.5 uppercase tracking-wider">
            <CheckCircle size={14} className="text-emerald-600" /> Best matches for your selection:
          </p>
          <span className="text-[11px] text-stone-500 font-medium">Ready to personalize</span>
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
                    ₹{price.toFixed(0)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (prod.category === "drinkware" || prod.id.includes("mug")) onOpenStudio?.("mugs");
                    else if (prod.category === "devotional" || prod.id.includes("deity")) onOpenStudio?.("devotional");
                    else if (prod.id.includes("translight")) onOpenStudio?.("translight");
                    else if (prod.id.includes("mag")) onOpenStudio?.("magazines");
                    else if (onSelectProduct) onSelectProduct(prod.id);
                    else onOpenStudio?.("frames");
                  }}
                  className="bg-[#29251F] text-amber-100 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-stone-900 transition-colors flex items-center gap-1"
                >
                  Personalize <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
