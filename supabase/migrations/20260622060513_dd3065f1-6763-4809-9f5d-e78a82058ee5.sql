
-- 1. follow_up status
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'follow_up' BEFORE 'booked';

-- 2. packages: duration and edited photo count
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS duration TEXT,
  ADD COLUMN IF NOT EXISTS photos_count INT;

-- 3. inquiries → optional package link
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL;

-- 4. Seed categories + subcategories
INSERT INTO public.categories (slug, name, description, display_order) VALUES
  ('baby', 'Baby Photography', 'Newborn, themed and milestone shoots crafted with patience and care.', 1),
  ('family', 'Family Portraits', 'Timeless portraits across generations, in studio or on location.', 2),
  ('maternity', 'Maternity Photography', 'Editorial and traditional portraiture for the months that matter.', 3),
  ('wedding', 'Wedding Photography', 'From the first look to the last dance — documented with cinema-grade craft.', 4)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

-- Helper CTE pattern: insert subcategories by joining on category slug
WITH cat AS (SELECT id, slug FROM public.categories)
INSERT INTO public.subcategories (category_id, slug, name, display_order)
SELECT cat.id, sub.slug, sub.name, sub.display_order
FROM cat
JOIN (VALUES
  -- Baby
  ('baby','newborn-0-1-month','Newborn (0–1 Month)',1),
  ('baby','3-month-baby-shoot','3 Month Baby Shoot',2),
  ('baby','6-month-baby-shoot','6 Month Baby Shoot',3),
  ('baby','9-month-baby-shoot','9 Month Baby Shoot',4),
  ('baby','1-year-baby-shoot','1 Year Baby Shoot',5),
  ('baby','krishna-theme','Krishna Theme',6),
  ('baby','radha-krishna-theme','Radha Krishna Theme',7),
  ('baby','princess-theme','Princess Theme',8),
  ('baby','prince-theme','Prince Theme',9),
  ('baby','boss-baby','Boss Baby',10),
  ('baby','traditional-theme','Traditional Theme',11),
  ('baby','cake-smash','Cake Smash',12),
  ('baby','twins','Twins',13),
  ('baby','family-with-baby','Family With Baby',14),
  -- Family
  ('family','studio-family-portrait','Studio Family Portrait',1),
  ('family','traditional-family-portrait','Traditional Family Portrait',2),
  ('family','three-generation-portrait','Three Generation Portrait',3),
  ('family','couple-portrait','Couple Portrait',4),
  ('family','anniversary-portrait','Anniversary Portrait',5),
  -- Maternity
  ('maternity','indoor-maternity','Indoor Maternity',1),
  ('maternity','outdoor-maternity','Outdoor Maternity',2),
  ('maternity','couple-maternity','Couple Maternity',3),
  ('maternity','traditional-maternity','Traditional Maternity',4),
  ('maternity','luxury-maternity','Luxury Maternity',5),
  -- Wedding
  ('wedding','pre-wedding','Pre Wedding',1),
  ('wedding','engagement','Engagement',2),
  ('wedding','wedding-day','Wedding Day',3),
  ('wedding','reception','Reception',4),
  ('wedding','couple-portraits','Couple Portraits',5)
) AS sub(cat_slug, slug, name, display_order) ON cat.slug = sub.cat_slug
ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name, display_order = EXCLUDED.display_order;

-- 5. Maps embed setting (admin-editable)
INSERT INTO public.settings (key, value) VALUES
  ('maps_embed_url', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.settings (key, value) VALUES
  ('site', jsonb_build_object(
    'name','Rajmoti Studio',
    'tagline','Capturing Life''s Most Beautiful Moments',
    'email','rajmotistudio@gmail.com',
    'whatsapp','+919429070317',
    'location','Jetpur, Gujarat, India'
  ))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 6. AI readiness: favorites
CREATE TABLE IF NOT EXISTS public.image_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS image_favorites_user_unique ON public.image_favorites(image_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS image_favorites_session_unique ON public.image_favorites(image_id, session_id) WHERE session_id IS NOT NULL;
GRANT SELECT, INSERT, DELETE ON public.image_favorites TO anon, authenticated;
GRANT ALL ON public.image_favorites TO service_role;
ALTER TABLE public.image_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own favorites" ON public.image_favorites
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "anon manage session favorites" ON public.image_favorites
  FOR ALL TO anon USING (user_id IS NULL) WITH CHECK (user_id IS NULL);
CREATE POLICY "admins read favorites" ON public.image_favorites
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- 7. AI readiness: faces
CREATE TABLE IF NOT EXISTS public.image_faces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  bbox JSONB NOT NULL,                -- {x,y,w,h} normalized 0..1
  face_embedding JSONB,
  person_label TEXT,
  confidence REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_faces TO authenticated;
GRANT ALL ON public.image_faces TO service_role;
ALTER TABLE public.image_faces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage faces" ON public.image_faces
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 8. AI readiness: similarity clusters
CREATE TABLE IF NOT EXISTS public.image_similar_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT,
  centroid JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.image_similar_members (
  group_id UUID NOT NULL REFERENCES public.image_similar_groups(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  score REAL,
  PRIMARY KEY (group_id, image_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_similar_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_similar_members TO authenticated;
GRANT SELECT ON public.image_similar_groups TO anon;
GRANT SELECT ON public.image_similar_members TO anon;
GRANT ALL ON public.image_similar_groups TO service_role;
GRANT ALL ON public.image_similar_members TO service_role;
ALTER TABLE public.image_similar_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_similar_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "similar groups public read" ON public.image_similar_groups FOR SELECT USING (true);
CREATE POLICY "similar groups admin write" ON public.image_similar_groups
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "similar members public read" ON public.image_similar_members FOR SELECT USING (true);
CREATE POLICY "similar members admin write" ON public.image_similar_members
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
