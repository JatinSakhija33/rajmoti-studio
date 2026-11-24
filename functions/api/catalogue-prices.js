import { catalogueStore, readCataloguePrices, validatePriceChanges, writeCataloguePrices } from "../_lib/catalogue-prices.js";
import { assertOrigin, failure, json, requireOwner } from "../_lib/security.js";

export async function onRequestGet({ env }) {
  const store = catalogueStore(env);
  try {
    return json({ configured: Boolean(store), ...(await readCataloguePrices(store)) });
  } catch {
    return failure("Catalogue prices are temporarily unavailable", 503);
  }
}

export async function onRequestPost({ env, request }) {
  try {
    assertOrigin(request);
  } catch {
    return failure("Request origin does not match website", 403);
  }
  try {
    await requireOwner(request, env);
    const store = catalogueStore(env);
    if (!store) return failure("Catalogue price storage is not configured", 503);
    if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json") {
      return failure("Send price changes as JSON", 415);
    }

    const reader = request.body?.getReader();
    if (!reader) return failure("Price changes are required", 400);
    const decoder = new TextDecoder();
    let body = "";
    let length = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 32768) {
        await reader.cancel();
        return failure("The price update is too large", 413);
      }
      body += decoder.decode(value, { stream: true });
    }
    const input = JSON.parse(body + decoder.decode());
    if (!validatePriceChanges(input?.productId, input?.prices)) {
      return failure("Use a valid rupee amount or leave the price on request for each variant", 400);
    }
    const saved = await writeCataloguePrices(store, input.revision, input.prices);
    if (!saved) return failure("Prices changed in another session. Reload prices before publishing.", 409);
    return json({ configured: true, ...saved });
  } catch (error) {
    if (error instanceof SyntaxError) return failure("Invalid price update", 400);
    return failure(error?.status ? error.message : "Could not publish product prices", error?.status || 500);
  }
}
