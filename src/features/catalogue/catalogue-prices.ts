import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CataloguePrices = {
  configured: boolean;
  revision: string | null;
  prices: Record<string, number | null>;
};

const endpoint = "/api/catalogue-prices";
export const cataloguePricesQuery = queryOptions({
  queryKey: ["catalogue-prices"],
  staleTime: 15000,
  retry: false,
  queryFn: async (): Promise<CataloguePrices> => {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Catalogue prices are temporarily unavailable.");
    return response.json();
  },
});

export function useCataloguePrices() {
  return useQuery(cataloguePricesQuery);
}

export async function publishCataloguePrices(
  productId: string,
  revision: string | null,
  prices: CataloguePrices["prices"],
): Promise<CataloguePrices> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in as studio admin to publish prices.");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ productId, prices, revision }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not publish product prices.");
  return result;
}
