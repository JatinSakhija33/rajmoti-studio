-- Owner-only contact records and calendar planning.
-- Run AFTER 0001_web_orders.sql; keep customer data private in D1.
CREATE TABLE IF NOT EXISTS studio_contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  family_name TEXT NOT NULL DEFAULT '',
  birthday TEXT NOT NULL DEFAULT '',
  anniversary TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS studio_contacts_name ON studio_contacts(name COLLATE NOCASE);
CREATE TABLE IF NOT EXISTS studio_calendar (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  start_time TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT 'task',
  contact_phone TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  done INTEGER NOT NULL DEFAULT 0 CHECK(done IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS studio_calendar_date ON studio_calendar(event_date, start_time);
