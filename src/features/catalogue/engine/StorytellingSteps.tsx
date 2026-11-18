import React, { useState } from "react";
import {
  Upload,
  Crop,
  Eye,
  Printer,
  Gift,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface StepDetail {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  description: string;
  highlight: string;
  badge: string;
  image: string;
}

const STEPS: StepDetail[] = [
  {
    id: 1,
    title: "Upload & Frame",
    subtitle: "Zero Server Upload · 100% Client Privacy",
    icon: Upload,
    description:
      "Select your favorite photograph directly from your phone or desktop. Your family and private moments are processed strictly in your browser and never sent to external AI servers.",
    highlight: "Client-side private processing with instant aspect ratio matching.",
    badge: "100% Private",
    image: "/products/visuals/couple-engagement-candid.jpg",
  },
  {
    id: 2,
    title: "Precision Crop & Bleed",
    subtitle: "Accurate Aspect Ratios (8×12 to 20×30)",
    icon: Crop,
    description:
      "Our calibrated previewer shows safe print zones, border bleeds, and custom matting for all 13 standard Rajmoti sizes so no heads or hands get cut during physical production.",
    highlight: "Visual print-safe guides ensure perfect edge-to-edge alignment.",
    badge: "Lab Precision",
    image: "/products/visuals/frame-teak-living-room.jpg",
  },
  {
    id: 3,
    title: "Realistic Room Preview",
    subtitle: "See Before You Buy in Indian Homes",
    icon: Eye,
    description:
      "Visualize your framed print or acrylic artwork directly on living room walls, nightstands, and teak mandir sanctums with true physical scale and natural lighting reflections.",
    highlight: "Photorealistic perspective rendering matched to actual room dimensions.",
    badge: "True Scale",
    image: "/products/visuals/acrylic-wall-art-family.jpg",
  },
  {
    id: 4,
    title: "Silver-Halide Lab Print",
    subtitle: "Fuji Crystal Archive · 50-Year Color Guarantee",
    icon: Printer,
    description:
      "Crafted at our Jetpur studio on genuine photographic paper with deep lustre and anti-reflective matte coatings. Vacuum-mounted to prevent humidity buckling over decades.",
    highlight: "Archival inks and solid wood / acrylic backing engineered for Indian climates.",
    badge: "50-Yr Longevity",
    image: "/products/visuals/album-flushmount-wedding.jpg",
  },
  {
    id: 5,
    title: "Signature Gift Box & Delivery",
    subtitle: "Midnight Teal Box · Satin Ribbon · Wax Seal Card",
    icon: Gift,
    description:
      "Every gift is packed with corner shock-absorbers, wrapped in tissue, tied with emerald satin ribbon, and accompanied by a wax-stamped personal note card ready to present.",
    highlight: "2–4 hour delivery in Jetpur or insured 48-hr courier across Saurashtra.",
    badge: "Gifting Ready",
    image: "/products/visuals/gift-box-signature-hamper.jpg",
  },
];

export function StorytellingSteps() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const current = STEPS.find((s) => s.id === activeStep) || STEPS[0];

  return (
    <section className="ed-wrap my-14 bg-gradient-to-b from-[#FBF8F3] to-[#F5EFE6] p-6 sm:p-10 rounded-3xl border border-amber-900/10 shadow-xs">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 mb-2">
          <Sparkles size={13} className="text-amber-700" />
          The Rajmoti Keepsake Journey
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-stone-900">
          From Camera Roll to Heirloom Keepsake
        </h2>
        <p className="text-sm text-stone-600 mt-2">
          How we turn your personal photos into museum-grade physical art in 5 deliberate steps.
        </p>
      </div>

      {/* Step Navigation Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-8">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = step.id === activeStep;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(step.id)}
              className={`p-3.5 rounded-2xl text-left border transition-all ${
                isActive
                  ? "bg-stone-900 text-amber-100 border-stone-900 shadow-md scale-102"
                  : "bg-white/80 hover:bg-white text-stone-700 border-stone-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isActive ? "bg-amber-800 text-amber-100" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  Step 0{step.id}
                </span>
                <Icon size={16} className={isActive ? "text-amber-400" : "text-stone-400"} />
              </div>
              <div className="font-semibold text-xs leading-snug line-clamp-1">{step.title}</div>
            </button>
          );
        })}
      </div>

      {/* Active Step Presentation Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
              {current.badge}
            </span>
            <span className="text-xs font-mono text-stone-400">Step 0{current.id} of 05</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-display font-bold text-stone-900">
            {current.title}
          </h3>
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
            {current.subtitle}
          </p>

          <p className="text-stone-600 text-sm leading-relaxed">{current.description}</p>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <span>{current.highlight}</span>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveStep((prev) => (prev < 5 ? prev + 1 : 1))}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-800 transition-colors"
            >
              <span>{activeStep === 5 ? "Restart Journey" : "Next Step"}</span>
              <ArrowRight size={14} />
            </button>
            <span className="text-[11px] text-stone-400 font-mono">
              Crafted locally in Jetpur, Gujarat
            </span>
          </div>
        </div>

        {/* Step Preview Image */}
        <div className="lg:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden border border-stone-200 shadow-md">
          <img
            src={current.image}
            alt={current.title}
            className="size-full object-cover transition-all duration-300"
          />
          <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-stone-900/80 backdrop-blur-md text-amber-100 text-[11px] font-mono flex items-center justify-between">
            <span>Rajmoti Craft Standard</span>
            <ShieldCheck size={14} className="text-amber-400" />
          </div>
        </div>
      </div>
    </section>
  );
}
