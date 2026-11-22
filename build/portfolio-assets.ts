import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";
import type { Plugin } from "vite";

const archiveDirectory = new URL("../gallery-assets/", import.meta.url);
const publicDirectory = new URL("../public/", import.meta.url);
const catalogUrl = new URL("../src/lib/published-portfolio.json", import.meta.url);
const assetPath = /^portfolio\/[a-z-]+\/[a-f0-9]{20}-(?:thumbnail|medium|large)-([a-f0-9]{12})\.webp$/;

function readPortfolioAssets() {
  const catalog = JSON.parse(readFileSync(catalogUrl, "utf8")) as Array<{
    variants: Record<string, { path: string; bytes: number }>;
  }>;
  const remaining = new Map(catalog
    .flatMap((photo) => Object.values(photo.variants))
    .filter((variant) => !existsSync(new URL(variant.path, publicDirectory)))
    .map(({ path, bytes }) => [path, bytes]));
  const output = new Map<string, Uint8Array>();

  for (const file of readdirSync(fileURLToPath(archiveDirectory)).filter((name) => name.endsWith(".zip")).sort()) {
    const archive = unzipSync(readFileSync(new URL(file, archiveDirectory)));
    for (const [path, bytes] of Object.entries(archive)) {
      const hash = assetPath.exec(path)?.[1];
      if (!hash || remaining.get(path) !== bytes.byteLength ||
          !createHash("sha256").update(bytes).digest("hex").startsWith(hash)) {
        throw new Error(`Unexpected or invalid portfolio image: ${path}`);
      }
      remaining.delete(path);
      output.set(path, bytes);
    }
  }

  if (remaining.size) throw new Error(`Missing portfolio images: ${[...remaining.keys()].join(", ")}`);
  return output;
}

/** Keep the upload archives out of the public build and serve each WebP individually. */
export function portfolioAssets(): Plugin {
  return {
    name: "portfolio-assets",
    generateBundle() {
      for (const [fileName, source] of readPortfolioAssets()) {
        this.emitFile({ type: "asset", fileName, source });
      }
    },
    configureServer(server) {
      const assets = readPortfolioAssets();
      server.middlewares.use((request, response, next) => {
        const path = request.url?.split("?")[0].slice(1) ?? "";
        const asset = assets.get(path);
        if (!asset) return next();
        response.setHeader("Content-Type", "image/webp");
        response.setHeader("Content-Length", asset.byteLength);
        response.end(request.method === "HEAD" ? undefined : Buffer.from(asset));
      });
    },
  };
}
