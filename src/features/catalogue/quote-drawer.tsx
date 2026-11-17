import { Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardList, Minus, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProducts, useQuote } from "./store";
import { ProductArt } from "./product-art";
import { toast } from "sonner";

export function QuoteDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const [quote, setQuote] = useQuote();
  const [products] = useProducts();
  function quantity(index: number, delta: number) {
    save(
      quote.map((line, i) =>
        i === index
          ? { ...line, quantity: Math.max(1, Math.min(9999, line.quantity + delta)) }
          : line,
      ),
    );
  }
  function save(lines: typeof quote) {
    try {
      setQuote(lines);
    } catch {
      toast.error(
        "Your browser could not save this change. Please check local storage and try again.",
      );
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rs-modal rs-quote-modal">
        <DialogHeader>
          <DialogTitle>Your quote list</DialogTitle>
          <DialogDescription>
            Your choices, saved in this browser. A quote list is not a confirmed order.
          </DialogDescription>
        </DialogHeader>
        {!quote.length ? (
          <div className="rs-empty">
            <ClipboardList size={36} strokeWidth={1.3} />
            <h3>Something personal starts here.</h3>
            <p>Choose a keepsake and a size. We’ll keep your selections together.</p>
            <Link to="/gifts" className="rs-button" onClick={() => onOpenChange(false)}>
              Explore photo gifts <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="rs-quote-lines">
              {quote.map((line, i) => {
                const p = products.find((p) => p.id === line.productId);
                const v = p?.variants.find((v) => v.id === line.variantId);
                return (
                  <article key={i}>
                    <ProductArt category={p?.category || "gift"} />
                    <div>
                      <Link
                        to="/gifts"
                        search={{ product: line.productId }}
                        onClick={() => onOpenChange(false)}
                        className="rs-quote-name"
                      >
                        {p?.name || line.productId}
                      </Link>
                      <p>
                        {v?.size || line.variantId} · {v?.finish}
                      </p>
                      <p>
                        {line.personalisation} · {line.packaging}
                      </p>
                      {line.design?.text && <p>Text: {line.design.text}</p>}
                      {line.design?.note && <p>Note: {line.design.note}</p>}
                      {line.design && (
                        <small>
                          {line.design.orientation} · {line.design.photoCount} photo reference(s),
                          to be supplied separately
                        </small>
                      )}
                      <div className="rs-line-controls">
                        <div className="rs-quantity">
                          <button
                            aria-label={`Decrease quantity for ${p?.name || line.productId}`}
                            disabled={line.quantity <= 1}
                            onClick={() => quantity(i, -1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span>{line.quantity}</span>
                          <button
                            aria-label={`Increase quantity for ${p?.name || line.productId}`}
                            disabled={line.quantity >= 9999}
                            onClick={() => quantity(i, 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span>Price to confirm</span>
                      </div>
                    </div>
                    <button
                      className="rs-icon"
                      aria-label={`Remove ${p?.name || line.productId}`}
                      onClick={() => save(quote.filter((_, j) => j !== i))}
                    >
                      <Trash2 size={17} />
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="rs-quote-end">
              <p>
                <strong>{quote.reduce((n, line) => n + line.quantity, 0)} item(s)</strong>
                <span>Quoted by the studio</span>
              </p>
              <small>
                Product availability, artwork, final price and collection or delivery are confirmed
                before production. Photos used in the preview are not stored or sent.
              </small>
              <Link to="/contact" className="rs-button" onClick={() => onOpenChange(false)}>
                Continue to enquiry <ArrowRight size={16} />
              </Link>
              <small>This preview saves enquiries locally; nothing is sent to the studio.</small>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
