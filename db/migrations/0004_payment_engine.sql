-- 0004_payment_engine.sql
-- Rajmoti Studio authoritative payment and fulfilment engine schema.
-- Business rule: Home Delivery = 100% Verified Prepayment. Studio Collection = Full Online Payment or Payment at Shop. COD = Never.

ALTER TABLE orders ADD COLUMN fulfillment_type TEXT NOT NULL DEFAULT 'studio_collection';
ALTER TABLE orders ADD COLUMN delivery_address_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE orders ADD COLUMN delivery_charge_paise INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN total_amount_paise INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN verified_paid_paise INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'unselected';
ALTER TABLE orders ADD COLUMN payment_attempt_ref TEXT;

-- Separate ledger for payment attempts, pending verification, verified receipts, refunds and adjustments
CREATE TABLE IF NOT EXISTS order_payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  attempt_ref TEXT NOT NULL,
  amount_paise INTEGER NOT NULL CHECK(amount_paise > 0),
  method TEXT NOT NULL DEFAULT 'upi' CHECK(method IN ('upi', 'cash', 'card', 'bank_transfer')),
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK(status IN ('pending_verification', 'verified', 'rejected', 'refunded')),
  customer_utr TEXT,
  payee_upi TEXT NOT NULL DEFAULT '9429070317@apl',
  beneficiary_name TEXT NOT NULL DEFAULT 'PANKAJ LAXMICHAND SAKHIJA',
  verified_by TEXT,
  verified_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS order_payments_order ON order_payments(order_id);
CREATE INDEX IF NOT EXISTS order_payments_status ON order_payments(status);
CREATE INDEX IF NOT EXISTS order_payments_attempt ON order_payments(attempt_ref);
