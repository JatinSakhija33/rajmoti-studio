import {
  json,
  failure,
  cleanOrder,
  verifyTurnstile,
  assertOrigin,
  signUpload,
  signTracking,
  buildUpiUri,
  UPI_CONFIG,
} from "../_lib/security.js";

export async function onRequestPost({ request, env }) {
  if (!env.ORDER_DB || !env.TURNSTILE_SECRET_KEY || !env.ORDER_UPLOAD_SECRET) {
    return failure("Ordering is not configured", 503);
  }
  try {
    assertOrigin(request);
    if (Number(request.headers.get("Content-Length") || 0) > 35000) {
      return failure("Request too large", 413);
    }
    const raw = await request.json();
    await verifyTurnstile(request, env, raw.turnstileToken);
    const order = cleanOrder(raw);
    const id = crypto.randomUUID();

    // Determine photo limit dynamically: up to 20 for magazines/albums, 5 for standard gifts
    const isMagazine =
      String(order.kind || "").toLowerCase().includes("magazine") ||
      JSON.stringify(order.quote || []).toLowerCase().includes("magazine");
    const photoLimit = isMagazine ? 20 : 5;
    const publicRef = "RJ-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    const attemptRef = "PAY-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const customization = raw.customization ? JSON.stringify(raw.customization).slice(0, 8000) : "{}";

    const fulfillment = order.fulfillment; // 'home_delivery' | 'studio_collection'
    const addressJson = JSON.stringify(order.address || {});
    const deliveryChargePaise = order.deliveryChargePaise;
    const totalAmountPaise = order.totalAmountPaise;
    const quotedTotalInr = Math.round(totalAmountPaise / 100);

    const paymentMethod = order.paymentChoice === "pay_online" ? "upi_online" : "pay_at_studio";
    const paymentStatus = order.paymentChoice === "pay_at_studio" ? "pay_at_studio" : "unpaid";

    const upiUri =
      totalAmountPaise > 0
        ? buildUpiUri({
            amountPaise: totalAmountPaise,
            publicRef,
            note: `Order ${publicRef} - Rajmoti Studio`,
          })
        : "";

    try {
      await env.ORDER_DB.prepare(
        `INSERT INTO orders(
          id,request_key,source,customer_name,phone,service_type,preferred_date,baby_age,package_slug,
          styles_json,items_json,notes,public_ref,photo_limit,customization_json,
          fulfillment_type,delivery_address_json,delivery_charge_paise,total_amount_paise,verified_paid_paise,
          payment_method,payment_attempt_ref,payment_status,quoted_total
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING`,
      )
        .bind(
          id,
          order.clientRequestId,
          "website",
          order.name,
          order.phone,
          order.kind,
          order.date,
          order.age,
          order.collection,
          JSON.stringify(order.styles),
          JSON.stringify(order.quote),
          order.notes,
          publicRef,
          photoLimit,
          customization,
          fulfillment,
          addressJson,
          deliveryChargePaise,
          totalAmountPaise,
          0, // verified_paid_paise begins at 0 until verified by owner
          paymentMethod,
          attemptRef,
          paymentStatus,
          quotedTotalInr,
        )
        .run();

      // If paying online, initialize payment attempt in order_payments
      if (totalAmountPaise > 0 && order.paymentChoice === "pay_online") {
        try {
          await env.ORDER_DB.prepare(
            `INSERT INTO order_payments(id, order_id, attempt_ref, amount_paise, method, status, payee_upi, beneficiary_name)
             VALUES(?,?,?,?,?,?,?,?)`,
          )
            .bind(
              crypto.randomUUID(),
              id,
              attemptRef,
              totalAmountPaise,
              "upi",
              "pending_verification",
              UPI_CONFIG.payeeVpa,
              UPI_CONFIG.payeeName,
            )
            .run();
        } catch {
          // Non-fatal if order_payments not yet migrated
        }
      }
    } catch {
      // Fallback for earlier database schema
      await env.ORDER_DB.prepare(
        "INSERT INTO orders(id,request_key,source,customer_name,phone,service_type,preferred_date,baby_age,package_slug,styles_json,items_json,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING",
      )
        .bind(
          id,
          order.clientRequestId,
          "website",
          order.name,
          order.phone,
          order.kind,
          order.date,
          order.age,
          order.collection,
          JSON.stringify(order.styles),
          JSON.stringify(order.quote),
          order.notes,
        )
        .run();
    }

    const found = await env.ORDER_DB.prepare("SELECT * FROM orders WHERE request_key=?")
      .bind(order.clientRequestId)
      .first();
    if (!found) return failure("Order could not be saved", 500);

    const reference = found.public_ref || publicRef;
    const activePhotoLimit = Number(found.photo_limit) || photoLimit;

    return json(
      {
        id: found.id,
        reference,
        publicRef: reference,
        attemptRef,
        fulfillment,
        paymentChoice: order.paymentChoice,
        totalAmountPaise,
        deliveryChargePaise,
        photoLimit: activePhotoLimit,
        upiUri,
        payeeVpa: UPI_CONFIG.payeeVpa,
        beneficiaryName: UPI_CONFIG.payeeName,
        uploadToken: await signUpload(found.id, env.ORDER_UPLOAD_SECRET),
        trackingToken: await signTracking(found.id, env.ORDER_UPLOAD_SECRET),
      },
      201,
    );
  } catch (e) {
    return failure(e.message || "Could not accept request", 400);
  }
}
