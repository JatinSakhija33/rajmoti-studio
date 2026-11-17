import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { MobileCtaBar } from "@/components/mobile-cta-bar";

export const Route = createFileRoute("/portfolios")({
  component: () => (
    <div className="bg-cream text-onyx min-h-dvh">
      <SiteNav />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter />
      <WhatsAppFloat />
      <MobileCtaBar />
    </div>
  ),
});
