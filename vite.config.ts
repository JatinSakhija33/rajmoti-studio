import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { portfolioAssets } from "./build/portfolio-assets";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true, routeFileIgnorePattern: "^(api$|sitemap)" }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    portfolioAssets(),
  ],
  server: { host: "0.0.0.0" },
});
