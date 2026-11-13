-- Permanent public photo identity system

ALTER TABLE public.images ADD COLUMN IF NOT EXISTS theme text;

CREATE OR REPLACE FUNCTION public.generate_photo_short_id()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  alphabet constant text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  candidate text;
  i int;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..10 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.images WHERE short_id = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

-- Backfill anything missing (no-op if already complete)
UPDATE public.images
SET short_id = public.generate_photo_short_id()
WHERE short_id IS NULL OR btrim(short_id) = '';

ALTER TABLE public.images ALTER COLUMN short_id SET DEFAULT public.generate_photo_short_id();
ALTER TABLE public.images ALTER COLUMN short_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS images_short_id_key ON public.images (short_id);

-- short_id is permanent: auto-generate on insert, immutable on update
CREATE OR REPLACE FUNCTION public.images_enforce_public_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.short_id IS NULL OR btrim(NEW.short_id) = '' THEN
      NEW.short_id := public.generate_photo_short_id();
    END IF;
  ELSE
    NEW.short_id := OLD.short_id;
  END IF;

  IF NEW.hidden IS FALSE THEN
    IF NEW.category_id IS NULL THEN
      RAISE EXCEPTION 'A published photograph must have a category';
    END IF;
    IF NEW.image_url IS NULL OR btrim(NEW.image_url) = '' THEN
      RAISE EXCEPTION 'A published photograph must have an image';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS images_enforce_public_id ON public.images;
CREATE TRIGGER images_enforce_public_id
BEFORE INSERT OR UPDATE ON public.images
FOR EACH ROW EXECUTE FUNCTION public.images_enforce_public_id();