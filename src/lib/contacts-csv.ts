/**
 * Google Contacts CSV import (fallback / bulk path).
 * Same normalisation + dedupe pipeline as the People API sync.
 *
 * The parser is deliberately schema-agnostic: Google exports phone numbers as
 * pairs of columns ("Phone 1 - Type" / "Phone 1 - Value"), other tools export a
 * single "Mobile"/"Phone Number" column. We detect every phone-ish column,
 * pair values with their types, and pick the best usable number per contact.
 */
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone } from "@/lib/customer-directory";

export type CsvPhone = { raw: string; type: string | null; normalized: string | null };

export type CsvContact = {
  name: string | null;
  phone: string | null;
  phoneType: string | null;
  phones: CsvPhone[];
  email: string | null;
  normalized: string | null;
  resourceName: string | null;
};

/**
 * Decode an uploaded CSV file. Google exports UTF-8 (with BOM), but the
 * "Outlook CSV" variant is UTF-16LE — decoding that as UTF-8 yields garbled
 * headers and zero detected phone columns.
 */
export function decodeCsvBuffer(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder("utf-16le").decode(b);
  if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder("utf-16be").decode(b);
  // Heuristic: lots of NUL bytes => UTF-16 without BOM
  const sample = b.subarray(0, 200);
  let nul = 0;
  for (const c of sample) if (c === 0) nul++;
  if (nul > sample.length / 4) return new TextDecoder("utf-16le").decode(b);
  return new TextDecoder("utf-8").decode(b);
}

function detectDelimiter(firstLine: string): string {
  const counts = [",", ";", "\t"].map((d) => [d, firstLine.split(d).length - 1] as const);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0]![1] > 0 ? counts[0]![0] : ",";
}

