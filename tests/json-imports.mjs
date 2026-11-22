// Test-only bridge: Node requires JSON import attributes; Wrangler 3 bundles plain JSON imports.
// Production catalogue files and the Functions dependency graph stay unchanged.
import { register } from "node:module";
import { isMainThread } from "node:worker_threads";

if (isMainThread) register(import.meta.url);

export async function load(url, context, nextLoad) {
  return nextLoad(url, url.endsWith(".json")
    ? { ...context, importAttributes: { ...context.importAttributes, type: "json" } }
    : context);
}
