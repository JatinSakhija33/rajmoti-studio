import { clearDemoMedia } from "./media-storage";
import { liveBackend, backendConfigured } from "@/lib/backend-mode";
import { Link } from "@tanstack/react-router";
import {useGiftCheckoutReady} from "@/features/catalogue/gift-checkout-status";
export function DemoBar() {
  const giftReady=useGiftCheckoutReady();
  return (
    <>
      <div className="demo-bar">
        <strong>
          {giftReady ? "GIFT ORDERING CONNECTED" : liveBackend
            ? backendConfigured
              ? "SUPABASE MODE"
              : "SUPABASE SETUP REQUIRED"
            : "PRIVATE PREVIEW"}
        </strong>
        <span>
          {giftReady ? "Private gift uploads · Direct UPI · Manual bank verification" : liveBackend
            ? "Owner photos use Supabase · Catalogue & checkout remain demonstrations"
            : "Owner photo uploads stay in this browser · No live orders"}
        </span>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/portfolios">Galleries</Link>
          <Link to="/gifts">Gifts</Link>
          <Link to="/admin/workflow">Owner workflow</Link>
          <button
            onClick={async () => {
              if (confirm("Reset all demonstration changes in this browser?")) {
                await clearDemoMedia();
                Object.keys(localStorage)
                  .filter((k) => k.startsWith("rajmoti:"))
                  .forEach((k) => localStorage.removeItem(k));
                location.reload();
              }
            }}
          >
            Reset demo
          </button>
        </nav>
      </div>
      <div className="demo-bar-space" />
    </>
  );
}
