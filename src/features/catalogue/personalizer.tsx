import { useEffect, useRef, useState } from "react";
import { ArrowRight, ImagePlus, Info, Plus, RotateCcw, ShieldCheck, X } from "lucide-react";
import { categories, type Product, type QuoteLine } from "./store";
import { validQuantity, validatePreviewFiles } from "./discovery";
import { ProductArt } from "./product-art";
import { formatPrice } from "@/lib/site";

type Photo = { file: File; url: string; width: number; height: number };
function loadPhoto(file: File): Promise<Photo> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () =>
      resolve({ file, url, width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error("One of these files could not be read as a photo. Please choose another image."),
      );
    };
    image.src = url;
  });
}

export function ProductDetail({
  product: p,
  onAdd,
}: {
  product: Product;
  onAdd: (line: QuoteLine) => void;
}) {
  const [variantId, setVariant] = useState(p.variants[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [personalisation, setPersonalisation] = useState(p.personalisation[0] || "Photo");
  const [packaging, setPackaging] = useState(p.packaging[0] || "Standard");
  const [orderType, setOrderType] = useState(p.orderTypes[0] || "Printed");
  const [orientation, setOrientation] = useState(p.orientation[0] || "Portrait");
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const livePhotos = useRef<Photo[]>([]);
  const mounted = useRef(true);
  const loading = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      livePhotos.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);
  const v = p.variants.find((v) => v.id === variantId);
  const photo = photos[selectedPhoto];
  const dimensions = v?.size.match(/^(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*in/i);
  const small = dimensions ? Math.min(Number(dimensions[1]), Number(dimensions[2])) : 4;
  const large = dimensions ? Math.max(Number(dimensions[1]), Number(dimensions[2])) : 5;
  const ratio = /square|round|circle/i.test(p.shape)
    ? 1
    : orientation === "Landscape"
      ? large / small
      : small / large;
  const dpi =
    photo && dimensions
      ? Math.min(
          photo.width / (orientation === "Landscape" ? large : small),
          photo.height / (orientation === "Landscape" ? small : large),
        ) / zoom
      : undefined;
  const round = /round|circle/i.test(p.shape);
  async function choose(files: File[]) {
    if (loading.current || !files.length) return;
    const validation = validatePreviewFiles(
      files,
      livePhotos.current.map((p) => p.file),
    );
    setError(validation);
    if (validation) return;
    loading.current = true;
    setBusy(true);
    const results = await Promise.allSettled(files.map(loadPhoto));
    const loaded = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const failed = results.find((r) => r.status === "rejected");
    loading.current = false;
    if (!mounted.current || failed) {
      loaded.forEach((p) => URL.revokeObjectURL(p.url));
      if (mounted.current) {
        setError("A photo could not be read. Please use a valid JPG, PNG or WebP file.");
        setBusy(false);
      }
      return;
    }
    livePhotos.current = [...livePhotos.current, ...loaded];
    setPhotos(livePhotos.current);
    setBusy(false);
  }
  function remove(index: number) {
    URL.revokeObjectURL(photos[index].url);
    livePhotos.current = photos.filter((_, i) => i !== index);
    setPhotos(livePhotos.current);
    setSelectedPhoto(0);
    setZoom(1);
    setX(50);
    setY(50);
  }
  if (!v)
    return <p>No size options are available for this record. Please ask the studio for details.</p>;
  return (
    <>
      <div className="rs-personalizer">
        <div className="rs-preview-column">
          <div className="rs-preview-stage">
            <span className="rs-preview-label">
              <span className="rs-live-dot" />
              YOUR DESIGN REFERENCE
            </span>
            {photo ? (
              <div
                className={`rs-photo-preview ${round ? "round" : ""}`}
                style={{ aspectRatio: ratio, maxWidth: `${Math.min(350, 330 * ratio)}px` }}
              >
                <div className="rs-photo-crop">
                  <img
                    src={photo.url}
                    alt="Your selected photo preview"
                    style={{
                      objectPosition: `${x}% ${y}%`,
                      transform: `scale(${zoom})`,
                      transformOrigin: `${x}% ${y}%`,
                    }}
                  />
                </div>
                {text && <span className="rs-preview-text">{text}</span>}
              </div>
            ) : (
              <ProductArt category={p.category} shape={p.shape} />
            )}
            {!photo && (
              <label className="rs-quick-upload" data-local-preview="true">
                <ImagePlus size={16} /> Try your photo
                <input
                  className="rs-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Quick photo preview"
                  disabled={busy}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    e.target.value = "";
                    void choose(files);
                  }}
                />
              </label>
            )}
            <span className="rs-preview-size">
              {v.size} · {orientation.toLowerCase()}
            </span>
          </div>
          <p className="rs-caption">
            Layout reference, not a finished product proof. The studio confirms crop, colour,
            material and artwork.
          </p>
          {photos.length > 0 && (
            <div className="rs-photo-thumbnails">
              {photos.map((photo, i) => (
                <div key={photo.url}>
                  <button
                    className={selectedPhoto === i ? "selected" : ""}
                    aria-label={`Preview photo ${i + 1}`}
                    aria-pressed={selectedPhoto === i}
                    onClick={() => {
                      setSelectedPhoto(i);
                      setZoom(1);
                      setX(50);
                      setY(50);
                    }}
                  >
                    <img src={photo.url} alt={`Selected reference ${i + 1}`} />
                  </button>
                  <button
                    className="rs-photo-remove"
                    aria-label={`Remove photo ${i + 1}`}
                    onClick={() => remove(i)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photo && (
            <div className="rs-crop-controls">
              <div className="rs-control-heading">
                <strong>Adjust your photo</strong>
                <button
                  className="rs-text-link"
                  onClick={() => {
                    setZoom(1);
                    setX(50);
                    setY(50);
                  }}
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              </div>
              <label>
                Zoom <span>{zoom.toFixed(1)}×</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </label>
              <label>
                Horizontal position
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={x}
                  onChange={(e) => setX(Number(e.target.value))}
                />
              </label>
              <label>
                Vertical position
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={y}
                  onChange={(e) => setY(Number(e.target.value))}
                />
              </label>
              {dpi != null && dpi < 150 && (
                <p className="rs-quality-note">
                  <Info size={15} />
                  This photo may look soft at the selected size. Try the original file or a smaller
                  size; ask the studio to check print quality.
                </p>
              )}
            </div>
          )}
          <div className="rs-private-note">
            <ShieldCheck size={19} />
            <p>
              Private, on-device preview.
              <br />
              <span>
                Photos stay in memory while this panel is open. They are never uploaded or saved in
                your quote list.
              </span>
            </p>
          </div>
        </div>
        <div className="rs-config-column">
          <p className="rs-eyebrow">
            {categories.find((c) => c.id === p.category)?.name} · {p.id}
          </p>
          <p className="rs-product-description">{p.description}</p>
          <div className="rs-price-block">
            <strong>{formatPrice(v.price)}</strong>
            <span>
              {v.price == null
                ? "Final price & availability confirmed by the studio"
                : "Listed variant price · final fulfilment confirmed by the studio"}
            </span>
          </div>
          <section className="rs-config-step" data-local-preview="true">
            <h3>
              <span>1</span>Add your photo
            </h3>
            <label
              className="rs-upload"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void choose(Array.from(e.dataTransfer.files));
              }}
            >
              <input
                className="rs-file-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                aria-label="Choose photos for local preview"
                disabled={busy}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  e.target.value = "";
                  void choose(files);
                }}
              />
              <ImagePlus size={24} strokeWidth={1.3} />
              <strong>
                {busy
                  ? "Reading your photos…"
                  : photos.length
                    ? "Add another photo"
                    : "Choose photos or drop them here"}
              </strong>
              <span>JPG, PNG, WebP · up to 5 photos · 10 MB each</span>
            </label>
            <p className="rs-caption">
              Optional for a quote. Preview files are not sent with your enquiry.
            </p>
            {error && (
              <p className="rs-form-error" role="alert">
                {error}
              </p>
            )}
          </section>
          <section className="rs-config-step">
            <h3>
              <span>2</span>Make it yours
            </h3>
            <label>
              Size & finish
              <select
                aria-label="Size & finish"
                value={variantId}
                onChange={(e) => setVariant(e.target.value)}
              >
                {p.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.size} · {v.finish}
                    {v.thickness !== "Not specified" ? ` · ${v.thickness}` : ""}
                  </option>
                ))}
              </select>
            </label>
            {v.metric && <small className="rs-caption">{v.metric}</small>}
            <div className="rs-config-pair">
              <label>
                Orientation
                <select
                  aria-label="Orientation"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                >
                  {p.orientation.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
              <label>
                Personalization
                <select
                  aria-label="Personalization"
                  value={personalisation}
                  onChange={(e) => {
                    setPersonalisation(e.target.value);
                    setText("");
                  }}
                >
                  {p.personalisation.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
            </div>
            {/text|name|logo/i.test(personalisation) && (
              <label>
                Your text (optional)
                <input
                  maxLength={80}
                  value={text}
                  placeholder="A name, a date, a little love…"
                  onChange={(e) => setText(e.target.value)}
                />
                <small>{text.length}/80 characters · placement to confirm</small>
              </label>
            )}
            <div className="rs-config-pair">
              <label>
                Packaging
                <select
                  aria-label="Packaging"
                  value={packaging}
                  onChange={(e) => setPackaging(e.target.value)}
                >
                  {p.packaging.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
              <label>
                Order type
                <select
                  aria-label="Order type"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                >
                  {p.orderTypes.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              A note for the studio (optional)
              <textarea
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tell us about your layout, occasion or preferred details."
              />
            </label>
          </section>
          <section className="rs-config-step rs-review">
            <h3>
              <span>3</span>Save your selection
            </h3>
            <p>
              {v.size} · {v.finish} · {orientation}
            </p>
            <div className="rs-buy-row">
              <label className="rs-qty-label">
                Quantity
                <input
                  aria-label="Product quantity"
                  type="number"
                  min="1"
                  max="9999"
                  step="1"
                  value={Number.isNaN(quantity) ? "" : quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value === "" ? NaN : Number(e.target.value))
                  }
                />
              </label>
              <button
                className="rs-button"
                disabled={busy || !validQuantity(quantity) || p.availability === "Discontinued"}
                onClick={() =>
                  onAdd({
                    productId: p.id,
                    variantId,
                    quantity,
                    personalisation,
                    packaging,
                    orderType,
                    design: {
                      text,
                      note,
                      orientation,
                      photoCount: photos.length,
                      zoom,
                      x,
                      y,
                      ...(photos.length ? { referenceId: crypto.randomUUID() } : {}),
                    },
                  })
                }
              >
                Add to quote list <ArrowRight size={16} />
              </button>
            </div>
            {!validQuantity(quantity) && (
              <p role="alert" className="rs-form-error">
                Choose a whole quantity between 1 and 9999.
              </p>
            )}
            <p className="rs-caption">
              {p.availability === "Discontinued"
                ? "This product is discontinued."
                : "Save choices now. Confirm stock, artwork, price and delivery before production. No payment is taken here."}
            </p>
          </section>
        </div>
      </div>
      <details className="rs-specifications">
        <summary>
          Product details & size guide <Plus size={17} />
        </summary>
        <dl>
          {Object.entries({
            Material: p.material,
            Shape: p.shape,
            "Photo capacity": p.photoCapacity,
            Printing: p.printing,
            Usage: p.usage,
            Preparation: p.production,
            Fulfilment: p.delivery.join(" / "),
            Availability: p.availability,
          }).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="rs-table-scroll">
          <table>
            <caption>Existing catalogue specifications · studio confirmation required</caption>
            <thead>
              <tr>
                <th>Size</th>
                <th>Metric</th>
                <th>Thickness</th>
                <th>Finish</th>
              </tr>
            </thead>
            <tbody>
              {p.variants.map((v) => (
                <tr key={v.id}>
                  <td>{v.size}</td>
                  <td>{v.metric || "To confirm"}</td>
                  <td>{v.thickness}</td>
                  <td>{v.finish}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
