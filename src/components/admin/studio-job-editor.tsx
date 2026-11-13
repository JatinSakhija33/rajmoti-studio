import { liveBackend } from "@/lib/backend-mode";
import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, FileImage, ShieldCheck, UploadCloud, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  duplicateJobs,
  getJobPhotoUrl,
  isReviewed,
  NO_IDENTITY_CHANGE,
  PAYMENT_STATES,
  DELIVERY_STATES,
  PRINT_SIZES,
  PRIORITIES,
  REVIEW_KEYS,
  REVIEW_LABELS,
  STAGES,
  uploadJobPhoto,
  type StudioJob,
} from "@/lib/studio-jobs";

const FIELD =
  "w-full border border-onyx/20 px-3 py-2.5 bg-white text-sm focus:outline-none focus:border-gold";
function label(text: string, htmlFor: string) {
  return (
    <label className="block text-[11px] font-semibold mb-2" htmlFor={htmlFor}>
      {text}
    </label>
  );
}
const titleCase = (v: string) => v.replace(/_/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());

type KnownCustomer = { id: string; customer_name: string | null; phone: string | null };
export function StudioJobEditor({
  job,
  otherJobs,
  onClose,
  onSave,
  online,
}: {
  job: StudioJob;
  otherJobs: StudioJob[];
  onClose: () => void;
  onSave: (job: StudioJob) => Promise<void>;
  online: boolean;
}) {
  const [draft, setDraft] = useState<StudioJob>(job);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"original" | "edited" | null>(null);
  const [error, setError] = useState("");
  const [previews, setPreviews] = useState<{ original?: string; edited?: string }>({});
  const [matchingContacts, setMatchingContacts] = useState<KnownCustomer[]>([]);
  const matchPhone = draft.phone.replace(/\D/g, "").slice(-10);
  const duplicates = duplicateJobs(otherJobs, draft);

  useEffect(() => {
    let active = true;
    const preview = async (stage: "original" | "edited", path: string) => {
      try {
        const url = await getJobPhotoUrl(path);
        if (active) setPreviews((p) => ({ ...p, [stage]: url }));
      } catch {
        /* Preview will be unavailable until online. */
      }
    };
    if (draft.original_path && online) void preview("original", draft.original_path);
    if (draft.edited_path && online) void preview("edited", draft.edited_path);
    return () => {
      active = false;
    };
  }, [draft.original_path, draft.edited_path, online]);

  useEffect(() => {
    let active = true;
    if (!online || matchPhone.length < 10) {
      setMatchingContacts([]);
      return;
    }
    const timeout = window.setTimeout(async () => {
      const { data } = await supabase
        .from("customers")
        .select("id,customer_name,phone")
        .eq("normalized_phone", matchPhone)
        .is("deleted_at", null)
        .limit(6);
      if (active) setMatchingContacts((data || []) as KnownCustomer[]);
    }, 400);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [matchPhone, online]);

  function change<K extends keyof StudioJob>(key: K, value: StudioJob[K]) {
    setDraft((p) => ({ ...p, [key]: value }));
  }
  async function upload(type: "original" | "edited", file?: File) {
    if (!file || uploading) return;
    if (!online)
      return setError("Photo uploads require internet. Other job details can be saved offline.");
    setUploading(type);
    setError("");
    try {
      const path = await uploadJobPhoto(draft.id, type, file);
      change(type === "original" ? "original_path" : "edited_path", path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload photo");
    } finally {
      setUploading(null);
    }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.customer_name.trim()) return setError("Customer name is required.");
    if (
      draft.amount_received < 0 ||
      (draft.total_amount !== null && draft.amount_received > draft.total_amount)
    )
      return setError("The received amount cannot exceed the total.");
    if (draft.job_status === "delivered" && !isReviewed(draft))
      return setError("Complete every before/after review check before marking delivered.");
    if (draft.job_status === "delivered" && !["sent", "collected"].includes(draft.delivery_status))
      return setError("Set delivery to Collected or Sent before closing the job.");
    setBusy(true);
    setError("");
    try {
      await onSave(draft);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save job");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[130] bg-black/60 flex items-center justify-center px-0 sm:px-5 py-0 sm:py-5"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        data-owner-uploads="enabled"
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-modal-title"
        className="w-full max-w-5xl max-h-dvh sm:max-h-[94dvh] overflow-y-auto bg-cream text-onyx shadow-2xl"
      >
        <form onSubmit={(e) => void save(e)}>
          <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur-md border-b border-onyx/10 px-5 sm:px-8 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-gold mb-1">Studio production</p>
              <h2 id="job-modal-title" className="font-display text-2xl md:text-3xl">
                {job.customer_name ? `Edit · ${job.customer_name}` : "New walk-in job"}
              </h2>
            </div>
            <button
              type="button"
              aria-label="Close job editor"
              onClick={onClose}
              className="size-10 flex items-center justify-center border border-onyx/10"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="px-5 sm:px-8 py-7 space-y-9">
            <div className="p-4 bg-[#f7f0e2] border border-[#e7d8bc] flex gap-3 items-start">
              <ShieldCheck className="size-6 shrink-0 text-[#927342]" />
              <div>
                <strong className="text-xs uppercase tracking-wide">
                  Non-negotiable identity-safe editing
                </strong>
                <p className="text-xs leading-6 mt-1">{NO_IDENTITY_CHANGE}</p>
              </div>
            </div>
            <section>
              <h3 className="font-display text-xl mb-5">Customer & order</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  {label("Customer name *", "job-name")}
                  <input
                    id="job-name"
                    required
                    value={draft.customer_name}
                    onChange={(e) => change("customer_name", e.target.value)}
                    className={FIELD}
                    placeholder="Walk-in customer"
                  />
                </div>
                <div>
                  {label("Phone / WhatsApp", "job-phone")}
                  <input
                    id="job-phone"
                    type="tel"
                    value={draft.phone}
                    onChange={(e) => change("phone", e.target.value)}
                    className={FIELD}
                    placeholder="Mobile number"
                  />
                </div>
                <div>
                  {label("Photo type", "job-photo-type")}
                  <input
                    id="job-photo-type"
                    value={draft.photo_type}
                    onChange={(e) => change("photo_type", e.target.value)}
                    className={FIELD}
                    placeholder="Passport, baby, restoration…"
                  />
                </div>
                <div>
                  {label("Print size", "job-size")}
                  <select
                    id="job-size"
                    className={FIELD}
                    value={draft.requested_size}
                    onChange={(e) => change("requested_size", e.target.value)}
                  >
                    {PRINT_SIZES.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  {label("Received on", "job-received")}
                  <input
                    id="job-received"
                    type="date"
                    value={draft.received_on}
                    onChange={(e) => change("received_on", e.target.value)}
                    className={FIELD}
                  />
                </div>
                <div>
                  {label("Due / promised date", "job-due")}
                  <input
                    id="job-due"
                    type="date"
                    value={draft.due_on || ""}
                    onChange={(e) => change("due_on", e.target.value || null)}
                    className={FIELD}
                  />
                </div>
              </div>
              {matchingContacts.length > 0 && (
                <div className="mt-4 p-4 border border-gold/30 bg-white">
                  <p className="text-xs font-semibold mb-2">
                    Existing contact with this phone — use instead of duplicating:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {matchingContacts.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() =>
                          setDraft((p) => ({
                            ...p,
                            customer_id: c.id,
                            customer_name: c.customer_name || p.customer_name,
                            phone: c.phone || p.phone,
                          }))
                        }
                        className={`border px-3 py-2 text-xs ${draft.customer_id === c.id ? "bg-onyx text-white" : "border-onyx/20"}`}
                      >
                        {c.customer_name || "Unnamed"} · {c.phone}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {duplicates.length > 0 && (
                <div role="status" className="mt-4 p-4 border border-amber-300 bg-amber-50 text-sm">
                  <div className="flex items-center gap-2 font-semibold mb-2">
                    <AlertTriangle className="size-4" /> Possible duplicate jobs — check before
                    saving
                  </div>
                  {duplicates.map((d) => (
                    <p key={d.id} className="text-xs leading-6">
                      {d.customer_name} · {d.photo_type} · {d.requested_size} ·{" "}
                      {d.due_on || "no deadline"} · {titleCase(d.job_status)}
                    </p>
                  ))}
                </div>
              )}
            </section>
            <section className="grid md:grid-cols-2 gap-5">
              <div>
                <h3 className="font-display text-xl mb-3">Restoration / retouching</h3>
                <textarea
                  rows={4}
                  value={draft.restoration_instructions}
                  onChange={(e) => change("restoration_instructions", e.target.value)}
                  className={FIELD}
                  placeholder="Damage repair, colourisation, facial identity rules…"
                />
              </div>
              <div>
                <h3 className="font-display text-xl mb-3">Background instructions</h3>
                <textarea
                  rows={4}
                  value={draft.background_instructions}
                  onChange={(e) => change("background_instructions", e.target.value)}
                  className={FIELD}
                  placeholder="Keep current background or specify realistic replacement…"
                />
              </div>
            </section>
            <section className="border border-onyx/10 p-5 bg-white">
              <h3 className="font-display text-xl mb-4">
                Memorial details{" "}
                <span className="text-sm text-muted-foreground">(if applicable)</span>
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  {label("Gujarati name / title", "mem-name")}
                  <input
                    id="mem-name"
                    value={draft.memorial_name}
                    onChange={(e) => change("memorial_name", e.target.value)}
                    className={FIELD}
                    placeholder="સ્વ. ..."
                  />
                </div>
                <div>
                  {label("Date as supplied", "mem-date")}
                  <input
                    id="mem-date"
                    value={draft.memorial_date}
                    onChange={(e) => change("memorial_date", e.target.value)}
                    className={FIELD}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <div>
                  {label("Tithi / weekday", "mem-tithi")}
                  <input
                    id="mem-tithi"
                    value={draft.memorial_tithi}
                    onChange={(e) => change("memorial_tithi", e.target.value)}
                    className={FIELD}
                    placeholder="Customer-confirmed tithi"
                  />
                </div>
              </div>
              <div className="mt-4">
                {label("Border, flowers, colours or memorial lines", "mem-details")}
                <textarea
                  id="mem-details"
                  rows={2}
                  value={draft.memorial_details}
                  onChange={(e) => change("memorial_details", e.target.value)}
                  className={FIELD}
                />
              </div>
              <p className="text-[11px] text-amber-800 mt-3">
                Never guess a name, date or tithi. Keep unknowns editable and confirm them before
                printing.
              </p>
            </section>
            <section className="grid md:grid-cols-3 gap-4">
              <div>
                {label("Priority", "job-priority")}
                <select
                  id="job-priority"
                  className={FIELD}
                  value={draft.priority}
                  onChange={(e) => change("priority", e.target.value as StudioJob["priority"])}
                >
                  {PRIORITIES.map((s) => (
                    <option key={s} value={s}>
                      {titleCase(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {label("Production stage", "job-stage")}
                <select
                  id="job-stage"
                  className={FIELD}
                  value={draft.job_status}
                  onChange={(e) => change("job_status", e.target.value as StudioJob["job_status"])}
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {titleCase(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {label("Delivery status", "job-delivery")}
                <select
                  id="job-delivery"
                  className={FIELD}
                  value={draft.delivery_status}
                  onChange={(e) =>
                    change("delivery_status", e.target.value as StudioJob["delivery_status"])
                  }
                >
                  {DELIVERY_STATES.map((s) => (
                    <option key={s} value={s}>
                      {titleCase(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {label("Payment", "job-payment")}
                <select
                  id="job-payment"
                  className={FIELD}
                  value={draft.payment_status}
                  onChange={(e) =>
                    change("payment_status", e.target.value as StudioJob["payment_status"])
                  }
                >
                  {PAYMENT_STATES.map((s) => (
                    <option key={s} value={s}>
                      {titleCase(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {label("Total price (₹, if confirmed)", "job-total")}
                <input
                  id="job-total"
                  className={FIELD}
                  min={0}
                  step={0.01}
                  type="number"
                  value={draft.total_amount ?? ""}
                  onChange={(e) =>
                    change("total_amount", e.target.value === "" ? null : Number(e.target.value))
                  }
                />
              </div>
              <div>
                {label("Amount received (₹)", "job-paid")}
                <input
                  id="job-paid"
                  className={FIELD}
                  min={0}
                  step={0.01}
                  type="number"
                  value={draft.amount_received}
                  onChange={(e) => change("amount_received", Number(e.target.value))}
                />
              </div>
            </section>
            <section className="grid md:grid-cols-2 gap-5">
              <div>
                {label("Production notes", "job-notes")}
                <textarea
                  id="job-notes"
                  className={FIELD}
                  rows={4}
                  value={draft.notes}
                  onChange={(e) => change("notes", e.target.value)}
                  placeholder="Customer preferences, crop, print paper, packaging, collection notes…"
                />
              </div>
              <div>
                {label("Editable assumptions / unconfirmed fields", "job-assumptions")}
                <textarea
                  id="job-assumptions"
                  className={FIELD}
                  rows={4}
                  value={draft.assumptions}
                  onChange={(e) => change("assumptions", e.target.value)}
                  placeholder="Unknown finish, date, tithi, colour or payment – mark for confirmation"
                />
                <p className="text-[11px] text-muted-foreground mt-2">
                  Never silently fill unknown client details.
                </p>
              </div>
            </section>
            <section>
              <div className="flex items-center flex-wrap justify-between gap-4 mb-4">
                <h3 className="font-display text-xl">Original vs edited — visual review</h3>
                <p className="text-xs text-muted-foreground">
                  {liveBackend
                    ? "Private owner storage · originals are never overwritten"
                    : "Photos stay in this browser · originals are never overwritten"}
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                {(["original", "edited"] as const).map((stage) => (
                  <div key={stage} className="border border-onyx/10 bg-white">
                    <div className="flex justify-between items-center gap-2 border-b border-onyx/10 px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-widest">
                        {stage === "original"
                          ? "Before · untouched source"
                          : "After · edited version"}
                      </span>
                      {draft[stage === "original" ? "original_path" : "edited_path"] && (
                        <CheckCircle2 className="size-4 text-green-700" />
                      )}
                    </div>
                    <div className="aspect-[4/3] bg-[#eeeae2] grid place-items-center overflow-hidden">
                      {previews[stage] ? (
                        <a
                          href={previews[stage]}
                          target="_blank"
                          rel="noreferrer"
                          title="Open full-resolution preview"
                          className="size-full"
                        >
                          <img
                            src={previews[stage]}
                            className="size-full object-contain"
                            alt={`${stage === "original" ? "Original" : "Edited"} photo for comparison`}
                          />
                        </a>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <FileImage className="size-9 mx-auto mb-2" />
                          <span className="text-xs">
                            {draft[stage === "original" ? "original_path" : "edited_path"]
                              ? "Preview unavailable offline"
                              : "No file uploaded"}
                          </span>
                        </div>
                      )}
                    </div>
                    <label
                      className={`flex justify-center items-center gap-2 px-4 py-3 text-xs text-center ${online ? "cursor-pointer hover:bg-[#f8f5ee]" : "opacity-50 cursor-not-allowed"}`}
                    >
                      <UploadCloud className="size-4" />
                      {uploading === stage
                        ? "Uploading…"
                        : stage === "original"
                          ? "Choose original photo"
                          : "Choose edited photo"}
                      <input
                        type="file"
                        className="sr-only"
                        aria-label={`${stage} job photo`}
                        disabled={!online || !!uploading}
                        accept="image/jpeg,image/png,image/webp,image/tiff"
                        onChange={(e) => {
                          void upload(stage, e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-5 bg-white border border-onyx/10 p-5">
                <div className="flex flex-wrap justify-between gap-3 mb-4">
                  <h4 className="text-sm font-semibold">Before / after quality checklist</h4>
                  <span
                    className={`text-xs ${isReviewed(draft) ? "text-green-700" : "text-amber-700"}`}
                  >
                    {REVIEW_KEYS.filter((k) => draft.review?.[k]).length}/{REVIEW_KEYS.length}{" "}
                    verified
                  </span>
                </div>
                <div className="space-y-3">
                  {REVIEW_KEYS.map((key) => (
                    <label
                      key={key}
                      className="flex items-start gap-3 text-xs leading-6 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mt-1.5 accent-[#ad916b]"
                        checked={!!draft.review?.[key]}
                        onChange={(e) =>
                          change("review", { ...draft.review, [key]: e.target.checked })
                        }
                      />
                      {REVIEW_LABELS[key]}
                    </label>
                  ))}
                </div>
              </div>
            </section>
            {error && (
              <p
                role="alert"
                className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2"
              >
                <AlertTriangle className="size-4 shrink-0" />
                {error}
              </p>
            )}
          </div>
          <div className="sticky bottom-0 bg-cream/95 backdrop-blur-lg border-t border-onyx/10 px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
            <p className="text-[11px] text-muted-foreground max-w-md">
              {online
                ? liveBackend
                  ? "Job changes save to your configured Supabase project."
                  : "Demonstration changes stay in this browser. No data is sent to Supabase."
                : "Offline mode: metadata saves to this browser; photos require internet."}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="border border-onyx/20 text-xs px-4 py-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || uploading !== null}
                className="bg-onyx text-cream text-xs px-5 py-3 font-semibold disabled:opacity-40"
              >
                {busy ? "Saving…" : "Save job"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
