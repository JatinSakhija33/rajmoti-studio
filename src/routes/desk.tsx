import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  RefreshCw,
  ShieldCheck,
  IndianRupee,
  Download,
  Search,
  AlertTriangle,
  Clock,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  Package,
  Layers,
  Archive,
  ChevronRight,
  Plus,
  Eye,
} from "lucide-react";
import { DeskNav } from "@/components/desk-nav";
import { whatsappLink, waMessage, telLink } from "@/lib/site";

const stages = ["received", "editing", "review", "printing", "framing", "ready", "delivered", "cancelled"] as const;
const printSizes = [
  "4×6",
  "6×8",
  "8×12",
  "10×14",
  "12×18",
  "14×20",
  "16×24",
  "18×24",
  "20×30",
  "35×45 mm passport",
  "Custom",
];

const checks = {
  original_preserved: "Original files safely protected; no overwriting of source images",
  identity_preserved: "Faces, expressions, pose, clothing and body proportions strictly preserved",
  print_spec_verified: "Print size, resolution, bleed margin, crop and colours verified for output",
  customer_details_verified: "Customer names, dates, tithi and custom Gujarati text verified with client",
} as const;

type ReviewKey = keyof typeof checks;

type Job = {
  id: string;
  source: string;
  customer_name: string;
  phone: string;
  service_type: string;
  preferred_date: string;
  status: string;
  notes: string;
  created_at: string;
  quoted_total: number;
  paid_amount: number;
  payment_status: string;
  payment_reference: string;
  photo_count: number;
  items_json: string;
  delivered_at?: string;
  archive_verified_at?: string;
  requested_size: string;
  priority: string;
  due_date: string;
  editing_instructions: string;
  memorial_json: string;
  review_json: string;
  customization_json?: string;
  public_ref?: string;
};

type InventoryItem = {
  id: string;
  name: string;
  category: "Frames" | "Paper" | "Substrates" | "Gift items";
  inStock: number;
  minThreshold: number;
  unit: string;
};

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: "frame-8x12", name: "8×12 Teak Wooden Frame", category: "Frames", inStock: 8, minThreshold: 3, unit: "pcs" },
  { id: "frame-12x18", name: "12×18 Heritage Teak Frame", category: "Frames", inStock: 5, minThreshold: 2, unit: "pcs" },
  { id: "frame-16x24", name: "16×24 Large Wall Frame", category: "Frames", inStock: 2, minThreshold: 2, unit: "pcs" },
  { id: "paper-luster", name: "Luster Photo Paper (260gsm)", category: "Paper", inStock: 4, minThreshold: 1, unit: "rolls" },
  { id: "paper-matte", name: "Fine Art Cotton Matte", category: "Paper", inStock: 2, minThreshold: 1, unit: "rolls" },
  { id: "acrylic-8x12", name: "8×12 Clear Acrylic Block", category: "Substrates", inStock: 6, minThreshold: 3, unit: "pcs" },
  { id: "mugs-white", name: "White Ceramic Photo Mugs", category: "Gift items", inStock: 14, minThreshold: 5, unit: "pcs" },
  { id: "canvas-roll", name: "Archival Canvas Fabric", category: "Substrates", inStock: 3, minThreshold: 1, unit: "rolls" },
];

