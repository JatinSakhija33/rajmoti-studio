-- Apply to the separate ORDER_DB only. No Supabase or existing photography tables are changed.
ALTER TABLE order_photos ADD COLUMN design_id TEXT;
ALTER TABLE order_photos ADD COLUMN slot_index INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS order_photo_design_slot ON order_photos(order_id,design_id,slot_index) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS verified_upi_reference ON order_payments(customer_utr) WHERE method='upi' AND status='verified' AND customer_utr IS NOT NULL;
