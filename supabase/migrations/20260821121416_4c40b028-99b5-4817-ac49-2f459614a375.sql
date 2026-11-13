CREATE TABLE public.reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id text NOT NULL UNIQUE DEFAULT public.generate_photo_short_id(),
  title text NOT NULL,
  description text,
  video_url text,
  video_path text,
  poster_url text,
  poster_path text,
  aspect_ratio text NOT NULL DEFAULT '9:16',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  location text,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.reels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reels TO authenticated;
GRANT ALL ON public.reels TO service_role;

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published reels are publicly readable"
  ON public.reels FOR SELECT
  USING (published = true);

CREATE POLICY "Admins manage reels"
  ON public.reels FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reels_updated_at
  BEFORE UPDATE ON public.reels
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.reels_enforce_short_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.short_id IS NULL OR length(NEW.short_id) < 6 THEN
      NEW.short_id := public.generate_photo_short_id();
    END IF;
  ELSE
    NEW.short_id := OLD.short_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reels_enforce_short_id
  BEFORE INSERT OR UPDATE ON public.reels
  FOR EACH ROW EXECUTE FUNCTION public.reels_enforce_short_id();

CREATE INDEX reels_published_order_idx ON public.reels (published, display_order, created_at DESC);

INSERT INTO public.packages (name, slug, price, currency, description, duration, featured, display_order)
VALUES
  ('Studio Cinematic Reel', 'studio-cinematic-reel', 3500, 'INR',
   'A cinematic reel created inside the Rajmoti Studio environment - directed, filmed and edited to music.',
   '60 mins', true, 10),
  ('Outdoor Cinematic Reel', 'outdoor-cinematic-reel', 6500, 'INR',
   'A location-based cinematic experience with more movement, environment and storytelling.',
   '120 mins', true, 11)
ON CONFLICT (slug) DO NOTHING;