export const Route = createFileRoute("/desk")({
  head: () => ({
    meta: [
      { title: "Owner Work Desk — Rajmoti Studio OS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Desk,
});

function rupees(paise: number) {
  return (Number(paise || 0) / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

function parseRupees(s: string) {
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN;
}

function Desk() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [usage, setUsage] = useState<{ bytes: number; limitBytes: number; photoCount: number } | null>(null);
  const [selected, setSelected] = useState<Job | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [primaryBackup, setPrimaryBackup] = useState(false);
  const [secondaryBackup, setSecondaryBackup] = useState(false);
  const [total, setTotal] = useState("");
  const [paid, setPaid] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [stage, setStage] = useState("received");
  const [size, setSize] = useState("");
  const [priority, setPriority] = useState("normal");
  const [due, setDue] = useState("");
  const [instructions, setInstructions] = useState("");
  const [memorial, setMemorial] = useState({ name: "", date: "", tithi: "" });
  const [review, setReview] = useState<Record<ReviewKey, boolean>>({
    original_preserved: false,
    identity_preserved: false,
    print_spec_verified: false,
    customer_details_verified: false,
  });
  const [showIntake, setShowIntake] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("rajmoti:inventory");
      return saved ? JSON.parse(saved) : DEFAULT_INVENTORY;
    } catch {
      return DEFAULT_INVENTORY;
    }
  });

  const [intake, setIntake] = useState({
    name: "",
    phone: "",
    type: "Restoration",
    requested_size: "8×12",
    priority: "normal",
    due_date: "",
    editing_instructions: "",
    memorial_name: "",
    memorial_date: "",
    memorial_tithi: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/owner/orders", { credentials: "same-origin", cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw Error(data.error || "Unable to access the owner work desk");
      setJobs(data.orders || []);
      try {
        const ur = await fetch("/api/owner/usage", { credentials: "same-origin", cache: "no-store" });
        if (ur.ok) setUsage(await ur.json());
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to retrieve orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) {
      setPhotoIds([]);
      return;
    }
    setPrimaryBackup(false);
    setSecondaryBackup(false);
    setStage(selected.status);
    setSize(selected.requested_size || "");
    setPriority(selected.priority || "normal");
    setDue(selected.due_date || "");
    setInstructions(selected.editing_instructions || "");
    try {
      setMemorial({ ...{ name: "", date: "", tithi: "" }, ...JSON.parse(selected.memorial_json || "{}") });
    } catch {
      setMemorial({ name: "", date: "", tithi: "" });
    }
    try {
      setReview({
        ...{ original_preserved: false, identity_preserved: false, print_spec_verified: false, customer_details_verified: false },
        ...JSON.parse(selected.review_json || "{}"),
      });
    } catch {
      setReview({ original_preserved: false, identity_preserved: false, print_spec_verified: false, customer_details_verified: false });
    }
    setTotal((Number(selected.quoted_total || 0) / 100).toFixed(2));
    setPaid((Number(selected.paid_amount || 0) / 100).toFixed(2));
    setReference(selected.payment_reference || "");
    setNotes(selected.notes || "");
    let active = true;
    void fetch("/api/owner/orders/" + encodeURIComponent(selected.id), { credentials: "same-origin" })
      .then((r) => r.json())
      .then((v) => {
        if (active) setPhotoIds((v.photos || []).map((p: { id: string }) => p.id));
      })
      .catch(() => {
        if (active) setPhotoIds([]);
      });
    return () => {
      active = false;
    };
  }, [selected?.id]);

  const shown = useMemo(
    () =>
      jobs.filter(
        (j) =>
          (status === "all" || j.status === status) &&
          [j.customer_name, j.phone, j.id, j.service_type, j.notes]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [jobs, status, query],
  );

  // Deterministic "What should I work on next?" engine
  const nextPriority = useMemo(() => {
    const active = jobs.filter((j) => !["delivered", "cancelled"].includes(j.status));
    if (!active.length) return null;
    const todayStr = new Date().toISOString().slice(0, 10);
    const scored = active.map((j) => {
      let score = 0;
      if (j.due_date) {
        if (j.due_date < todayStr) score += 100; // Overdue
        else if (j.due_date === todayStr) score += 60; // Due today
      }
      if (j.priority === "urgent") score += 40;
      else if (j.priority === "high") score += 20;
      else if (j.priority === "low") score -= 10;

      if (j.status === "review") score += 25;
      else if (j.status === "printing" || j.status === "framing") score += 20;
      else if (j.status === "editing") score += 15;
      return { job: j, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.job || null;
  }, [jobs]);

  // Key morning operational counts
  const todayStr = new Date().toISOString().slice(0, 10);
  const dueTodayCount = jobs.filter((j) => j.due_date === todayStr && !["delivered", "cancelled"].includes(j.status)).length;
  const overdueCount = jobs.filter((j) => j.due_date && j.due_date < todayStr && !["delivered", "cancelled"].includes(j.status)).length;
  const pendingEditingCount = jobs.filter((j) => j.status === "editing").length;
  const printingQueueCount = jobs.filter((j) => j.status === "printing").length;
  const readyCount = jobs.filter((j) => j.status === "ready").length;
  const pendingBalanceTotal = jobs
    .filter((j) => j.status !== "cancelled")
    .reduce((s, j) => s + Math.max(0, (Number(j.quoted_total) || 0) - (Number(j.paid_amount) || 0)), 0);

  // Apply a walk-in preset
  const applyPreset = (preset: "passport" | "restoration" | "memorial" | "gifting" | "baby") => {
    const today = new Date().toISOString().slice(0, 10);
    if (preset === "passport") {
      setIntake({
        name: "",
        phone: "",
        type: "Passport photo",
        requested_size: "35×45 mm passport",
        priority: "urgent",
        due_date: today,
        editing_instructions: "Urgent 8-copy passport sheet. Neutral white studio background. Crisp crop.",
        memorial_name: "",
        memorial_date: "",
        memorial_tithi: "",
      });
    } else if (preset === "restoration") {
      setIntake({
        name: "",
        phone: "",
        type: "Restoration",
        requested_size: "8×12",
        priority: "normal",
        due_date: "",
        editing_instructions: "Old photo restoration and scratch removal. Carefully preserve facial features and expression.",
        memorial_name: "",
        memorial_date: "",
        memorial_tithi: "",
      });
    } else if (preset === "memorial") {
      setIntake({
        name: "",
        phone: "",
        type: "Memorial portrait",
        requested_size: "12×18",
        priority: "high",
        due_date: "",
        editing_instructions: "Memorial portrait with prayer lines. Verify Gujarati name and tithi with family before final print.",
        memorial_name: "",
        memorial_date: "",
        memorial_tithi: "",
      });
    } else if (preset === "gifting") {
      setIntake({
        name: "",
        phone: "",
        type: "Gifting",
        requested_size: "8×12",
        priority: "normal",
        due_date: "",
        editing_instructions: "Personalized teak frame photo keepsake. Check border bleed.",
        memorial_name: "",
        memorial_date: "",
        memorial_tithi: "",
      });
    } else if (preset === "baby") {
      setIntake({
        name: "",
        phone: "",
        type: "Baby portrait",
        requested_size: "8×12",
        priority: "normal",
        due_date: "",
        editing_instructions: "Milestone portrait session. Soft warm tone grading.",
        memorial_name: "",
        memorial_date: "",
        memorial_tithi: "",
      });
    }
    setShowIntake(true);
  };

  const updateInventoryCount = (id: string, delta: number) => {
    const updated = inventory.map((item) => {
      if (item.id === id) {
        return { ...item, inStock: Math.max(0, item.inStock + delta) };
      }
      return item;
    });
    setInventory(updated);
    try {
      localStorage.setItem("rajmoti:inventory", JSON.stringify(updated));
    } catch {}
  };

  async function save() {
    if (!selected) return;
    const quoted_total = parseRupees(total);
    const paid_amount = parseRupees(paid);
    if (!Number.isSafeInteger(quoted_total) || !Number.isSafeInteger(paid_amount) || paid_amount > quoted_total) {
      setError("Enter valid amounts; received payment cannot exceed the quoted total.");
      return;
    }
    if (paid_amount > 0 && !reference.trim()) {
      setError("Please record the verified bank/UPI transaction reference number (UTR/IMPS).");
      return;
    }

    // Check if moving to ready/delivered without required checks
    const required: ReviewKey[] = ["original_preserved", "identity_preserved", "print_spec_verified", "customer_details_verified"];
    if ((stage === "ready" || stage === "delivered") && required.some((k) => !review[k])) {
      setError("All 4 before/after review checklist items must be verified before marking Ready or Delivered.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/owner/orders/" + encodeURIComponent(selected.id), {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: stage,
          quoted_total,
          paid_amount,
          payment_reference: reference,
          notes,
          requested_size: size,
          priority,
          due_date: due,
          editing_instructions: instructions,
          memorial,
          review,
        }),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error || "Could not save");
      setNotice("Job updated successfully. Ledger and production status synchronized.");
      await load();
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function createWalkIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/owner/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...intake, clientRequestId: crypto.randomUUID() }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error || "Could not save walk-in job");
      setNotice("Walk-in job created and added to the production queue.");
      setShowIntake(false);
      setIntake({
        name: "",
        phone: "",
        type: "Restoration",
        requested_size: "8×12",
        priority: "normal",
        due_date: "",
        editing_instructions: "",
        memorial_name: "",
        memorial_date: "",
        memorial_tithi: "",
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Intake failed");
    } finally {
      setSaving(false);
    }
  }

  async function verifyArchive() {
    if (!selected || selected.status !== "delivered" || !primaryBackup || !secondaryBackup) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/owner/orders/" + encodeURIComponent(selected.id) + "/archive", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryBackupVerified: true, secondaryBackupVerified: true, confirmation: "TWO BACKUPS VERIFIED" }),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error || "Could not verify backups");
      setNotice("Dual backups recorded. Cloud copies stay protected until 30 days after delivery and deliberate deletion.");
      setSelected(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Archive verification failed");
    } finally {
      setSaving(false);
    }
  }

  async function purgeCloudPhotos() {
    if (!selected || !selected.archive_verified_at) return;
    const typed = window.prompt(
      "To purge cloud copies after retention, type DELETE CLOUD COPIES. Do this ONLY after confirming both studio backups.",
    );
    if (typed !== "DELETE CLOUD COPIES") return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/owner/orders/" + encodeURIComponent(selected.id) + "/purge", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: typed }),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error || "Unable to delete copies");
      setNotice(`${result.deleted} temporary cloud photographs deleted. Verified local archives are safely preserved.`);
      setSelected(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cleanup failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="desk-app min-h-dvh bg-[#FAF7F1] text-[#29251F]">
      <DeskNav active="overview" />

      {/* Header */}
      <header className="desk-workflow-heading border-b border-[#EAE4DC] p-5 md:px-10 flex flex-wrap items-center justify-between gap-4 bg-[#FFFCF7]">
        <div>
          <p className="uppercase text-[11px] font-semibold tracking-[0.22em] text-[#B49A72]">
            Rajmoti Studio · Private Operating System
          </p>
          <h1 className="font-display text-2xl md:text-3xl mt-1 text-[#29251F]">
            Studio Operations <em>& Production Desk</em>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInventory(!showInventory)}
            className="desk-light-btn text-xs font-semibold"
          >
            <Layers size={15} />
            <span>{showInventory ? "Hide Supplies" : "Supplies & Frames"}</span>
          </button>
          <button onClick={() => void load()} className="desk-light-btn text-xs" aria-label="Refresh jobs">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-5 md:p-8">
        {notice && (
          <div role="status" className="bg-[#EDF4EB] text-[#34533A] border border-[#CEDECB] p-4 rounded-xl mb-5 text-sm flex items-center gap-2">
            <CheckCircle2 size={17} />
            <span>{notice}</span>
          </div>
        )}
        {error && (
          <div role="alert" className="bg-[#FFF0EB] text-[#853B24] border border-[#EFD3C9] p-4 rounded-xl mb-5 text-sm flex items-center gap-2">
            <AlertTriangle size={17} />
            <span>{error}</span>
          </div>
        )}

        {/* Executive Morning Overview Cards */}
        <section aria-label="Morning Operations Overview" className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
          <div className="bg-white border border-[#EAE4DC] rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Today's Deadlines</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display text-3xl font-semibold text-stone-900">{dueTodayCount}</span>
              {overdueCount > 0 && (
                <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                  {overdueCount} Overdue
                </span>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#EAE4DC] rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">In Production</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display text-3xl font-semibold text-stone-900">
                {pendingEditingCount + printingQueueCount}
              </span>
              <span className="text-xs text-stone-500">
                ({pendingEditingCount} edit, {printingQueueCount} print)
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#EAE4DC] rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Ready for Pickup</p>
            <p className="font-display text-3xl font-semibold text-emerald-800 mt-2">{readyCount}</p>
          </div>

          <div className="bg-white border border-[#EAE4DC] rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Uncollected Balance</p>
            <p className="font-display text-2xl font-semibold text-amber-900 mt-2">{rupees(pendingBalanceTotal)}</p>
          </div>

          <div className="bg-white border border-[#EAE4DC] rounded-2xl p-4 shadow-sm col-span-2 lg:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Cloud Photo Quota</p>
            <p className="font-display text-xl font-semibold text-stone-800 mt-2">
              {usage ? `${(usage.bytes / 1000000).toFixed(1)} MB` : "Checking…"}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5">Under 2.0 GB free limit</p>
          </div>
        </section>

        {/* "What Should I Work On Next?" Engine */}
        {nextPriority && (
          <section className="bg-gradient-to-r from-[#F4EFE6] to-[#EAE2D5] border border-[#DDD3C4] rounded-2xl p-5 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-full bg-[#B49A72]/20 flex items-center justify-center text-[#8B6D3F] shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B6D3F]">
                  Next Recommended Action (Smart Prioritization)
                </p>
                <h3 className="font-display text-lg text-stone-900 mt-0.5">
                  {nextPriority.status === "review"
                    ? `Review client proof with ${nextPriority.customer_name}`
                    : nextPriority.status === "printing" || nextPriority.status === "framing"
                      ? `Complete printing/framing for ${nextPriority.customer_name} (${nextPriority.service_type})`
                      : `Edit ${nextPriority.service_type} for ${nextPriority.customer_name}`}
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Priority: <strong className="uppercase">{nextPriority.priority}</strong> · Due:{" "}
                  <strong>{nextPriority.due_date || "As scheduled"}</strong> · Status: {nextPriority.status}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelected(nextPriority)}
              className="ed-button py-2.5 px-5 text-xs font-semibold rounded-full bg-[#29251F] text-amber-100 shadow-sm"
            >
              Open This Job <ChevronRight size={14} />
            </button>
          </section>
        )}

        {/* Studio Supplies Tracker Sub-Panel */}
        {showInventory && (
          <section className="bg-white border border-[#EAE4DC] rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display text-xl font-semibold text-stone-900">Studio Supplies & Frame Inventory</h3>
                <p className="text-xs text-stone-500">Track molding, paper rolls, and acrylic materials for daily printing</p>
              </div>
              <button onClick={() => setShowInventory(false)} className="text-xs text-stone-500 hover:text-stone-800">
                Done
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {inventory.map((item) => {
                const isLow = item.inStock <= item.minThreshold;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border ${isLow ? "bg-amber-50/70 border-amber-300" : "bg-stone-50/60 border-stone-200"}`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[10px] font-semibold text-stone-500 uppercase">{item.category}</span>
                      {isLow && <span className="text-[9px] font-bold text-amber-800 bg-amber-200/70 px-1.5 py-0.5 rounded">Low</span>}
                    </div>
                    <p className="text-xs font-semibold text-stone-800 mt-1 truncate">{item.name}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-display text-xl font-bold text-stone-900">
                        {item.inStock} <span className="text-xs font-normal text-stone-500">{item.unit}</span>
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateInventoryCount(item.id, -1)}
                          className="size-7 rounded bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 flex items-center justify-center text-xs"
                          aria-label={`Decrease ${item.name}`}
                        >
                          -
                        </button>
                        <button
                          onClick={() => updateInventoryCount(item.id, 1)}
                          className="size-7 rounded bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 flex items-center justify-center text-xs"
                          aria-label={`Increase ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Walk-in Intake Bar & Presets */}
        <section className="bg-white border border-[#EAE4DC] rounded-2xl mb-6 overflow-hidden shadow-sm">
          <div className="px-5 py-4 flex flex-wrap justify-between items-center gap-3 border-b border-stone-100">
            <div>
              <strong className="text-base text-stone-900 font-display">New Walk-in Job Intake</strong>
              <p className="text-xs text-stone-500 mt-0.5">Quickly register customers walking into the Jetpur studio</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-stone-500 hidden sm:inline">Quick Presets:</span>
              <button onClick={() => applyPreset("passport")} className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100">
                📸 Passport (15m)
              </button>
              <button onClick={() => applyPreset("restoration")} className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100">
                🖼️ Restoration
              </button>
              <button onClick={() => applyPreset("memorial")} className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100">
                🕯️ Memorial
              </button>
              <button onClick={() => applyPreset("gifting")} className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100">
                🎁 Frame/Keepsake
              </button>
              <button
                onClick={() => setShowIntake(!showIntake)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#29251F] text-amber-100 hover:bg-stone-800"
              >
                {showIntake ? "Close Form" : "+ Open Intake"}
              </button>
            </div>
          </div>

          {showIntake && (
            <form className="p-6 grid sm:grid-cols-2 gap-4 text-sm bg-[#FFFCF7]" onSubmit={(e) => void createWalkIn(e)}>
              <label>
                Customer name
                <input
                  className="w-full border border-stone-300 rounded-xl p-2.5 mt-1 bg-white"
                  required
                  minLength={2}
                  value={intake.name}
                  onChange={(e) => setIntake({ ...intake, name: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                />
              </label>

              <label>
                WhatsApp / Mobile number
                <input
                  className="w-full border border-stone-300 rounded-xl p-2.5 mt-1 bg-white"
                  required
                  type="tel"
                  value={intake.phone}
                  onChange={(e) => setIntake({ ...intake, phone: e.target.value })}
                  placeholder="+91 94290 70317"
                />
              </label>

              <label>
                Service template
                <select
                  className="w-full border border-stone-300 rounded-xl p-2.5 mt-1 bg-white"
                  value={intake.type}
                  onChange={(e) => setIntake({ ...intake, type: e.target.value })}
                >
                  {[
                    "Passport photo",
                    "Restoration",
                    "Memorial portrait",
                    "Background replacement",
                    "Family collage",
                    "Baby portrait",
                    "Gifting",
                    "Wedding",
                    "Other",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>

              <label>
                Print size preset
                <select
                  className="w-full border border-stone-300 rounded-xl p-2.5 mt-1 bg-white"
                  value={intake.requested_size}
                  onChange={(e) => setIntake({ ...intake, requested_size: e.target.value })}
                >
                  {printSizes.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>

              <label>
                Priority
                <select
                  className="w-full border border-stone-300 rounded-xl p-2.5 mt-1 bg-white"
                  value={intake.priority}
                  onChange={(e) => setIntake({ ...intake, priority: e.target.value })}
                >
                  {["low", "normal", "high", "urgent"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>

              <label>
                Delivery deadline
                <input
                  className="w-full border border-stone-300 rounded-xl p-2.5 mt-1 bg-white"
                  type="date"
                  value={intake.due_date}
                  onChange={(e) => setIntake({ ...intake, due_date: e.target.value })}
                />
              </label>

              <label className="sm:col-span-2">
                Editing / Studio instructions
                <textarea
                  rows={2}
                  className="w-full border border-stone-300 rounded-xl p-2.5 mt-1 bg-white"
                  value={intake.editing_instructions}
                  onChange={(e) => setIntake({ ...intake, editing_instructions: e.target.value })}
                  placeholder="Strictly preserve facial characteristics; specify crop, background, or customer requirements…"
                />
              </label>

              {intake.type === "Memorial portrait" && (
                <div className="sm:col-span-2 p-4 bg-amber-50/70 border border-amber-200 rounded-xl grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 text-xs font-semibold text-amber-900 uppercase tracking-wider">
                    Memorial Portrait Fields (Gujarati)
                  </div>
                  <label>
                    Exact name (Gujarati or English)
                    <input
                      className="w-full border border-stone-300 rounded-lg p-2 mt-1 bg-white font-medium"
                      value={intake.memorial_name}
                      onChange={(e) => setIntake({ ...intake, memorial_name: e.target.value })}
                      placeholder="e.g. સ્વ. રમેશભાઈ પટેલ"
                    />
                  </label>
                  <label>
                    Date of death
                    <input
                      className="w-full border border-stone-300 rounded-lg p-2 mt-1 bg-white"
                      value={intake.memorial_date}
                      onChange={(e) => setIntake({ ...intake, memorial_date: e.target.value })}
                      placeholder="e.g. 12-11-2026"
                    />
                  </label>
                  <label className="sm:col-span-2">
                    Tithi & Prayer lines
                    <input
                      className="w-full border border-stone-300 rounded-lg p-2 mt-1 bg-white font-medium"
                      value={intake.memorial_tithi}
                      onChange={(e) => setIntake({ ...intake, memorial_tithi: e.target.value })}
                      placeholder="e.g. કારતક સુદ પૂનમ · ઓમ શાંતિ"
                    />
                  </label>
                </div>
              )}

              <p className="sm:col-span-2 text-xs text-stone-500">
                Safety policy: Originals are never overwritten. Facial features, expressions, and proportions are never altered without express written consent.
              </p>

              <button
                type="submit"
                className="sm:col-span-2 py-3 rounded-xl bg-[#29251F] text-white font-semibold text-sm hover:bg-stone-800 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? "Creating job record…" : "Save Walk-in Job"}
              </button>
            </form>
          )}
        </section>

        {/* Toolbar: Search, Filters & Export */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <label className="flex items-center bg-white border border-stone-300 rounded-xl px-3 flex-1 gap-2 shadow-sm">
            <Search size={16} className="text-stone-400" />
            <input
              className="w-full py-2.5 outline-none text-sm bg-transparent"
              placeholder="Search by customer name, phone, or job reference…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter by production stage"
            className="bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-sm shadow-sm font-medium"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All stages ({jobs.length})</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {s} ({jobs.filter((j) => j.status === s).length})
              </option>
            ))}
          </select>
          <a
            href="/api/owner/export"
            className="desk-light-btn text-xs font-semibold whitespace-nowrap"
            download="rajmoti-orders-backup.json"
          >
            <Download size={14} /> Export JSON
          </a>
        </div>

        {/* Main 2-Column Workflow Area */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
          {/* Left: Job List */}
          <section className="bg-white border border-[#EAE4DC] rounded-2xl overflow-hidden shadow-sm">
            <div className="border-b border-stone-100 p-4 flex justify-between items-center bg-stone-50/50">
              <strong className="text-sm font-display text-stone-900">Active Jobs & Enquiries</strong>
              <span className="text-xs text-stone-500">{shown.length} shown</span>
            </div>

            {loading ? (
              <p className="p-8 text-center text-stone-500 text-sm">Loading studio database…</p>
            ) : !shown.length ? (
              <div className="p-12 text-center text-stone-500">
                <Package size={32} className="mx-auto mb-2 text-stone-300" />
                <p className="text-sm font-medium">No jobs matching this filter.</p>
                <p className="text-xs mt-1">Walk-in jobs and online enquiries will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {shown.map((j) => {
                  const isSelected = selected?.id === j.id;
                  const balance = Math.max(0, (Number(j.quoted_total) || 0) - (Number(j.paid_amount) || 0));
                  return (
                    <button
                      key={j.id}
                      onClick={() => setSelected(j)}
                      className={`w-full text-left p-4.5 transition-colors hover:bg-stone-50/80 ${
                        isSelected ? "bg-[#FAF2E6] border-l-4 border-l-[#B49A72]" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <strong className="text-sm font-semibold text-stone-900">{j.customer_name}</strong>
                          <span className="text-xs text-stone-500 ml-2 font-mono">{j.phone}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            j.status === "ready"
                              ? "bg-emerald-100 text-emerald-800"
                              : j.status === "delivered"
                                ? "bg-stone-100 text-stone-600"
                                : j.status === "editing"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {j.status}
                        </span>
                      </div>

                      <p className="text-xs text-stone-700 mt-1">
                        <strong>{j.service_type}</strong> · Size: {j.requested_size || "Standard"} · Priority:{" "}
                        <span className="uppercase text-[10px]">{j.priority}</span>
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-stone-100/60 text-[11px] text-stone-500">
                        <span>Due: {j.due_date || j.preferred_date || "Not set"}</span>
                        <span>
                          Total: {rupees(j.quoted_total)}
                          {balance > 0 ? (
                            <span className="text-amber-800 ml-1 font-semibold">(Due: {rupees(balance)})</span>
                          ) : (
                            <span className="text-emerald-700 ml-1">✓ Paid</span>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right: Job Detail, Review, Payment & Archival Panel */}
          <aside className="bg-white border border-[#EAE4DC] rounded-2xl p-6 shadow-sm sticky top-24">
            {!selected ? (
              <div className="text-center py-12 text-stone-500">
                <Clock size={32} className="mx-auto mb-2 text-stone-300" />
                <p className="text-sm font-medium">Select a job from the queue</p>
                <p className="text-xs text-stone-400 mt-1">
                  Manage stages, verify payments, review proofs, and coordinate delivery.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#B49A72]">
                      Ref: {selected.id.slice(0, 8).toUpperCase()}
                    </span>
                    <h2 className="font-display text-2xl font-semibold text-stone-900 mt-0.5">
                      {selected.customer_name}
                    </h2>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {selected.service_type} · {selected.phone}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <a
                      href={whatsappLink(waMessage.customerFollowUp(selected.customer_name), selected.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      title="Send WhatsApp Follow-up"
                    >
                      <MessageCircle size={16} />
                    </a>
                    <a
                      href={telLink(selected.phone)}
                      className="p-2 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200"
                      title="Call Customer"
                    >
                      📞
                    </a>
                  </div>
                </div>

                {/* Stage Picker */}
                <label className="block text-xs font-semibold text-stone-700">
                  Production Stage
                  <select
                    className="w-full border border-stone-300 rounded-xl p-2.5 mt-1 text-sm bg-white font-medium"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                  >
                    {stages.map((x) => (
                      <option value={x} key={x}>
                        {x.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Specs: Size, Priority, Deadline */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className="font-medium text-stone-700">
                    Print Size
                    <select
                      className="w-full border border-stone-300 rounded-lg p-2 mt-1 bg-white"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    >
                      <option value="">Pending</option>
                      {printSizes.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>

                  <label className="font-medium text-stone-700">
                    Priority
                    <select
                      className="w-full border border-stone-300 rounded-lg p-2 mt-1 bg-white"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      {["low", "normal", "high", "urgent"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>

                  <label className="col-span-2 font-medium text-stone-700">
                    Due Date
                    <input
                      type="date"
                      className="w-full border border-stone-300 rounded-lg p-2 mt-1 bg-white"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                    />
                  </label>
                </div>

                {/* Instructions */}
                <label className="block text-xs font-medium text-stone-700">
                  Editing Instructions
                  <textarea
                    rows={2}
                    className="w-full border border-stone-300 rounded-xl p-2.5 mt-1 text-xs bg-white"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Instructions for studio editor / retoucher…"
                  />
                </label>

                {/* Memorial specifics */}
                {selected.service_type === "Memorial portrait" && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
                    <p className="font-bold text-amber-900">Memorial Gujarati Details</p>
                    <input
                      className="w-full border rounded p-1.5 bg-white font-medium"
                      value={memorial.name}
                      onChange={(e) => setMemorial({ ...memorial, name: e.target.value })}
                      placeholder="Gujarati name"
                    />
                    <input
                      className="w-full border rounded p-1.5 bg-white font-medium"
                      value={memorial.tithi}
                      onChange={(e) => setMemorial({ ...memorial, tithi: e.target.value })}
                      placeholder="Tithi & prayers"
                    />
                  </div>
                )}

                {/* Live Customization Specification (if placed via Gifting Suite) */}
                {selected.customization_json && selected.customization_json !== "{}" && (
                  <div className="border border-amber-900/15 rounded-xl p-3.5 bg-[#FAF7F1] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-amber-700" /> Live Customization Specs
                      </span>
                      {selected.public_ref && (
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-stone-200 text-[11px] font-semibold">
                          {selected.public_ref}
                        </span>
                      )}
                    </div>
                    <pre className="text-[11px] text-stone-700 bg-white/80 p-2.5 rounded border border-stone-200 overflow-x-auto font-mono whitespace-pre-wrap">
                      {(() => {
                        try {
                          const parsed = JSON.parse(selected.customization_json);
                          return Object.entries(parsed)
                            .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
                            .join("\n");
                        } catch {
                          return selected.customization_json;
                        }
                      })()}
                    </pre>
                  </div>
                )}

                {/* Customer Uploaded Files */}
                <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/50">
                  <p className="text-xs font-semibold text-stone-800 mb-2">
                    Private Customer Photographs ({photoIds.length})
                  </p>
                  {photoIds.length === 0 ? (
                    <p className="text-xs text-stone-400">No photos uploaded by customer yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {photoIds.map((id, i) => (
                        <a
                          key={id}
                          href={"/api/owner/orders/" + selected.id + "/photos/" + id}
                          target="_blank"
                          rel="noreferrer"
                          className="border border-stone-300 bg-white px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-stone-50"
                        >
                          <Download size={13} className="text-stone-500" />
                          Photo {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Ledger */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2.5">
                  <div className="flex justify-between items-center font-semibold text-stone-800">
                    <span>Payment Verification</span>
                    <span className="font-mono text-stone-600">
                      Balance: {rupees(Math.max(0, parseRupees(total || "0") - parseRupees(paid || "0")))}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label>
                      Quoted Total (₹)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full border border-stone-300 rounded-lg p-1.5 mt-1 bg-white font-medium"
                        value={total}
                        onChange={(e) => setTotal(e.target.value)}
                      />
                    </label>
                    <label>
                      Verified Paid (₹)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full border border-stone-300 rounded-lg p-1.5 mt-1 bg-white font-medium"
                        value={paid}
                        onChange={(e) => setPaid(e.target.value)}
                      />
                    </label>
                  </div>
                  <label>
                    Bank/UPI Reference (UTR / IMPS ID)
                    <input
                      className="w-full border border-stone-300 rounded-lg p-1.5 mt-1 bg-white"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Only after checking bank statement"
                    />
                  </label>
                </div>

                {/* Mandatory Review Checklist */}
                <div className="border border-stone-200 rounded-xl p-3.5 bg-white text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-stone-900">
                    <Eye size={14} className="text-[#B49A72]" />
                    <span>Before / After Review Checklist</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Required by studio policy before marking Ready or Delivered:
                  </p>
                  {(Object.entries(checks) as [ReviewKey, string][]).map(([k, label]) => (
                    <label key={k} className="flex items-start gap-2 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded text-[#29251F]"
                        checked={review[k]}
                        onChange={(e) => setReview({ ...review, [k]: e.target.checked })}
                      />
                      <span className={review[k] ? "text-stone-800" : "text-stone-500"}>{label}</span>
                    </label>
                  ))}
                </div>

                {/* Save Button */}
                <button
                  disabled={saving}
                  onClick={() => void save()}
                  className="w-full py-3 rounded-xl bg-[#29251F] text-amber-100 font-semibold text-sm hover:bg-stone-800 transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? "Saving Changes…" : "Update Job Record"}
                </button>

                {/* 1-Click WhatsApp Quick Actions */}
                <div className="pt-2 border-t border-stone-100 flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                    Quick WhatsApp Messages to Customer
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={whatsappLink(waMessage.customerReady(selected.customer_name, selected.service_type), selected.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-center py-2 px-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium hover:bg-emerald-100"
                    >
                      "Order is Ready"
                    </a>
                    <a
                      href={whatsappLink(
                        `Namaste ${selected.customer_name}, this is Rajmoti Studio. Your balance of ${rupees(
                          Math.max(0, parseRupees(total || "0") - parseRupees(paid || "0")),
                        )} can be settled upon collection. Thank you!`,
                        selected.phone,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-center py-2 px-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-medium hover:bg-amber-100"
                    >
                      "Balance Reminder"
                    </a>
                  </div>
                </div>

                {/* Verified Double-Backup & Cloud Retention */}
                <div className="border-t border-stone-100 pt-3 text-xs space-y-2">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <Archive size={14} className="text-stone-500" /> Local Backup & Archival
                  </span>
                  {selected.archive_verified_at ? (
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs">
                      ✓ Two independent backups verified on {new Date(selected.archive_verified_at).toLocaleDateString("en-IN")}.
                      {selected.status === "delivered" && (
                        <button
                          onClick={() => void purgeCloudPhotos()}
                          className="mt-2 text-xs font-semibold text-red-700 underline block"
                        >
                          Purge cloud copies (30 days post-delivery)
                        </button>
                      )}
                    </div>
                  ) : selected.status === "delivered" ? (
                    <div className="p-2.5 bg-stone-50 rounded-lg space-y-1.5 border border-stone-200">
                      <label className="flex items-center gap-2 text-[11px]">
                        <input
                          type="checkbox"
                          checked={primaryBackup}
                          onChange={(e) => setPrimaryBackup(e.target.checked)}
                        />
                        <span>Studio computer archive verified</span>
                      </label>
                      <label className="flex items-center gap-2 text-[11px]">
                        <input
                          type="checkbox"
                          checked={secondaryBackup}
                          onChange={(e) => setSecondaryBackup(e.target.checked)}
                        />
                        <span>External hard drive copy verified</span>
                      </label>
                      <button
                        disabled={saving || !primaryBackup || !secondaryBackup}
                        onClick={() => void verifyArchive()}
                        className="w-full py-1.5 mt-1 rounded border border-stone-400 bg-white text-stone-800 text-xs font-semibold disabled:opacity-40"
                      >
                        Confirm Verified Backups
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-500">
                      Backup verification opens after job is marked "Delivered".
                    </p>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
