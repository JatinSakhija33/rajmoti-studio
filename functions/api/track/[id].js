import { json, failure, validTracking, buildUpiUri, UPI_CONFIG } from "../../_lib/security.js";

export async function onRequestGet({ request, env, params }) {
  try {
    if (!env.ORDER_DB || !env.ORDER_UPLOAD_SECRET) return failure("Order tracking is unavailable", 503);
    const id = String(params.id || "");
    const token = new URL(request.url).searchParams.get("token");
    if (!/^[0-9a-f-]{36}$/i.test(id) || !(await validTracking(token, id, env.ORDER_UPLOAD_SECRET)))
      return failure("This private tracking link is invalid or expired", 403);

    const order = await env.ORDER_DB.prepare(
      `SELECT id, status, payment_status, quoted_total, paid_amount, due_date, created_at,
              public_ref, fulfillment_type, total_amount_paise, verified_paid_paise, delivery_charge_paise,
              payment_method, items_json, customization_json
       FROM orders WHERE id=?`,
    )
      .bind(id)
      .first();
    if (!order) return failure("Order not found", 404);

    const publicRef = order.public_ref || id.slice(0, 8).toUpperCase();
    const totalPaise = Number(order.total_amount_paise) || Number(order.quoted_total) * 100 || 0;
    const verifiedPaise = Number(order.verified_paid_paise) || Number(order.paid_amount) * 100 || 0;

    const upiUri =
      totalPaise > 0
        ? buildUpiUri({
            amountPaise: totalPaise,
            publicRef,
            note: `Order ${publicRef} - Rajmoti Studio`,
          })
        : "";

    return json({
      reference: publicRef,
      status: order.status,
      fulfillmentType: order.fulfillment_type || "studio_collection",
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method || "unselected",
      quotedAmount: Math.round(totalPaise / 100),
      totalAmountPaise: totalPaise,
      verifiedPaidPaise: verifiedPaise,
      deliveryChargePaise: Number(order.delivery_charge_paise) || 0,
      paidAmount: Math.round(verifiedPaise / 100),
      dueDate: order.due_date,
      createdAt: order.created_at,
      upiUri,
      payeeVpa: UPI_CONFIG.payeeVpa,
      beneficiaryName: UPI_CONFIG.payeeName,
      itemsJson: order.items_json,
      customizationJson: order.customization_json,
    });
  } catch {
    return failure("Unable to check order", 500);
  }
}
