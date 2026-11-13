import { supabase } from "@/integrations/supabase/client";

export const PRINT_SIZES = ["4×6", "6×8", "8×12", "10×14", "12×18", "14×20", "16×24", "18×24", "20×30", "Passport 35×45 mm", "Custom", "Not confirmed"] as const;
export const STAGES = ["received", "editing", "review", "printing", "ready", "delivered"] as const;
export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export const PAYMENT_STATES = ["unpaid", "advance", "paid"] as const;
export const DELIVERY_STATES = ["not_ready", "ready", "collected", "sent"] as const;
export type JobStage = typeof STAGES[number];
export type JobPriority = typeof PRIORITIES[number];
export type ReviewKey = "identity_safe" | "original_preserved" | "instructions_checked" | "size_verified" | "client_approved";
export const REVIEW_LABELS: Record<ReviewKey, string> = {
  identity_safe: "Faces, expression, body, clothes and pose unchanged unless explicitly requested",
  original_preserved: "Original file kept intact; edited copy saved separately",
  instructions_checked: "Retouching, background and memorial text verified against the request",
  size_verified: "Print size, aspect ratio and crop checked visually",
  client_approved: "Before/after inspected and approved for print or delivery",
};
export const REVIEW_KEYS = Object.keys(REVIEW_LABELS) as ReviewKey[];
export const NO_IDENTITY_CHANGE = "Identity-safe edit: do not change faces, expressions, body proportions, clothing or pose unless explicitly requested. Preserve originals and save edits separately.";

export type StudioJob = {
  id: string;
  customer_id: string | null;
  source_gift_order_id: string | null;
  customer_name: string;
  phone: string;
  photo_type: string;
  template_type: string;
  requested_size: string;
  restoration_instructions: string;
  background_instructions: string;
  memorial_name: string;
  memorial_date: string;
  memorial_tithi: string;
  memorial_details: string;
  notes: string;
  assumptions: string;
  priority: JobPriority;
  job_status: JobStage;
  payment_status: typeof PAYMENT_STATES[number];
  delivery_status: typeof DELIVERY_STATES[number];
  total_amount: number | null;
  amount_received: number;
  received_on: string;
  due_on: string | null;
  original_path: string | null;
  edited_path: string | null;
  review: Record<ReviewKey, boolean>;
  created_at?: string;
  updated_at?: string;
};

export type JobTemplate = {
  id: string; name: string; photoType: string; size: string;
  restoration: string; background: string; notes: string;
};
export const JOB_TEMPLATES: JobTemplate[] = [
  { id: "passport", name: "Passport photo", photoType: "Passport", size: "Passport 35×45 mm", restoration: "Clean blemishes and balance light naturally. Ensure passport-safe crop and correct background without modifying identity.", background: "Plain required ID background; confirm official requirement.", notes: "Check face scale and correct print sheet." },
  { id: "restoration", name: "Vintage restoration", photoType: "Restoration", size: "8×12", restoration: "Remove scratches, tears, fading and colour casts without inventing features. Colourise only if requested.", background: "Retain original background unless requested.", notes: "Check original scan resolution and missing detail; flag irrecoverable areas." },
  { id: "background", name: "Background replacement", photoType: "Background change", size: "12×18", restoration: "Preserve face, identity, clothing, pose and body proportions exactly.", background: "Replace only the background. Match shadows, edge detail and studio lighting realistically.", notes: "Confirm preferred colour/theme with customer." },
  { id: "memorial", name: "Memorial portrait", photoType: "Memorial", size: "12×18", restoration: "Faithfully restore the supplied portrait. Keep expression and facial features unchanged.", background: "Classic blue, green or custom memorial background; confirm preference.", notes: "Verify Gujarati name, date, weekday and tithi against customer input BEFORE printing." },
  { id: "collage", name: "Family collage", photoType: "Family collage", size: "16×24", restoration: "Use supplied photos only; keep each original person's features and pose faithful.", background: "Balanced premium collage composition. Confirm palette and photo arrangement.", notes: "Check all people are included and no face is accidentally changed or obscured." },
  { id: "gift", name: "Photo gifting", photoType: "Photo gift", size: "4×6", restoration: "Retouch conservatively; preserve original identity.", background: "Use supplied image as-is unless customer requests a change.", notes: "Confirm product, material, quantity, design proof and pricing before printing." },
];

