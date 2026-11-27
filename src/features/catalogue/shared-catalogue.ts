import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "./store";

/**
 * Published catalogue overrides are shared across customers and devices.
 * Seed products remain visible if the optional table has not been migrated.
 * Prices remain governed by the existing verified catalogue pricing service.
 */
type Row = { product_id: string; product: Product; published: boolean };
export function useSharedCatalogue() {
  const [overrides, setOverrides] = useState<Product[]>([]);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("gift_catalogue_overrides" as any)
        .select("product_id,product,published")
        .eq("published", true)
        .limit(1000);
      if (error) {
        // Keep the existing seed catalogue usable during gradual rollout.
        if (import.meta.env.DEV) console.warn("Shared catalogue not ready:", error.message);
        return;
      }
      if (active) {
        const products = ((data ?? []) as unknown as Row[])
          .map(row => row.product)
          .filter(product => product && typeof product.id === "string" && Array.isArray(product.variants));
        setOverrides(products);
      }
    };
    void load();
    const channel = supabase
      .channel("gift-catalogue-changes")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "gift_catalogue_overrides",
      }, () => setRevision(current => current + 1))
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [revision]);
  return overrides;
}

export async function publishGiftProduct(product: Product) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Sign in as a studio administrator to publish products.");
  const { error } = await supabase.from("gift_catalogue_overrides" as any).upsert({
    product_id: product.id,
    product,
    published: true,
    updated_by: auth.user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "product_id" });
  if (error) throw new Error(error.message);
}
