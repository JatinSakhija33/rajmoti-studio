ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.subcategories
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE TABLE IF NOT EXISTS public.slug_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('category','subcategory')),
  old_slug text NOT NULL,
  new_slug text NOT NULL,
  category_slug text,
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS slug_redirects_unique
  ON public.slug_redirects (kind, old_slug, coalesce(category_slug, ''));

GRANT SELECT ON public.slug_redirects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slug_redirects TO authenticated;
GRANT ALL ON public.slug_redirects TO service_role;

ALTER TABLE public.slug_redirects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slug_redirects public read" ON public.slug_redirects;
CREATE POLICY "slug_redirects public read" ON public.slug_redirects
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "slug_redirects admin write" ON public.slug_redirects;
CREATE POLICY "slug_redirects admin write" ON public.slug_redirects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.tg_record_category_slug_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    INSERT INTO public.slug_redirects (kind, old_slug, new_slug, target_id)
    VALUES ('category', OLD.slug, NEW.slug, NEW.id)
    ON CONFLICT (kind, old_slug, coalesce(category_slug, ''))
    DO UPDATE SET new_slug = EXCLUDED.new_slug, target_id = EXCLUDED.target_id;

    UPDATE public.slug_redirects
      SET new_slug = NEW.slug
      WHERE kind = 'category' AND target_id = NEW.id AND old_slug <> NEW.slug;

    DELETE FROM public.slug_redirects
      WHERE kind = 'category' AND old_slug = NEW.slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_category_slug_change ON public.categories;
CREATE TRIGGER trg_category_slug_change
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_record_category_slug_change();

CREATE OR REPLACE FUNCTION public.tg_record_subcategory_slug_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  cat_slug text;
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    SELECT slug INTO cat_slug FROM public.categories WHERE id = NEW.category_id;

    INSERT INTO public.slug_redirects (kind, old_slug, new_slug, category_slug, target_id)
    VALUES ('subcategory', OLD.slug, NEW.slug, cat_slug, NEW.id)
    ON CONFLICT (kind, old_slug, coalesce(category_slug, ''))
    DO UPDATE SET new_slug = EXCLUDED.new_slug, target_id = EXCLUDED.target_id;

    UPDATE public.slug_redirects
      SET new_slug = NEW.slug
      WHERE kind = 'subcategory' AND target_id = NEW.id AND old_slug <> NEW.slug;

    DELETE FROM public.slug_redirects
      WHERE kind = 'subcategory' AND old_slug = NEW.slug
        AND coalesce(category_slug, '') = coalesce(cat_slug, '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subcategory_slug_change ON public.subcategories;
CREATE TRIGGER trg_subcategory_slug_change
  BEFORE UPDATE ON public.subcategories
  FOR EACH ROW EXECUTE FUNCTION public.tg_record_subcategory_slug_change();