function localDay(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const today = () => localDay();
export const tomorrow = () => localDay(1);

export function emptyJob(template?: JobTemplate): StudioJob {
  return {
    id: crypto.randomUUID(), customer_id: null, source_gift_order_id: null,
    customer_name: "", phone: "", photo_type: template?.photoType || "Other",
    template_type: template?.id || "custom", requested_size: template?.size || "Not confirmed",
    restoration_instructions: template?.restoration || "",
    background_instructions: template?.background || "", memorial_name: "", memorial_date: "", memorial_tithi: "", memorial_details: "",
    notes: template?.notes || "", assumptions: "Confirm unfinished fields (size, date, price, finish) with customer before printing.",
    priority: "normal", job_status: "received", payment_status: "unpaid", delivery_status: "not_ready",
    total_amount: null, amount_received: 0, received_on: today(), due_on: tomorrow(), original_path: null, edited_path: null,
    review: { identity_safe: false, original_preserved: false, instructions_checked: false, size_verified: false, client_approved: false },
  };
}
export function isReviewed(job: StudioJob) { return REVIEW_KEYS.every((key) => !!job.review?.[key]); }
export function phoneDigits(phone: string) { return phone.replace(/\D/g, "").slice(-10); }
export function duplicateJobs(jobs: StudioJob[], candidate: StudioJob) {
  const phone = phoneDigits(candidate.phone);
  const name = candidate.customer_name.trim().toLowerCase();
  if (!phone && !name) return [];
  return jobs.filter((job) => job.id !== candidate.id && (
    (phone.length >= 10 && phoneDigits(job.phone) === phone) ||
    (name.length > 2 && job.customer_name.trim().toLowerCase() === name)
  )).slice(0, 5);
}

export function cacheKey(userId: string) { return `rajmoti:studio-jobs:cache:v1:${userId}`; }
export function queueKey(userId: string) { return `rajmoti:studio-jobs:pending:v1:${userId}`; }
function readJobs(key: string): StudioJob[] {
  if (typeof window === "undefined") return [];
  try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
export function readCache(userId: string) { return readJobs(cacheKey(userId)); }
export function readPending(userId: string) { return readJobs(queueKey(userId)); }
export function saveCache(userId: string, jobs: StudioJob[]) { localStorage.setItem(cacheKey(userId), JSON.stringify(jobs)); }
export function savePending(userId: string, pending: StudioJob[]) { localStorage.setItem(queueKey(userId), JSON.stringify(pending)); }
export function mergePending(remote: StudioJob[], pending: StudioJob[]): StudioJob[] {
  const byId = new Map(remote.map((row) => [row.id, row]));
  pending.forEach((row) => byId.set(row.id, row));
  return Array.from(byId.values()).sort((a, b) => (a.due_on || "9999").localeCompare(b.due_on || "9999") || (a.created_at || "").localeCompare(b.created_at || ""));
}
function toWritable(job: StudioJob) {
  const { created_at, updated_at, ...record } = job;
  return record;
}
export async function fetchStudioJobs(): Promise<StudioJob[]> {
  const { data, error } = await supabase.from("studio_jobs" as any).select("*").order("created_at", { ascending: false }).limit(1000);
  if (error) throw error;
  return (data ?? []) as unknown as StudioJob[];
}
export async function writeJob(job: StudioJob): Promise<void> {
  const { error } = await supabase.from("studio_jobs" as any).upsert(toWritable(job) as any, { onConflict: "id" });
  if (error) throw error;
}
export async function uploadJobPhoto(jobId: string, type: "original" | "edited", file: File): Promise<string> {
  if (file.size > 20 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/tiff"].includes(file.type)) {
    throw new Error("Choose an original JPG, PNG, WebP or TIFF photo under 20 MB.");
  }
  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "tiff";
  // Always use a new object key: never overwrite the source original or an earlier edit.
  const path = `${jobId}/${type}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("studio-job-files").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}
export async function getJobPhotoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("studio-job-files").createSignedUrl(path, 300);
  if (error || !data) throw error ?? new Error("Could not open preview");
  return data.signedUrl;
}
