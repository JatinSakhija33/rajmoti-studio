import { json, failure, requireOwner, clean, assertOrigin } from "../../../../_lib/security.js";

export async function onRequestGet({ request, env, params }) {
  try {
    await requireOwner(request, env);
    if (!env.ORDER_DB) return failure("Database not connected", 503);
    const id = params.id;

    let payments = [];
    try {
      const res = await env.ORDER_DB.prepare(
        "SELECT * FROM order_payments WHERE order_id=? ORDER BY created_at DESC",
      )
        .bind(id)
        .all();
      payments = res.results || [];
    } catch {
      // Table may not have records yet
    }

    return json({ payments });
  } catch (e) {
    return failure(e.message || "Owner access denied", 403);
  }
}

export async function onRequestPost({ request, env, params }) {
  try {
    const actor = await requireOwner(request, env);
    assertOrigin(request);
    if (!env.ORDER_DB) return failure("Database not connected", 503);
    const id = params.id;
    const order = await env.ORDER_DB.prepare("SELECT * FROM orders WHERE id=?").bind(id).first();
    if (!order) return failure("Order not found", 404);

    const body = await request.json();
    const action = clean(body.action, 40); // 'verify_upi' | 'record_counter_payment' | 'record_refund'

    if (action === "verify_upi") {
      const paymentId = clean(body.paymentId, 60);
      const verifiedUtr = clean(body.utr, 40) || clean(order.payment_reference, 40);
      if (!verifiedUtr) return failure("Transaction reference / UTR is required to reconcile payment");

      try {
        if (paymentId) {
          await env.ORDER_DB.prepare(
            `UPDATE order_payments
             SET status='verified', verified_by=?, verified_at=CURRENT_TIMESTAMP, customer_utr=?, notes=?
             WHERE id=? AND order_id=?`,
          )
            .bind(actor, verifiedUtr, clean(body.notes || "Reconciled with bank statement by owner", 200), paymentId, id)
            .run();
        } else {
          // If no specific payment record, insert verified record
          const amountPaise = Number(order.total_amount_paise) || Number(order.quoted_total) * 100 || 0;
          await env.ORDER_DB.prepare(
            `INSERT INTO order_payments(id, order_id, attempt_ref, amount_paise, method, status, customer_utr, verified_by, verified_at, notes)
             VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?)`,
          )
            .bind(
              crypto.randomUUID(),
              id,
              order.payment_attempt_ref || "RECON-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
              amountPaise,
              "upi",
              "verified",
              verifiedUtr,
              actor,
              clean(body.notes || "Direct reconciliation with bank statement", 200),
            )
            .run();
        }
      } catch {}

      // Recalculate verified paid paise
      let verifiedPaise = Number(order.total_amount_paise) || Number(order.quoted_total) * 100 || 0;
      try {
        const sumRes = await env.ORDER_DB.prepare(
          "SELECT COALESCE(SUM(amount_paise), 0) as total FROM order_payments WHERE order_id=? AND status='verified'",
        )
          .bind(id)
          .first();
        if (sumRes && sumRes.total > 0) {
          verifiedPaise = Number(sumRes.total);
        }
      } catch {}

      const totalPaise = Number(order.total_amount_paise) || Number(order.quoted_total) * 100 || 0;
      const isFull = verifiedPaise >= totalPaise && totalPaise > 0;
      const paymentStatus = isFull ? "verified_paid" : "partially_paid";

      await env.ORDER_DB.prepare(
        `UPDATE orders
         SET verified_paid_paise=?, paid_amount=?, payment_status=?, payment_reference=?,
             payment_verified_by=?, payment_verified_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
      )
        .bind(verifiedPaise, Math.round(verifiedPaise / 100), paymentStatus, verifiedUtr, actor, id)
        .run();

      await env.ORDER_DB.prepare(
        "INSERT INTO order_events(order_id, actor, event, detail) VALUES(?,?,?,?)",
      )
        .bind(id, actor, "upi_payment_verified", JSON.stringify({ verifiedPaise, verifiedUtr }))
        .run();

      return json({ ok: true, verifiedPaise, paymentStatus });
    }

    if (action === "record_counter_payment") {
      // For studio collection: cash or UPI received at counter
      const method = clean(body.method, 20) === "cash" ? "cash" : "upi";
      const amountPaise = Number(body.amountPaise) || (Number(body.amountInr) * 100);
      if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
        return failure("Enter a valid payment amount in paise or INR");
      }
      const ref = clean(body.reference || (method === "cash" ? "CASH-COUNTER" : "UPI-COUNTER"), 50);

      try {
        await env.ORDER_DB.prepare(
          `INSERT INTO order_payments(id, order_id, attempt_ref, amount_paise, method, status, customer_utr, verified_by, verified_at, notes)
           VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?)`,
        )
          .bind(
            crypto.randomUUID(),
            id,
            "SHOP-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
            amountPaise,
            method,
            "verified",
            ref,
            actor,
            clean(body.notes || `Counter collection payment (${method.toUpperCase()})`, 200),
          )
          .run();
      } catch {}

      // Recalculate verified paid paise
      const currentVerified = Number(order.verified_paid_paise) || 0;
      const newVerified = currentVerified + amountPaise;
      const totalPaise = Number(order.total_amount_paise) || Number(order.quoted_total) * 100 || 0;
      const isFull = newVerified >= totalPaise;
      const paymentStatus = isFull ? "verified_paid" : "partially_paid";

      await env.ORDER_DB.prepare(
        `UPDATE orders
         SET verified_paid_paise=?, paid_amount=?, payment_status=?, payment_reference=?,
             payment_verified_by=?, payment_verified_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
      )
        .bind(newVerified, Math.round(newVerified / 100), paymentStatus, ref, actor, id)
        .run();

      await env.ORDER_DB.prepare(
        "INSERT INTO order_events(order_id, actor, event, detail) VALUES(?,?,?,?)",
      )
        .bind(id, actor, "counter_payment_recorded", JSON.stringify({ amountPaise, method, ref }))
        .run();

      return json({ ok: true, verifiedPaise: newVerified, paymentStatus });
    }

    return failure("Unknown payment action", 400);
  } catch (e) {
    return failure(e.message || "Could not process payment reconciliation", 400);
  }
}