export function parseCsv(text: string): string[][] {
  // Strip BOM (Google CSV exports are UTF-8 with BOM)
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const delimiter = detectDelimiter(text.slice(0, text.indexOf("\n") + 1 || 500));
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const TYPE_PRIORITY = ["mobile", "cell", "other", "work", "home"];

function typeRank(t: string | null) {
  if (!t) return TYPE_PRIORITY.length;
  const l = t.toLowerCase();
  const i = TYPE_PRIORITY.findIndex((p) => l.includes(p));
  return i === -1 ? TYPE_PRIORITY.length : i;
}

export type CsvSchema = {
  headers: string[];
  nameColumns: number[];
  /** phone value column index -> optional matching type column index */
  phoneColumns: { value: number; type: number | null; label: string }[];
  emailColumns: number[];
  resourceColumn: number | null;
};

/** Inspect the header row and work out where names / phones / emails live. */
export function detectSchema(headerRow: string[]): CsvSchema {
  const headers = headerRow.map((h) => h.replace(/^\ufeff/, "").trim());
  const lower = headers.map((h) => h.toLowerCase());

  const nameColumns: number[] = [];
  const emailColumns: number[] = [];
  const phoneValue: number[] = [];
  const phoneType: number[] = [];
  let resourceColumn: number | null = null;

  lower.forEach((h, i) => {
    // Google: "Phone 1 - Value" holds the number, "Phone 1 - Label"/"- Type"
    // holds Mobile/Home/Work. "- Value" always wins over the label heuristic.
    const isValue = /-\s*value$/.test(h);
    const isType = !isValue && /\btype\b|\blabel\b/.test(h);
    const phoneish = /phone|mobile|cell|telephone|contact number|tel\b/.test(h);
    if (phoneish && !/email|e-mail/.test(h)) {
      if (isType) phoneType.push(i);
      else phoneValue.push(i);
      return;
    }
    if (/e-?mail/.test(h) && !isType) { emailColumns.push(i); return; }
    if (h === "name" || h === "display name" || h === "full name" ||
        h === "first name" || h === "given name" ||
        h === "middle name" ||
        h === "last name" || h === "family name" ||
        h === "organization name" || h === "company") {
      nameColumns.push(i);
      return;
    }
    if (/resource ?name|google contact id|contact id/.test(h)) resourceColumn = i;
  });

  // Pair "Phone N - Value" with "Phone N - Type" by their leading group number.
  const groupOf = (h: string) => (h.match(/(\d+)/)?.[1] ?? null);
  const phoneColumns = phoneValue.map((v) => {
    const g = groupOf(lower[v] ?? "");
    const t =
      (g ? phoneType.find((ti) => groupOf(lower[ti] ?? "") === g) : undefined) ??
      (phoneValue.length === 1 && phoneType.length === 1 ? phoneType[0] : undefined) ??
      null;
    return { value: v, type: t ?? null, label: headers[v] ?? `Column ${v + 1}` };
  });

  return { headers, nameColumns, phoneColumns, emailColumns, resourceColumn };
}

function pickName(row: string[], schema: CsvSchema, lower: string[]) {
  const get = (i: number) => (row[i] ?? "").trim();
  // Prefer a single full-name column when present
  for (const i of schema.nameColumns) {
    const h = lower[i] ?? "";
    if (h === "name" || h === "display name" || h === "full name") {
      const v = get(i);
      if (v) return v;
    }
  }
  const parts: string[] = [];
  for (const key of ["first name", "given name", "middle name", "last name", "family name"]) {
    const i = schema.nameColumns.find((c) => (lower[c] ?? "") === key);
    if (i !== undefined) { const v = get(i); if (v) parts.push(v); }
  }
  if (parts.length) return parts.join(" ");
  for (const i of schema.nameColumns) { const v = get(i); if (v) return v; }
  return "";
}

/** Google packs multiple values into one cell with ` ::: ` separators. */
function splitMulti(v: string) {
  return v.split(/:::|;;;/).map((x) => x.trim()).filter(Boolean);
}

export type CsvParseResult = { contacts: CsvContact[]; schema: CsvSchema; rowCount: number };

export function parseGoogleCsv(text: string): CsvParseResult {
  const rows = parseCsv(text);
  if (!rows.length) {
    return {
      contacts: [],
      schema: { headers: [], nameColumns: [], phoneColumns: [], emailColumns: [], resourceColumn: null },
      rowCount: 0,
    };
  }
  const schema = detectSchema(rows[0]!);
  const lower = schema.headers.map((h) => h.toLowerCase());
  const out: CsvContact[] = [];

  for (const r of rows.slice(1)) {
    const name = pickName(r, schema, lower);

    const phones: CsvPhone[] = [];
    for (const col of schema.phoneColumns) {
      const rawCell = (r[col.value] ?? "").trim();
      if (!rawCell) continue;
      const types = col.type !== null ? splitMulti((r[col.type] ?? "").trim()) : [];
      splitMulti(rawCell).forEach((raw, i) => {
        const n = normalizePhone(raw);
        phones.push({ raw, type: types[i] ?? types[0] ?? null, normalized: n.ok ? n.digits : null });
      });
    }

    // Deduplicate identical numbers within the contact
    const seenLocal = new Set<string>();
    const uniquePhones = phones.filter((p) => {
      const k = p.normalized ?? p.raw.replace(/\D/g, "");
      if (!k || seenLocal.has(k)) return false;
      seenLocal.add(k);
      return true;
    });

    const usable = uniquePhones.filter((p) => p.normalized);
    usable.sort((a, b) => typeRank(a.type) - typeRank(b.type));
    const best = usable[0] ?? uniquePhones[0] ?? null;

    let email: string | null = null;
    for (const i of schema.emailColumns) {
      const v = splitMulti((r[i] ?? "").trim())[0];
      if (v) { email = v; break; }
    }

    if (!name && !uniquePhones.length && !email) continue;

    out.push({
      name: name || null,
      phone: best?.raw ?? null,
      phoneType: best?.type ?? null,
      phones: uniquePhones,
      email,
      normalized: best?.normalized ?? null,
      resourceName: schema.resourceColumn !== null ? (r[schema.resourceColumn] ?? "").trim() || null : null,
    });
  }

  return { contacts: out, schema, rowCount: rows.length - 1 };
}

/** Back-compat wrapper. */
export function csvToContacts(text: string): CsvContact[] {
  return parseGoogleCsv(text).contacts;
}

export type CsvStatus = "new" | "existing" | "duplicate" | "nophone";
export type CsvRow = CsvContact & { status: CsvStatus };

export type CsvAnalysis = {
  schema: CsvSchema;
  rows: CsvRow[];
  all: CsvContact[];
  withPhone: CsvContact[];
  missingPhone: CsvContact[];
  existing: CsvContact[];
  fresh: CsvContact[];
  duplicatesInFile: CsvContact[];
};

export async function analyseCsvContacts(
  contacts: CsvContact[],
  schema?: CsvSchema,
): Promise<CsvAnalysis> {
  const withPhone = contacts.filter((c) => c.normalized);
  const missingPhone = contacts.filter((c) => !c.normalized);

  const seen = new Set<string>();
  const duplicatesInFile: CsvContact[] = [];
  for (const c of withPhone) {
    if (seen.has(c.normalized!)) duplicatesInFile.push(c);
    else seen.add(c.normalized!);
  }

  // Existing Rajmoti contacts, matched on normalised phone or Google resource name
  const known = new Set<string>();
  const keys = [...seen];
  for (let i = 0; i < keys.length; i += 200) {
    const chunk = keys.slice(i, i + 200);
    const { data } = await supabase
      .from("customers")
      .select("normalized_phone")
      .is("deleted_at", null)
      .in("normalized_phone", chunk);
    for (const r of (data ?? []) as any[]) if (r.normalized_phone) known.add(r.normalized_phone);
  }

  const knownResources = new Set<string>();
  const resources = contacts.map((c) => c.resourceName).filter(Boolean) as string[];
  for (let i = 0; i < resources.length; i += 200) {
    const chunk = resources.slice(i, i + 200);
    const { data } = await supabase
      .from("customers")
      .select("google_contact_resource_name")
      .is("deleted_at", null)
      .in("google_contact_resource_name", chunk);
    for (const r of (data ?? []) as any[])
      if (r.google_contact_resource_name) knownResources.add(r.google_contact_resource_name);
  }

  const usedInFile = new Set<string>();
  const rows: CsvRow[] = contacts.map((c) => {
    let status: CsvStatus;
    if (!c.normalized) status = "nophone";
    else if (known.has(c.normalized) || (c.resourceName && knownResources.has(c.resourceName)))
      status = "existing";
    else if (usedInFile.has(c.normalized)) status = "duplicate";
    else status = "new";
    if (c.normalized) usedInFile.add(c.normalized);
    return { ...c, status };
  });

  return {
    schema: schema ?? { headers: [], nameColumns: [], phoneColumns: [], emailColumns: [], resourceColumn: null },
    rows,
    all: contacts,
    withPhone,
    missingPhone,
    existing: rows.filter((r) => r.status === "existing"),
    fresh: rows.filter((r) => r.status === "new"),
    duplicatesInFile,
  };
}

/**
 * Insert only new contacts. Google never overwrites existing Rajmoti records —
 * service, notes, reminders, bookings and history are untouched.
 */
export async function importCsvContacts(fresh: CsvContact[], onProgress?: (done: number) => void) {
  let done = 0;
  for (let i = 0; i < fresh.length; i += 100) {
    const chunk = fresh.slice(i, i + 100).map((c) => ({
      customer_name: c.name,
      phone: c.phone,
      email: c.email,
      source: "Google Contacts (CSV)",
      google_contact_resource_name: c.resourceName ?? null,
    }));
    const { error } = await supabase.from("customers").insert(chunk as any);
    if (error) throw error;
    done += chunk.length;
    onProgress?.(done);
  }
  return done;
}
