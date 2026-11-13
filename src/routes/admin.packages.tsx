import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { packagesQuery, adminCategoriesQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/site";

export const Route = createFileRoute("/admin/packages")({
  component: AdminPackages,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function AdminPackages() {
  const qc = useQueryClient();
  const { data: packages = [] } = useQuery(packagesQuery);
  const { data: categories = [] } = useQuery(adminCategoriesQuery);

  async function addPackage() {
    const name = prompt("Package name?");
    if (!name) return;
    const { error } = await supabase.from("packages").insert({ name, slug: slugify(name) + "-" + Date.now().toString(36), description: "", price: 0 });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["packages"] });
  }
  async function updatePkg(id: string, patch: any) {
    const { error } = await supabase.from("packages").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["packages"] });
  }
  async function delPkg(id: string) {
    if (!confirm("Delete this package?")) return;
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["packages"] });
  }
  async function addFeature(packageId: string) {
    const feature = prompt("Feature?");
    if (!feature) return;
    const { error } = await supabase.from("package_features").insert({ package_id: packageId, feature });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["packages"] });
  }
  async function delFeature(id: string) {
    const { error } = await supabase.from("package_features").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["packages"] });
  }

  return (
    <div>
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow text-gold mb-2">Packages</p>
          <h1 className="font-display text-4xl">Collections</h1>
        </div>
        <button onClick={addPackage} className="bg-onyx text-cream px-4 py-2 text-xs uppercase tracking-widest font-semibold hover:bg-gold flex items-center gap-2">
          <Plus className="size-4" /> Package
        </button>
      </header>

      <div className="space-y-4">
        {packages.map((p: any) => (
          <div key={p.id} className="bg-white border border-onyx/10 p-6">
            <div className="grid md:grid-cols-12 gap-4 mb-4">
              <input defaultValue={p.name} onBlur={(e) => e.target.value !== p.name && updatePkg(p.id, { name: e.target.value })} className="md:col-span-3 border border-onyx/10 px-3 py-2 text-sm font-display text-lg" />
              <select defaultValue={p.category_id ?? ""} onChange={(e) => updatePkg(p.id, { category_id: e.target.value || null })} className="md:col-span-3 border border-onyx/10 px-3 py-2 text-sm bg-white">
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="number" defaultValue={p.price ?? 0} onBlur={(e) => updatePkg(p.id, { price: Number(e.target.value) })} className="md:col-span-2 border border-onyx/10 px-3 py-2 text-sm" />
              <input defaultValue={p.currency} onBlur={(e) => updatePkg(p.id, { currency: e.target.value })} className="md:col-span-1 border border-onyx/10 px-3 py-2 text-sm" />
              <label className="md:col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked={p.featured} onChange={(e) => updatePkg(p.id, { featured: e.target.checked })} />
                Featured
              </label>
              <button onClick={() => delPkg(p.id)} className="md:col-span-1 text-destructive justify-self-end"><Trash2 className="size-4" /></button>
            </div>
            <textarea defaultValue={p.description ?? ""} onBlur={(e) => e.target.value !== p.description && updatePkg(p.id, { description: e.target.value })} className="w-full border border-onyx/10 px-3 py-2 text-sm mb-4" rows={2} placeholder="Description" />
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <label className="text-xs">
                <span className="eyebrow text-muted-foreground block mb-1">Duration</span>
                <input defaultValue={p.duration ?? ""} placeholder="e.g. 2 hours" onBlur={(e) => e.target.value !== (p.duration ?? "") && updatePkg(p.id, { duration: e.target.value || null })} className="w-full border border-onyx/10 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs">
                <span className="eyebrow text-muted-foreground block mb-1">Edited photos</span>
                <input type="number" min={0} defaultValue={p.photos_count ?? ""} placeholder="e.g. 40" onBlur={(e) => updatePkg(p.id, { photos_count: e.target.value ? Number(e.target.value) : null })} className="w-full border border-onyx/10 px-3 py-2 text-sm" />
              </label>
            </div>
            <div className="border-t border-onyx/10 pt-4">
              <div className="flex justify-between items-center mb-2">
                <p className="eyebrow text-muted-foreground">Features · {formatPrice(p.price, p.currency)}</p>
                <button onClick={() => addFeature(p.id)} className="eyebrow text-gold">+ Add</button>
              </div>
              <ul className="space-y-1">
                {(p.package_features ?? []).map((f: any) => (
                  <li key={f.id} className="flex items-center justify-between text-sm">
                    <span>· {f.feature}</span>
                    <button onClick={() => delFeature(f.id)} className="text-destructive"><Trash2 className="size-3" /></button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
