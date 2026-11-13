import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
export default defineConfig({plugins:[tanstackRouter({target:"react",autoCodeSplitting:true,routeFileIgnorePattern:"(api/|sitemap)"}),react(),tailwindcss(),tsconfigPaths()],server:{host:"0.0.0.0"}});
