/**
 * Read-only adapter for the named Rajmoti OS Firestore database.
 * Do not use this adapter to create bills, change payments, or mutate orders.
 */
export const STUDIO_ROOT = "studios/rajmoti_studio";
export const FIRESTORE_DATABASE_ID = "ai-studio-rajmotistudioai-72e2debd-055c-4ab8-a5ef-f9c759cebfaf";
export const STUDIO_TENANT = "rajmoti_studio";
export const ANDROID_STAGES = ["Received","Selection","Editing","Design","Printing","Frame","Packed","Ready","Delivered"];

const number = value => typeof value === "number" && Number.isFinite(value) ? value :
  (typeof value === "string" && value.trim() && Number.isFinite(Number(value)) ? Number(value) : null);
const string = value => typeof value === "string" ? value.trim() : "";

export function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
}

export function safeEpoch(value) {
  const parsed = number(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

export function sessionFromDocument(documentId, data) {
  if (!data || data.userId !== STUDIO_TENANT) return null;
  const id = number(data.id);
  const familyId = number(data.familyId);
  const billNumber = string(data.billNumber);
  // Android also requires real, positive numeric IDs and non-blank bills.
  if (!billNumber || id === null || id <= 0 || !Number.isSafeInteger(id)) return null;
  const stage = ANDROID_STAGES.includes(data.stage) ? data.stage : "Received";
  const total = number(data.totalBill);
  const paid = number(data.advancePaid);
  const explicitlyDue = number(data.balanceDue);
  const balanceDue = explicitlyDue !== null && explicitlyDue >= 0 ? explicitlyDue :
    total !== null && paid !== null ? Math.max(0, total - paid) : null;
  return {
    documentId, id, familyId, billNumber, stage,
    itemDescription: string(data.itemDescription), productType: string(data.productType),
    createdDateMs: safeEpoch(data.createdDate), dueDateMs: safeEpoch(data.dueDate),
    totalBill: total, advancePaid: paid, balanceDue,
    lastModifiedMs: safeEpoch(data.lastModifiedMs),
    blockingReason: string(data.blockingReason), deliveryNotes: string(data.deliveryNotes),
  };
}

export function familiesById(documents) {
  const families = new Map();
  for (const {id: documentId, data} of documents) {
    if (data?.userId !== STUDIO_TENANT) continue;
    const id = number(data.id);
    if (id === null || id <= 0 || !Number.isSafeInteger(id)) continue;
    families.set(id, {
      documentId, id, name: string(data.name), phone: normalizePhone(data.mobile),
      currentBaaki: number(data.currentBaaki), lifetimeSpend: number(data.lifetimeSpend),
    });
  }
  return families;
}

export function workflowSummary(sessionDocuments, familyDocuments, nowMs = Date.now()) {
  const families = familiesById(familyDocuments);
  // Evaluate calendar dates in IST even if the browser is in another timezone.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(nowMs));
  const date = Object.fromEntries(parts.map(({type,value}) => [type,value]));
  const start = Date.UTC(+date.year, +date.month - 1, +date.day) - 19800000;
  const end = start + 86400000;
  const jobs = sessionDocuments.map(({id,data}) => sessionFromDocument(id,data))
    .filter(Boolean).map(job => ({...job, customer: families.get(job.familyId) ?? null}));
  const active = jobs.filter(job => job.stage !== "Delivered");
  return {
    jobs, activeCount: active.length,
    dueTodayCount: active.filter(job => job.dueDateMs !== null && job.dueDateMs >= start && job.dueDateMs < end).length,
    overdueCount: active.filter(job => job.dueDateMs !== null && job.dueDateMs < start).length,
    outstandingCount: jobs.filter(job => job.balanceDue !== null && job.balanceDue > 0).length,
    missingContactCount: jobs.filter(job => !job.customer).length,
  };
}
