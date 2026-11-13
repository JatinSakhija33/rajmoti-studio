
-- 1) site_content: one row per section, JSON blob
CREATE TABLE IF NOT EXISTS public.site_content (
  section_key text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_content public read" ON public.site_content
  FOR SELECT USING (true);

CREATE POLICY "site_content admin write" ON public.site_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER site_content_updated
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2) images: alt_text, caption, short_id, bytes for storage dashboard
ALTER TABLE public.images
  ADD COLUMN IF NOT EXISTS alt_text text,
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS bytes bigint,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS short_id text UNIQUE;

-- Backfill short_id with a compact random slug for any existing rows
UPDATE public.images
  SET short_id = substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 10)
  WHERE short_id IS NULL;

-- 3) Seed initial site_content section keys (empty blobs; app has fallbacks)
INSERT INTO public.site_content (section_key, data) VALUES
  ('hero', '{}'::jsonb),
  ('about', '{}'::jsonb),
  ('contact', '{}'::jsonb),
  ('seo', '{}'::jsonb),
  ('footer', '{}'::jsonb)
ON CONFLICT (section_key) DO NOTHING;
