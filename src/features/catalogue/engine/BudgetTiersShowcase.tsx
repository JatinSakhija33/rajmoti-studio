import React, { useState } from "react";
import { ArrowRight, Tag, Sparkles, Heart, Gift, Crown } from "lucide-react";

interface BudgetTier {
  id: "under-499" | "500-1499" | "above-1500";
  title: string;
  tagline: string;
  rangeLabel: string;
  icon: React.ElementType;
  items: {
    name: string;
    price: string;
    image: string;
    bestFor: string;
    categoryFilter: string;
  }[];
}

const TIERS: BudgetTier[] = [
  {
    id: "under-499",
    title: "Everyday Keepsakes",
    tagline: "Thoughtful everyday gestures that brighten study desks and coffee tables.",
    rangeLabel: "Under ₹499",
    icon: Gift,
    items: [
      {
        name: "Personalized Magic Color-Change Mug",
        price: "₹349",
        image: "/products/visuals/mug-couple-morning.jpg",
        bestFor: "Birthdays & Secret Santa",
        categoryFilter: "drinkware",
      },
      {
        name: "Double-Sided Acrylic Keychains (Set of 2)",
        price: "₹199",
        image: "/products/visuals/flatlay-keepsakes-novelty.jpg",
        bestFor: "Anniversaries & Car Keys",
        categoryFilter: "drinkware",
      },
      {
        name: "High-Gloss Ceramic Couple Mug (11 oz)",
        price: "₹299",
        image: "/products/mug-sample-couple.jpg",
        bestFor: "Morning Chai Rituals",
        categoryFilter: "drinkware",
      },
    ],
  },
  {
    id: "500-1499",
    title: "Statement Keepsakes",
    tagline: "Medium-format wall frames, customized cushions and editorial magazines.",
    rangeLabel: "₹500 – ₹1,499",
    icon: Sparkles,
    items: [
      {
        name: "Natural Teak Table & Wall Frame (8×12 in)",
        price: "₹649",
        image: "/products/visuals/frame-teak-living-room.jpg",
        bestFor: "Anniversaries & Parents",
        categoryFilter: "frames",
      },
      {
        name: "Softcover Couple Story Magazine (24 Pages)",
        price: "₹899",
        image: "/products/magazine-cover.jpg",
        bestFor: "Pre-Wedding & Travel Trips",
        categoryFilter: "magazines",
      },
      {
        name: "Gold Accent Mandir Darshan Frame (10×14 in)",
        price: "₹799",
        image: "/products/visuals/translight-dwarkadhish-lit.jpg",
        bestFor: "Griha Pravesh & Pooja Ghar",
        categoryFilter: "gods-collection",
      },
    ],
  },
  {
    id: "above-1500",
    title: "Heirloom Masterpieces",
    tagline: "Museum-grade flush mount albums, floating acrylics, and ambient LED wall art.",
    rangeLabel: "₹1,500+",
    icon: Crown,
    items: [
      {
        name: "Flush Mount Lay-Flat Royal Wedding Album (12×18)",
        price: "₹2,899",
        image: "/products/visuals/album-flushmount-wedding.jpg",
        bestFor: "Wedding & Silver Jubilee",
        categoryFilter: "magazines",
      },
      {
        name: "Edge-to-Edge Diamond Polished Acrylic (16×24 in)",
        price: "₹1,899",
        image: "/products/visuals/acrylic-wall-art-family.jpg",
        bestFor: "Living Room Accent Wall",
        categoryFilter: "acrylic",
      },
      {
        name: "Warm LED Backlit Translight Frame (16×24 in)",
        price: "₹2,499",
        image: "/products/visuals/translight-dwarkadhish-lit.jpg",
        bestFor: "Mandir Sanctum Centerpiece",
        categoryFilter: "led",
      },
    ],
  },
];

export function BudgetTiersShowcase({
  onSelectCategory,
}: {
  onSelectCategory?: (cat: string) => void;
}) {
  const [activeTierId, setActiveTierId] = useState<BudgetTier["id"]>("500-1499");
  const currentTier = TIERS.find((t) => t.id === activeTierId) || TIERS[1];

  return (
    <section className="ed-wrap my-14">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 mb-2">
            <Tag size={13} className="text-amber-800" />
            Shop by Budget
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-stone-900">
            Thoughtful Gifts for Every Budget
          </h2>
          <p className="text-sm text-stone-600 mt-1 max-w-xl">
            From pocket-friendly daily reminders to grand multi-generation heirlooms, all handcrafted with Rajmoti archival standards.
          </p>
        </div>

        {/* Tier Selector Buttons */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-stone-100 border border-stone-200 self-start">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const isSelected = tier.id === activeTierId;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setActiveTierId(tier.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-white text-stone-900 shadow-xs border border-stone-200"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Icon size={14} className={isSelected ? "text-amber-800" : "text-stone-400"} />
                <span>{tier.rangeLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Tier Banner & Cards */}
      <div className="bg-[#FAF8F5] border border-stone-200 rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-4">
          <div>
            <h3 className="text-xl font-display font-bold text-stone-900">{currentTier.title}</h3>
            <p className="text-xs text-stone-500 mt-0.5">{currentTier.tagline}</p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 self-start">
            {currentTier.rangeLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {currentTier.items.map((item, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-900/85 backdrop-blur-xs text-white text-[11px] font-bold">
                  {item.price}
                </span>
                <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-stone-800 text-[10px] font-semibold">
                  Best for: {item.bestFor}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Archival print & custom formatting included
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">{item.price}</span>
                  <button
                    type="button"
                    onClick={() => onSelectCategory && onSelectCategory(item.categoryFilter)}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Browse</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
