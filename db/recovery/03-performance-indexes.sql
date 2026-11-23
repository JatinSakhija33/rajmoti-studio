-- Rajmoti Studio — OPTIONAL PERFORMANCE INDEXES
-- Run ONLY after the guarded full-schema recovery and read-only postcheck.
-- Does not change customer data; adds database indexes to improve contact
-- searches, today's jobs, overdue follow-ups, and recent enquiries.
-- On an empty database these are near-instant; on a large database they may
-- hold short write locks. Run at a quiet time after a backup.

BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '3min';

-- Refuse to run against an incomplete schema.
DO $guard$
BEGIN
  IF to_regclass('public.customers') IS NULL
    OR to_regclass('public.studio_jobs') IS NULL
    OR to_regclass('public.contact_tasks') IS NULL
    OR to_regclass('public.bookings') IS NULL THEN
    RAISE EXCEPTION 'Create/restore Rajmoti business tables and RLS before adding indexes.';
  END IF;
END $guard$;

-- Common contact listing: active records ordered by name.
CREATE INDEX IF NOT EXISTS rajmoti_contacts_active_name_idx
  ON public.customers (customer_name, id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rajmoti_contacts_active_phone_idx
  ON public.customers (normalized_phone) WHERE deleted_at IS NULL;

-- Pending reminders and current workflow queues.
CREATE INDEX IF NOT EXISTS rajmoti_tasks_open_due_idx
  ON public.contact_tasks (due_on, customer_id) WHERE done_at IS NULL;
CREATE INDEX IF NOT EXISTS rajmoti_jobs_active_due_idx
  ON public.studio_jobs (due_on, priority, job_status)
  WHERE job_status <> 'delivered';

-- Bookings and enquiries (read paths currently used by the owner dashboard).
CREATE INDEX IF NOT EXISTS rajmoti_bookings_session_date_idx
  ON public.bookings (session_date);
CREATE INDEX IF NOT EXISTS rajmoti_inquiries_status_created_idx
  ON public.inquiries (status, created_at DESC);

-- The contact book searches inside names and phone numbers using ILIKE %q%.
-- pg_trgm makes those substring searches indexable.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
DO $trgm$
DECLARE opclass text;
BEGIN
  SELECT format('%I.%I', n.nspname, o.opcname) INTO opclass
  FROM pg_opclass o JOIN pg_namespace n ON n.oid = o.opcnamespace
  WHERE o.opcname='gin_trgm_ops' LIMIT 1;
  IF opclass IS NULL THEN RAISE EXCEPTION 'pg_trgm GIN operator class unavailable'; END IF;
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS rajmoti_contacts_name_search_idx ON public.customers USING gin (customer_name %s) WHERE deleted_at IS NULL',
    opclass
  );
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS rajmoti_contacts_phone_search_idx ON public.customers USING gin (phone %s) WHERE deleted_at IS NULL',
    opclass
  );
END $trgm$;

COMMIT;
-- Recheck /admin/contacts and /admin/workflow after the schema is migrated.
