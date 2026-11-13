import { json, failure, clean, validTracking } from "../../../_lib/security.js";

export async function onRequestPost({ request, env, params }) {
  try {
    if (!env.ORDER_DB || !env.ORDER_UPLOAD_SECRET) return failure("Database not configured", 503);
    const id = String(params.id || "");
    const data = await request.json();
    const token = clean(data.trackingToken || data.token, 200);

    // Verify customer tracking token
    if (!/^[0-9a-f-]{36}$/i.test(id) || !(await validTracking(token, id, env.ORDER_UPLOAD_SECRET))) {
      return failure("Invalid or expired tracking authorization", 403);
    }

    const utr = clean(data.utr, 35);
    if (!utr || utr.length < 6) {
      return failure("Please enter a valid 6-22 character UPI UTR or bank reference number", 400);
    }

    const order = await env.ORDER_DB.prepare(
      "SELECT id, total_amount_paise, payment_attempt_ref, public_ref FROM orders WHERE id=?",
    )
      .bind(id)
      .first();

    if (!order) return failure("Order not found", 404);

    const attemptRef = clean(data.attemptRef, 40) || order.payment_attempt_ref || "PAY-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const amountPaise = Number(order.total_amount_paise) || 0;

    // Record or update payment attempt as pending_verification
    try {
      await env.ORDER_DB.prepare(
        `INSERT INTO order_payments(id, order_id, attempt_ref, amount_paise, method, status, customer_utr, notes)
         VALUES(?,?,?,?,?,?,?,?)`,
      )
        .bind(
          crypto.randomUUID(),
          id,
          attemptRef,
          amountPaise,
          "upi",
          "pending_verification",
          utr,
          "Submitted by customer via tracking page",
        )
        .run();
    } catch {
      // If table already has entry, update customer_utr
      try {
        await env.ORDER_DB.prepare(
          "UPDATE order_payments SET customer_utr=?, status='pending_verification' WHERE order_id=? AND attempt_ref=?",
        )
          .bind(utr, id, attemptRef)
          .run();
      } catch {}
    }

    // Update order status to pending_verification (NEVER automatically verified!)
    await env.ORDER_DB.prepare(
      "UPDATE orders SET payment_status='pending_verification', payment_reference=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
    )
      .bind(utr, id)
      .run();

    await env.ORDER_DB.prepare(
      "INSERT INTO order_events(order_id, actor, event, detail) VALUES(?,?,?,?)",
    )
      .bind(id, "customer", "utr_submitted", JSON.stringify({ utr, attemptRef }))
      .run();

    return json({
      ok: true,
      status: "pending_verification",
      message:
        "UTR submitted for studio verification. Rajmoti Studio will reconcile this transaction with bank records before dispatching your order.",
    });
  } catch (e) {
    return failure(e.message || "Could not record payment attempt", 400);
  }
}
