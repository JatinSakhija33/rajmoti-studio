ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS service_slug text;
ALTER TABLE public.customers ALTER COLUMN customer_name DROP NOT NULL;
CREATE INDEX IF NOT EXISTS customers_phone_digits_idx ON public.customers (regexp_replace(coalesce(phone,''), '[^0-9]', '', 'g'));
INSERT INTO public.settings (key, value)
VALUES ('google_profile_share_url', to_jsonb('https://share.google/T3UVPztmY6QZofvis'::text))
ON CONFLICT (key) DO NOTHING;