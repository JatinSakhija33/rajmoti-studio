-- 1. Phone normalisation helper (India-aware, safe for international numbers)
CREATE OR REPLACE FUNCTION public.normalize_contact_phone(raw text, default_country text DEFAULT '91')
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  had_plus boolean;
  d text;
BEGIN
  IF raw IS NULL OR btrim(raw) = '' THEN RETURN NULL; END IF;
  had_plus := left(btrim(raw), 1) = '+';
  d := regexp_replace(raw, '\D', '', 'g');
  IF d = '' THEN RETURN NULL; END IF;
  IF had_plus THEN
    RETURN d;
  END IF;
  IF length(d) > 10 AND left(d, 1) = '0' THEN
    d := regexp_replace(d, '^0+', '');
  END IF;
  IF left(d, length(default_country)) = default_country AND length(d) = length(default_country) + 10 THEN
    RETURN d;
  END IF;
  IF length(d) = 10 THEN
    RETURN default_country || d;
  END IF;
  RETURN d;
END;
$$;

-- 2. Contact fields on the existing customers table (no data is removed)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS normalized_phone text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS favorite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS google_contact_resource_name text,
  ADD COLUMN IF NOT EXISTS google_account_id text,
  ADD COLUMN IF NOT EXISTS google_etag text,
  ADD COLUMN IF NOT EXISTS google_last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS google_sync_status text;

CREATE OR REPLACE FUNCTION public.tg_customers_normalize_phone()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.normalized_phone := public.normalize_contact_phone(NEW.phone);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customers_normalize_phone ON public.customers;
CREATE TRIGGER trg_customers_normalize_phone
BEFORE INSERT OR UPDATE OF phone ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.tg_customers_normalize_phone();

UPDATE public.customers
SET normalized_phone = public.normalize_contact_phone(phone)
WHERE normalized_phone IS DISTINCT FROM public.normalize_contact_phone(phone);

CREATE INDEX IF NOT EXISTS customers_normalized_phone_idx ON public.customers (normalized_phone);
CREATE INDEX IF NOT EXISTS customers_created_at_idx ON public.customers (created_at DESC);
CREATE INDEX IF NOT EXISTS customers_service_slug_idx ON public.customers (service_slug);
CREATE INDEX IF NOT EXISTS customers_name_trgm_idx ON public.customers (lower(customer_name));
CREATE UNIQUE INDEX IF NOT EXISTS customers_google_resource_idx
  ON public.customers (google_contact_resource_name)
  WHERE google_contact_resource_name IS NOT NULL;

-- 3. Google Contacts connection (server-only: no anon/authenticated grants)
CREATE TABLE IF NOT EXISTS public.google_contact_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_account_id text NOT NULL UNIQUE,
  google_email text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  sync_token text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_sync_at timestamptz,
  sync_status text NOT NULL DEFAULT 'connected',
  contacts_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.google_contact_accounts TO service_role;
ALTER TABLE public.google_contact_accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.google_oauth_states (
  state text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.google_oauth_states TO service_role;
ALTER TABLE public.google_oauth_states ENABLE ROW LEVEL SECURITY;