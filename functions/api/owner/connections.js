import { failure, json, requireOwner } from "../../_lib/security.js";

export async function onRequestGet({ request, env }) {
  try {
    await requireOwner(request, env);
  } catch (error) {
    return failure(error.message, error.status || 500);
  }

  let orders = "binding-missing";
  if (env.ORDER_DB) {
    try {
      await env.ORDER_DB.prepare(
        "SELECT (SELECT verified_paid_paise FROM orders LIMIT 1), (SELECT slot_index FROM order_photos LIMIT 1), (SELECT verified_at FROM order_payments LIMIT 1)",
      ).first();
      orders = "ready";
    } catch {
      orders = "unavailable";
    }
  }
  return json({
    orders,
    giftPhotoStorage: Boolean(env.ORDER_PHOTOS),
    studioPhotoStorage: Boolean(env.STUDIO_PRIVATE_FILES),
  });
}
