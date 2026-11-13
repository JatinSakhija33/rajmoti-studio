// Browser-only photo persistence. Blobs never leave this device in demo mode.
const DB = "rajmoti-preview-media-v1";
const urls = new Map<string, string>();
const references = new Map<string, string>();
function open() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function operation<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction("files", mode);
    const req = fn(tx.objectStore("files"));
    tx.oncomplete = () => {
      db.close();
      resolve(req.result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export function mediaReference(value: string) {
  return references.get(value) || value;
}
export async function mediaUrl(reference: string) {
  if (!reference.startsWith("local-photo://")) return reference;
  if (urls.has(reference)) return urls.get(reference)!;
  const blob = await operation("readonly", (s) => s.get(reference));
  if (!(blob instanceof Blob)) return "/demo/family-1.svg";
  const url = URL.createObjectURL(blob);
  urls.set(reference, url);
  references.set(url, reference);
  return url;
}
export async function resolveMedia(value: any): Promise<any> {
  if (typeof value === "string") return mediaUrl(value);
  if (Array.isArray(value)) return Promise.all(value.map(resolveMedia));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      await Promise.all(Object.entries(value).map(async ([k, v]) => [k, await resolveMedia(v)])),
    );
  }
  return value;
}
export function persistable(value: any): any {
  if (typeof value === "string") return mediaReference(value);
  if (Array.isArray(value)) return value.map(persistable);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, persistable(v)]));
  return value;
}
export async function clearDemoMedia() {
  await operation("readwrite", (s) => s.clear());
  urls.forEach((u) => URL.revokeObjectURL(u));
  urls.clear();
  references.clear();
}
export function localBucket(bucket: string) {
  const prefix = `local-photo://${bucket}/`;
  return {
    async upload(path: string, blob: Blob, options?: { upsert?: boolean }) {
      try {
        if (!["gallery", "studio-job-files"].includes(bucket))
          throw new Error("Only owner photo storage is enabled.");
        if (!options?.upsert && (await operation("readonly", (s) => s.get(prefix + path))))
          throw new Error("File already exists");
        await operation("readwrite", (s) => s.put(blob, prefix + path));
        return { data: { path }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    async createSignedUrl(path: string) {
      try {
        return { data: { signedUrl: await mediaUrl(prefix + path) }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    async list(folder: string) {
      const keys = await operation("readonly", (s) => s.getAllKeys());
      return {
        data: keys
          .map(String)
          .filter((k) => k.startsWith(prefix + folder + "/"))
          .map((k) => ({ name: k.slice((prefix + folder + "/").length) }))
          .filter((x) => !x.name.includes("/")),
        error: null,
      };
    },
    async remove(paths: string[]) {
      try {
        for (const path of paths) await operation("readwrite", (s) => s.delete(prefix + path));
        return { data: [], error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    getPublicUrl(path: string) {
      return { data: { publicUrl: prefix + path } };
    },
  };
}
