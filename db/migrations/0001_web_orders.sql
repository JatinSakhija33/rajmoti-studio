-- Rajmoti independent web intake. Only website orders and walk-ins, not the legacy OS database.
-- All customer/finance data is private; Cloudflare Access protects /api/owner/*.
CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY,
 request_key TEXT NOT NULL UNIQUE,
 source TEXT NOT NULL DEFAULT 'website' CHECK(source IN ('website','walk_in')),
 customer_name TEXT NOT NULL,
 phone TEXT NOT NULL,
 service_type TEXT NOT NULL,
 preferred_date TEXT,
 baby_age TEXT,
 package_slug TEXT,
 styles_json TEXT NOT NULL DEFAULT '[]',
 items_json TEXT NOT NULL DEFAULT '[]',
 notes TEXT NOT NULL DEFAULT '',
 requested_size TEXT NOT NULL DEFAULT '',
 priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
 due_date TEXT,
 editing_instructions TEXT NOT NULL DEFAULT '',
 memorial_json TEXT NOT NULL DEFAULT '{}',
 review_json TEXT NOT NULL DEFAULT '{}',
 status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('received','editing','review','printing','framing','ready','delivered','cancelled')),
 quoted_total INTEGER NOT NULL DEFAULT 0 CHECK(quoted_total>=0),
 paid_amount INTEGER NOT NULL DEFAULT 0 CHECK(paid_amount>=0),
 payment_status TEXT NOT NULL DEFAULT 'unpaid',
 payment_reference TEXT,
 payment_verified_by TEXT,
 payment_verified_at TEXT,
 delivered_at TEXT,
 archive_verified_at TEXT,
 archive_verified_by TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS orders_status_created ON orders(status,created_at DESC);
CREATE INDEX IF NOT EXISTS orders_phone ON orders(phone);
CREATE TABLE IF NOT EXISTS order_photos (
 id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id),
 r2_key TEXT NOT NULL UNIQUE,mime TEXT NOT NULL,size_bytes INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS order_photos_order ON order_photos(order_id);
CREATE TABLE IF NOT EXISTS order_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 order_id TEXT NOT NULL REFERENCES orders(id),actor TEXT NOT NULL,event TEXT NOT NULL,
 detail TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS order_events_order ON order_events(order_id,id DESC);
