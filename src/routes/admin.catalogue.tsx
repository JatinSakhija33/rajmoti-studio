import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Save, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  categories,
  useProducts,
  seedProducts,
  exportCatalogue,
  type Product,
} from "@/features/catalogue/store";
export const Route = createFileRoute("/admin/catalogue")({
  head: () => ({ meta: [{ title: "Catalogue manager — Rajmoti Studio demo" }] }),
  component: Manager,
});
function Manager() {
  const [products, setProducts] = useProducts();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const matches = products.filter((p) =>
    `${p.id} ${p.name}`.toLowerCase().includes(search.toLowerCase()),
  );
  function save() {
    if (!draft) return;
    if (
      !draft.name.trim() ||
      !draft.id.trim() ||
      !draft.variants.length ||
      draft.variants.some((v) => !v.id.trim() || !v.size.trim())
    ) {
      setError("Product name, code and at least one complete variant are required.");
      return;
    }
    if (!draft.personalisation.length || !draft.packaging.length || !draft.orderTypes.length) {
      setError("Add at least one personalisation, packaging and order type option.");
      return;
    }
    if (new Set(draft.variants.map((v) => v.id)).size !== draft.variants.length) {
      setError("Variant codes must be unique.");
      return;
    }
    try {
      setProducts([...products.filter((p) => p.id !== draft.id), draft]);
      setDraft(null);
      setError("");
      toast.success("Demo catalogue updated in this browser");
    } catch {
      setError("Could not save. Check browser storage.");
    }
  }
  function add() {
    const id = `NEW-${Date.now().toString(36).toUpperCase()}`;
    setDraft({
      ...structuredClone(seedProducts[0]),
      id,
      name: "New demonstration product",
      category: "frames",
      variants: [
        {
          id: id + "-01",
          size: "Custom — to confirm",
          metric: null,
          thickness: "Not specified",
          finish: "To confirm",
          price: null,
          status: "Proposed — supplier confirmation required",
        },
      ],
    });
    setError("");
  }
  return (
    <div className="editorial catalogue-admin">
      <p className="ed-kicker">Owner workspace · demonstration only</p>
      <div className="ed-section-heading">
        <div>
          <h1>Product catalogue</h1>
          <p>
            {products.length} products · {products.reduce((n, p) => n + p.variants.length, 0)}{" "}
            variants · browser-local data
          </p>
        </div>
        <div className="ed-actions">
          <button className="ed-button outline" onClick={() => exportCatalogue(products)}>
            <Download size={16} />
            Export master CSV
          </button>
          <button className="ed-button" onClick={add}>
            <Plus size={16} />
            New product
          </button>
        </div>
      </div>
      <p className="ed-notice">
        Edits appear in the public demo directory on this browser. They do not confirm supplier
        stock or publish a live catalogue. Product photography, prices and timings still need
        verification.
      </p>
      {draft ? (
        <div className="admin-product-editor">
          <h2>{draft.name}</h2>
          <div className="admin-fields">
            {(
              [
                "name",
                "id",
                "type",
                "material",
                "shape",
                "printing",
                "usage",
                "photoCapacity",
                "production",
              ] as const
            ).map((key) => (
              <label key={key}>
                {
                  {
                    name: "Product name",
                    id: "Product code",
                    type: "Product type",
                    material: "Material",
                    shape: "Shape",
                    printing: "Printing method",
                    usage: "Usage",
                    photoCapacity: "Photo capacity",
                    production: "Preparation information",
                  }[key]
                }
                <input
                  value={draft[key]}
                  readOnly={key === "id"}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                />
              </label>
            ))}
            <label>
              Product family
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Availability (demo)
              <select
                value={draft.availability}
                onChange={(e) => setDraft({ ...draft, availability: e.target.value })}
              >
                {["To confirm", "Active (demo only)", "Discontinued"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Description
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </label>
          <div className="admin-fields">
            {(
              ["orientation", "personalisation", "orderTypes", "packaging", "delivery"] as const
            ).map((key) => (
              <label key={key}>
                {key} · separate with commas
                <input
                  value={draft[key].join(", ")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      [key]: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
            ))}
          </div>
          <h3>Variant directory</h3>
          <div className="comparison-scroll">
            <table className="variant-editor-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Size</th>
                  <th>Metric</th>
                  <th>Thickness</th>
                  <th>Finish</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {draft.variants.map((v, i) => (
                  <tr key={i}>
                    {(["id", "size", "metric", "thickness", "finish"] as const).map((key) => (
                      <td key={key}>
                        <input
                          aria-label={`${key} for variant ${i + 1}`}
                          value={v[key] || ""}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              variants: draft.variants.map((row, j) =>
                                j === i
                                  ? {
                                      ...row,
                                      [key]:
                                        key === "metric" ? e.target.value || null : e.target.value,
                                    }
                                  : row,
                              ),
                            })
                          }
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        aria-label={`Remove variant ${i + 1}`}
                        onClick={() =>
                          setDraft({ ...draft, variants: draft.variants.filter((_, j) => j !== i) })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="ed-text-button"
            onClick={() =>
              setDraft({
                ...draft,
                variants: [
                  ...draft.variants,
                  {
                    id: `${draft.id}-${crypto.randomUUID().slice(0, 5)}`,
                    size: "Custom",
                    metric: null,
                    thickness: "Not specified",
                    finish: "To confirm",
                    price: null,
                    status: "Proposed — supplier confirmation required",
                  },
                ],
              })
            }
          >
            <Plus size={16} />
            Add variant
          </button>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="ed-actions">
            <button className="ed-button" onClick={save}>
              <Save size={16} />
              Save demonstration product
            </button>
            <button className="ed-button outline" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <input
            className="admin-search"
            aria-label="Find a product to edit"
            placeholder="Find a product by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="comparison-scroll">
            <table className="admin-catalogue-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Product</th>
                  <th>Family</th>
                  <th>Variants</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {matches.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{categories.find((c) => c.id === p.category)?.name}</td>
                    <td>{p.variants.length}</td>
                    <td>{p.availability}</td>
                    <td>
                      <button
                        onClick={() => {
                          setDraft(structuredClone(p));
                          setError("");
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!matches.length && <p>No products match this search.</p>}
        </>
      )}
    </div>
  );
}
