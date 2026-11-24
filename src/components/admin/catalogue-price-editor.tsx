import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cataloguePricesQuery, publishCataloguePrices, useCataloguePrices } from "@/features/catalogue/catalogue-prices";
import type { Product } from "@/features/catalogue/store";

export function CataloguePriceEditor({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch } = useCataloguePrices();
  const [revision, setRevision] = useState<string | null>(null);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dirty = Object.keys(changes).length > 0;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!data?.configured || !dirty || busy) return;
    const values: Record<string, number | null> = {};
    for (const [id, input] of Object.entries(changes)) {
      const amount = input.trim();
      const paise = Math.round(Number(amount) * 100);
      if (amount && (!/^\d+(?:\.\d{1,2})?$/.test(amount) || paise < 1 || paise > 100_000_000)) {
        setError("Enter a positive price with up to two decimals, or leave it blank for a quotation.");
        return;
      }
      values[id] = amount ? paise : null;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await publishCataloguePrices(product.id, revision, values);
      queryClient.setQueryData(cataloguePricesQuery.queryKey, updated);
      setChanges({});
      toast.success("Variant prices published");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not publish product prices.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-price-editor" onSubmit={save}>
      <h3>Public variant prices</h3>
      <p>Enter prices in rupees. A blank price shows “Price on request.”</p>
      {isPending ? <p role="status">Checking price storage…</p> : !data?.configured ? (
        <p role="status">{isError
          ? "Price storage could not be reached. Try reloading."
          : "Price publishing requires the private Cloudflare catalogue storage binding."}</p>
      ) : null}
      <div className="comparison-scroll">
        <table className="variant-editor-table">
          <thead><tr><th scope="col">Variant</th><th scope="col">Code</th><th scope="col">Price (₹)</th></tr></thead>
          <tbody>
            {product.variants.map((variant) => {
              const paise = data?.prices[variant.id];
              const saved = paise === undefined ? variant.price : paise === null ? null : paise / 100;
              return (
                <tr key={variant.id}>
                  <th scope="row">{variant.size} · {variant.finish}</th>
                  <td>{variant.id}</td>
                  <td><input
                    aria-label={"Rupee price for " + variant.id}
                    type="text" inputMode="decimal" maxLength={12} placeholder="On request"
                    disabled={!data?.configured || busy}
                    value={changes[variant.id] ?? saved ?? ""}
                    onChange={(event) => {
                      if (!dirty) setRevision(data?.revision ?? null);
                      const value = event.currentTarget.value;
                      setChanges((draft) => ({ ...draft, [variant.id]: value }));
                    }}
                  /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="ed-actions">
        <button type="submit" className="ed-button" disabled={!data?.configured || !dirty || busy}>
          {busy ? "Publishing…" : "Publish prices to site"}
        </button>
        <button type="button" className="ed-text-button" disabled={busy} onClick={() => {
          if (dirty && !window.confirm("Discard unsaved price changes and reload the published prices?")) return;
          setChanges({});
          setError("");
          void refetch();
        }}>Reload prices</button>
      </div>
    </form>
  );
}
