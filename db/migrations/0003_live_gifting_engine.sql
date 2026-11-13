-- 0003_live_gifting_engine.sql
-- Fix public_ref, allow dynamic photo upload limits for magazines (up to 20 photos),
-- and establish server-validated product catalogue and customization structures.

-- Add missing columns to orders if not already present
ALTER TABLE orders ADD COLUMN public_ref TEXT;
ALTER TABLE orders ADD COLUMN photo_limit INTEGER NOT NULL DEFAULT 5;
ALTER TABLE orders ADD COLUMN customization_json TEXT NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS orders_public_ref ON orders(public_ref);

-- Server-validated product definitions
CREATE TABLE IF NOT EXISTS catalogue_products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'frames', 'acrylic', 'mugs', 'translight', 'devotional', 'magazines', 'canvas', 'collages'
  description TEXT NOT NULL DEFAULT '',
  base_price_paise INTEGER NOT NULL DEFAULT 0,
  min_photos INTEGER NOT NULL DEFAULT 1,
  max_photos INTEGER NOT NULL DEFAULT 5,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalogue_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES catalogue_products(id),
  size_name TEXT NOT NULL,
  dimensions TEXT NOT NULL DEFAULT '',
  finish TEXT NOT NULL DEFAULT 'Matte',
  material TEXT NOT NULL DEFAULT 'Wood',
  price_paise INTEGER NOT NULL DEFAULT 0,
  cost_paise INTEGER NOT NULL DEFAULT 0,
  is_available INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalogue_templates (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES catalogue_products(id),
  name TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'general',
  slots_count INTEGER NOT NULL DEFAULT 1,
  layout_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
