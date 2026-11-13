import { useLocal, useProducts, type SavedStyle, type QuoteLine } from "@/features/catalogue/store";
type Enquiry = {
  id: string;
  type: string;
  date: string;
  name: string;
  phone: string;
  age: string | null;
  package: string | null;
  styles: SavedStyle[];
  quote: QuoteLine[];
  status: string;
  createdAt: string;
};
export function DemoEnquiryInbox() {
  const [items, setItems] = useLocal<Enquiry[]>("rajmoti:editorial:enquiries:v2", []);
  const [products] = useProducts();
  return (
    <section className="editorial mb-10">
      <h2 className="font-display text-2xl mb-3">Website demonstration enquiries</h2>
      <p className="ed-notice">
        Saved by the new enquiry form in this browser only. Status changes below are simulated; they
        do not confirm a real booking or send messages.
      </p>
      {!items.length ? (
        <p className="py-5 text-sm">
          No demonstration enquiries yet. Save one from the website to test the complete journey.
        </p>
      ) : (
        <div className="space-y-3 mt-4">
          {[...items].reverse().map((item) => (
            <details key={item.id} className="border border-stone-300 p-4 bg-white">
              <summary className="cursor-pointer text-sm">
                <strong>{item.name}</strong> · {item.type} · {item.date || "Date to agree"} ·{" "}
                {item.status.replaceAll("_", " ")}
              </summary>
              <div className="mt-4 space-y-3 text-sm">
                <p>
                  {item.id} · {item.phone}
                </p>
                {item.package && <p>Collection: {item.package}</p>}
                {item.age && <p>Baby age: {item.age}</p>}
                <p>
                  Saved styles:{" "}
                  {item.styles.map((s) => s.title + " (" + s.id + ")").join(", ") || "None"}
                </p>
                {item.quote.map((line, i) => {
                  const product = products.find((p) => p.id === line.productId);
                  const variant = product?.variants.find((v) => v.id === line.variantId);
                  return (
                    <p key={i}>
                      {product?.name || line.productId} · {variant?.size || line.variantId} · Qty{" "}
                      {line.quantity} · {line.personalisation} · {line.packaging} · {line.orderType}
                    </p>
                  );
                })}
                <label>
                  Demonstration status{" "}
                  <select
                    aria-label={`Status for ${item.id}`}
                    className="border p-2 ml-2"
                    value={item.status}
                    onChange={(e) =>
                      setItems(
                        items.map((x) => (x.id === item.id ? { ...x, status: e.target.value } : x)),
                      )
                    }
                  >
                    <option value="awaiting_confirmation">Awaiting confirmation</option>
                    <option value="follow_up">Follow up (demo)</option>
                    <option value="reviewed">Reviewed (demo)</option>
                    <option value="closed">Closed (demo)</option>
                  </select>
                </label>
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
