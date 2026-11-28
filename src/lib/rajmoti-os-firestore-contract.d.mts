export const STUDIO_ROOT: string;
export const FIRESTORE_DATABASE_ID: string;
export const STUDIO_TENANT: string;
export const ANDROID_STAGES: string[];
export function normalizePhone(value: unknown): string;
export function safeEpoch(value: unknown): number | null;
export function sessionFromDocument(documentId: string, data: Record<string, unknown>): unknown;
export function familiesById(documents: Array<{id:string; data:Record<string, unknown>}>): Map<number, unknown>;
export function workflowSummary(
  sessionDocuments: Array<{id:string; data:Record<string, unknown>}>,
  familyDocuments: Array<{id:string; data:Record<string, unknown>}>,
  nowMs?: number
): unknown;
