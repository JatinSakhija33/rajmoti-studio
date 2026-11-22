import { json, UPI_CONFIG, STANDARD_DELIVERY_CHARGE_PAISE } from "../../_lib/security.js";
export function onRequestGet({ env }) {
  const enabled = env.GIFT_CHECKOUT_ENABLED === "true" && env.GIFT_PRODUCTION_APPROVED === "true" && !!env.ORDER_DB && !!env.ORDER_PHOTOS && !!env.ORDER_UPLOAD_SECRET && env.ORDER_UPLOAD_SECRET.length >= 32 && !!env.TURNSTILE_SECRET_KEY && !!env.TURNSTILE_SITE_KEY;
  return json({ enabled, turnstileSiteKey: enabled ? env.TURNSTILE_SITE_KEY : null, deliveryChargePaise: STANDARD_DELIVERY_CHARGE_PAISE, payeeVpa: enabled ? UPI_CONFIG.payeeVpa : null, beneficiaryName: enabled ? UPI_CONFIG.payeeName : null });
}
