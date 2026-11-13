import { clearDemoMedia } from "./media-storage";
import { liveBackend, backendConfigured } from "@/lib/backend-mode";
import { Link } from "@tanstack/react-router";
export function DemoBar() {
  return (
    <>
      <div className="demo-bar">
        <strong>
          {liveBackend
            ? backendConfigured
              ? "SUPABASE MODE"
              : "SUPABASE SETUP REQUIRED"
            : "PRIVATE PREVIEW"}
        </strong>
        <span>
          {liveBackend
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
