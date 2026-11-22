import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";

export type GiftDesign = {
  id: string;
  kind: string;
  settings: Record<string, unknown>;
  photoSlots: ({ source: "sample"; path: string } | { source: "upload"; index: number } | {source:"empty"})[];
  photoCount: number;
};
export type GiftDraft = { design: GiftDesign; files: File[] };
const fileByUrl = new Map<string, File>();
const cartFiles = new Map<string, File[]>();
const Publish = createContext<(draft: GiftDraft) => void>(() => {});

export function GiftDesignProvider({ children, onChange }: { children: ReactNode; onChange: (draft: GiftDraft) => void }) {
  const id = useRef(crypto.randomUUID());
  const publish = useCallback((draft: GiftDraft) => onChange({ ...draft, design: { ...draft.design, id: id.current } }), [onChange]);
  return <Publish.Provider value={publish}>{children}</Publish.Provider>;
}
export function useGiftSnapshot(kind: string, settings: Record<string, unknown>, urls: string[]) {
  const publish = useContext(Publish);
  const key = JSON.stringify({ kind, settings, urls });
  useEffect(() => {
    const value = JSON.parse(key) as { kind: string; settings: Record<string, unknown>; urls: string[] };
    const files: File[] = [];
    const photoSlots: GiftDesign["photoSlots"] = [];
    for (const url of value.urls) {
      const file = fileByUrl.get(url);
      if (file) { photoSlots.push({ source: "upload", index: files.length }); files.push(file); }
      else if (url.startsWith("/products/") || url.startsWith("/deities/")) photoSlots.push({ source: "sample", path: url });
      else photoSlots.push({source:"empty"});
    }
    publish({ design: { id: "", kind: value.kind, settings: value.settings, photoSlots, photoCount: files.length }, files });
  }, [key, publish]);
}
export function useGiftPhotoUrls() {
  const urls = useRef<string[]>([]);
  useEffect(() => () => { for (const url of urls.current) { fileByUrl.delete(url); URL.revokeObjectURL(url); } }, []);
  return useCallback((file: File) => { const url = URL.createObjectURL(file); urls.current.push(url); fileByUrl.set(url, file); return url; }, []);
}
export function rememberCartPhotos(draft?: GiftDraft) {
  if (draft) cartFiles.set(draft.design.id, draft.files);
}
export function getCartPhotos(id?: string) { return id ? cartFiles.get(id) || [] : []; }
export function attachCartPhotos(id: string, files: File[]) { cartFiles.set(id, files); }
export function forgetCartPhotos(id?: string) { if (id) cartFiles.delete(id); }
export function validateGiftFiles(files: File[]) {
  if (files.length > 20) return "Choose up to 20 photos at a time.";
  if (files.some((f) => !["image/jpeg", "image/png", "image/webp"].includes(f.type))) return "Choose JPG, PNG or WebP photographs.";
  if (files.some((f) => f.size <= 0 || f.size > 10_000_000)) return "Each photo must be smaller than 10 MB.";
  return "";
}
