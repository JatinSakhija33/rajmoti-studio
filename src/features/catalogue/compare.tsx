import { useState } from "react";
import type { Product } from "./store";
export function Compare({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const rows = [
    "Material",
    "Shape",
    "Size",
    "Thickness",
    "Finish",
    "Printing",
    "Photo capacity",
    "Personalisation",
    "Packaging",
    "Availability",
    "Price",
  ];
  return (
    <div className="comparison-scroll">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Detail</th>
            {products.map((p) => (
              <th key={p.id}>
                {p.name}
                <select
                  aria-label={`Variant for ${p.name}`}
                  value={selected[p.id] || p.variants[0].id}
                  onChange={(e) => setSelected({ ...selected, [p.id]: e.target.value })}
                >
                  {p.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.size} · {v.finish}
                    </option>
                  ))}
                </select>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((key) => (
            <tr key={key}>
              <th>{key}</th>
              {products.map((p) => {
                const v = p.variants.find((v) => v.id === (selected[p.id] || p.variants[0].id))!;
                const data: Record<string, string> = {
                  Material: p.material,
                  Shape: p.shape,
                  Size: v.size,
                  Thickness: v.thickness,
                  Finish: v.finish,
                  Printing: p.printing,
                  "Photo capacity": p.photoCapacity,
                  Personalisation: p.personalisation.join(", "),
                  Packaging: p.packaging.join(", "),
                  Availability: p.availability,
                  Price: "To be quoted",
                };
                return <td key={p.id}>{data[key]}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
