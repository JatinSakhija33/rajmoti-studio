-- RAJMOTI STUDIO — GUARDED COMPLETE SCHEMA RECOVERY
-- Based on the 41 ordered source migrations. FIVE insecure/test-only migrations are deliberately omitted (details below).
-- Appropriate ONLY for a nearly empty Rajmoti Supabase project where the earlier
-- manual setup created public.app_role, public.user_roles and public.has_role,
-- and NO other business tables were created yet.
--
-- PROJECT: ujxecliohalltcglttsr (confirm this in Supabase dashboard before running).
-- DO NOT run this in Meri Rasoi or any other project.
-- DO NOT run this if you already have any public business data/schema.
-- Use 00-preflight-readonly.sql first; take a database backup.
-- This script does NOT move old Lovable customer rows, login passwords, or media.
-- This script has NOT been executed against your live Supabase database.
--
-- ONE TRANSACTION: If any required DDL fails, the entire transaction rolls back.
-- WARNING: Historical migrations include unrestricted staff policies and email-based admin assignment; they are SKIPPED.
BEGIN;
SET LOCAL statement_timeout = '5min';
SET LOCAL lock_timeout = '10s';

DO $guard$
DECLARE rls_enabled boolean;
BEGIN
  IF to_regtype('public.app_role') IS NULL
     OR to_regclass('public.user_roles') IS NULL
     OR to_regprocedure('public.has_role(uuid, public.app_role)') IS NULL THEN
    RAISE EXCEPTION 'STOP: Existing role schema is missing or mismatched. Do not run this full installer until the manually created admin roles are reconciled.';
  END IF;

  SELECT c.relrowsecurity INTO rls_enabled
  FROM pg_class c WHERE c.oid=to_regclass('public.user_roles');
  IF NOT COALESCE(rls_enabled,false) THEN
    RAISE EXCEPTION 'STOP: public.user_roles lacks RLS. Recheck the previously created role setup.';
  END IF;

  -- This first-time schema bootstrap is intentionally NOT an incremental
  -- migration tool; preserving any existing business table is paramount.
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname='public' AND tablename <> 'user_roles'
  ) THEN
    RAISE EXCEPTION 'STOP: public already contains tables besides user_roles. Do not overwrite an existing or partially migrated studio database. Reconcile migrations manually.';
  END IF;

  IF to_regtype('public.inquiry_status') IS NOT NULL THEN
    RAISE EXCEPTION 'STOP: inquiry_status already exists, indicating a partial original migration. Reconcile manually.';
  END IF;
END $guard$;

-- The original first migration creates roles and profiles together. The role
-- tables already exist in THIS project, so only recreate the missing profile
-- portion of that original first migration, without dropping/recreating users.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by all"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $fn$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $fn$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $fn$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Existing logins were created BEFORE the profiles trigger existed.
INSERT INTO public.profiles (id, display_name, avatar_url)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
       raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Restore original admins-read-roles policy only if it was not created yet.
DO $roles$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_roles'
      AND policyname='admins read all roles'
  ) THEN
    CREATE POLICY "admins read all roles"
      ON public.user_roles FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(),'admin'));
  END IF;
END $roles$;

-- ORIGINAL HISTORICAL MIGRATIONS BELOW, PRESERVED IN TIME ORDER.
-- Their initial roles/profile section is intentionally substituted above.

-- INTERNAL SOURCE PART 1, DO NOT RUN BY ITSELF.
-- Original migrations 1-11. The existing profiles / roles setup is handled in the full guarded installer.

-- SOURCE: supabase/migrations/20260622050420_35f6172f-f7a5-4529-957b-fb115969c72b.sql
-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "admins write categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcategories TO authenticated;
GRANT SELECT ON public.subcategories TO anon;
GRANT ALL ON public.subcategories TO service_role;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subcategories public read" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "admins write subcategories" ON public.subcategories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER subcategories_updated BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ IMAGES ============
CREATE TABLE public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INT,
  height INT,
  featured BOOLEAN NOT NULL DEFAULT false,
  hidden BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  -- AI-ready
  tags TEXT[] DEFAULT '{}',
  dominant_color TEXT,
  embedding JSONB,
  ai_metadata JSONB DEFAULT '{}'::JSONB,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX images_category_idx ON public.images(category_id);
CREATE INDEX images_subcategory_idx ON public.images(subcategory_id);
CREATE INDEX images_featured_idx ON public.images(featured) WHERE featured = true;
CREATE INDEX images_visible_order_idx ON public.images(display_order) WHERE hidden = false;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.images TO authenticated;
GRANT SELECT ON public.images TO anon;
GRANT ALL ON public.images TO service_role;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "images public read visible" ON public.images FOR SELECT USING (hidden = false OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins write images" ON public.images FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER images_updated BEFORE UPDATE ON public.images FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ PACKAGES ============
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'INR',
  cover_image_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT SELECT ON public.packages TO anon;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages public read" ON public.packages FOR SELECT USING (true);
CREATE POLICY "admins write packages" ON public.packages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER packages_updated BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.package_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX package_features_pkg_idx ON public.package_features(package_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.package_features TO authenticated;
GRANT SELECT ON public.package_features TO anon;
GRANT ALL ON public.package_features TO service_role;
ALTER TABLE public.package_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "package features public read" ON public.package_features FOR SELECT USING (true);
CREATE POLICY "admins write package features" ON public.package_features FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ INQUIRIES ============
CREATE TYPE public.inquiry_status AS ENUM ('new', 'contacted', 'booked', 'closed');

CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  event_date DATE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_label TEXT,
  message TEXT,
  status public.inquiry_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT INSERT ON public.inquiries TO anon;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit inquiry" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read inquiries" ON public.inquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update inquiries" ON public.inquiries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete inquiries" ON public.inquiries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER inquiries_updated BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ TESTIMONIALS ============
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL,
  role TEXT,
  content TEXT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  featured BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT SELECT ON public.testimonials TO anon;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testimonials public read" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "admins write testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER testimonials_updated BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ SETTINGS ============
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT SELECT ON public.settings TO anon;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "admins write settings" ON public.settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER settings_updated BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ SEED CATEGORIES ============
INSERT INTO public.categories (slug, name, description, display_order) VALUES
  ('baby', 'Baby Photography', 'Tender frames of new life — themed shoots, cake smashes, and timeless newborn portraits.', 1),
  ('family', 'Family Portraits', 'Heirloom portraits that hold a generation together in a single frame.', 2),
  ('maternity', 'Maternity Photography', 'The sculptural beauty of becoming — quiet, luminous, deeply personal.', 3),
  ('wedding', 'Wedding Photography', 'Pre-wedding, ceremony, and reception coverage with an editorial eye.', 4);

INSERT INTO public.subcategories (category_id, slug, name, display_order) VALUES
  ((SELECT id FROM public.categories WHERE slug='baby'), 'krishna', 'Krishna Theme', 1),
  ((SELECT id FROM public.categories WHERE slug='baby'), 'princess', 'Princess Theme', 2),
  ((SELECT id FROM public.categories WHERE slug='baby'), 'boss-baby', 'Boss Baby', 3),
  ((SELECT id FROM public.categories WHERE slug='baby'), 'cake-smash', 'Cake Smash', 4),
  ((SELECT id FROM public.categories WHERE slug='baby'), 'traditional', 'Traditional', 5),
  ((SELECT id FROM public.categories WHERE slug='baby'), 'twins', 'Twins', 6),
  ((SELECT id FROM public.categories WHERE slug='family'), 'studio', 'Studio Family', 1),
  ((SELECT id FROM public.categories WHERE slug='family'), 'traditional', 'Traditional Family', 2),
  ((SELECT id FROM public.categories WHERE slug='family'), 'generational', 'Generational Portraits', 3),
  ((SELECT id FROM public.categories WHERE slug='maternity'), 'indoor', 'Indoor', 1),
  ((SELECT id FROM public.categories WHERE slug='maternity'), 'outdoor', 'Outdoor', 2),
  ((SELECT id FROM public.categories WHERE slug='maternity'), 'couple', 'Couple', 3),
  ((SELECT id FROM public.categories WHERE slug='wedding'), 'pre-wedding', 'Pre Wedding', 1),
  ((SELECT id FROM public.categories WHERE slug='wedding'), 'engagement', 'Engagement', 2),
  ((SELECT id FROM public.categories WHERE slug='wedding'), 'wedding-day', 'Wedding Day', 3),
  ((SELECT id FROM public.categories WHERE slug='wedding'), 'reception', 'Reception', 4);

-- Omitted historical demo package prices and features. Prices must be approved by owner.\n\n-- Named testimonial seed rows omitted from the source export.

INSERT INTO public.settings (key, value) VALUES
  ('site', '{"studio_name":"Rajmoti Studio","tagline":"Capturing Life''s Most Beautiful Moments","email":"rajmotistudio@gmail.com","phone":"+91 00000 00000","whatsapp":"+910000000000","address":"India","instagram":"https://instagram.com/rajmotistudio"}'::jsonb),
  ('hero', '{"title_line_1":"Capturing Life''s Most","title_line_2":"Beautiful Moments","subtitle":"Bespoke photography for the milestones that define your legacy."}'::jsonb);


-- SOURCE: supabase/migrations/20260622050444_2c4f34cc-80a2-4ae0-9f94-3f08db1ece9d.sql

DROP POLICY IF EXISTS "anyone can submit inquiry" ON public.inquiries;
CREATE POLICY "anyone can submit inquiry" ON public.inquiries FOR INSERT
  WITH CHECK (
    length(coalesce(name,'')) BETWEEN 1 AND 200
    AND length(coalesce(message,'')) <= 5000
    AND length(coalesce(phone,'')) <= 50
    AND length(coalesce(whatsapp,'')) <= 50
    AND length(coalesce(email,'')) <= 320
  );

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;


-- SOURCE: supabase/migrations/20260622050531_f4ed116b-027f-4cbc-a95c-913771c03247.sql

CREATE POLICY "gallery public read" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "gallery admin insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "gallery admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'gallery' AND public.has_role(auth.uid(),'admin')) WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "gallery admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery' AND public.has_role(auth.uid(),'admin'));


-- SOURCE: supabase/migrations/20260622050558_063bd1f7-dd54-40a4-95a2-6338d47add6e.sql
-- EXCLUDED: hardcoded email-based auto-admin trigger; explicit trusted role assignment is mandatory.

-- SOURCE: supabase/migrations/20260622052051_a7b98266-f681-4a05-adf8-df5498126209.sql
-- EXCLUDED: unnecessary anonymous role-check RPC grant.

-- SOURCE: supabase/migrations/20260622055511_7a7958c4-b373-4b8d-93a9-04133178b7d7.sql

-- Restrict profiles read to authenticated users
DROP POLICY IF EXISTS "profiles readable by all" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;
CREATE POLICY "profiles readable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Restrict settings read to authenticated users
DROP POLICY IF EXISTS "settings public read" ON public.settings;
REVOKE SELECT ON public.settings FROM anon;
CREATE POLICY "settings readable by authenticated" ON public.settings
  FOR SELECT TO authenticated USING (true);


-- SOURCE: supabase/migrations/20260622060513_dd3065f1-6763-4809-9f5d-e78a82058ee5.sql

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


-- SOURCE: supabase/migrations/20260622060546_042f7e2b-edad-4195-9abb-2c2af0f81da4.sql

GRANT SELECT ON public.settings TO anon;
CREATE POLICY "settings public read allow-list" ON public.settings
  FOR SELECT TO anon
  USING (key IN ('maps_embed_url'));


-- SOURCE: supabase/migrations/20260623145420_aafcf11b-d6ac-4efc-af5d-8b9325e249c3.sql
DROP POLICY IF EXISTS "settings readable by authenticated" ON public.settings;

CREATE POLICY "settings readable by authenticated allowlist"
ON public.settings
FOR SELECT
TO authenticated
USING (key IN ('maps_embed_url', 'site'));


-- SOURCE: supabase/migrations/20260703053707_6a822fe8-f9fc-4138-923a-00c30abdb0e9.sql

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


-- SOURCE: supabase/migrations/20260706045151_b12c8dcd-bd48-4b2b-8c34-e1c924b5e60a.sql
-- Extend inquiries with booking fields (all nullable for back-compat)
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS session_date date,
  ADD COLUMN IF NOT EXISTS session_slot text,
  ADD COLUMN IF NOT EXISTS family_name text,
  ADD COLUMN IF NOT EXISTS child_name text,
  ADD COLUMN IF NOT EXISTS package_id uuid,
  ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS total_price numeric,
  ADD COLUMN IF NOT EXISTS advance_amount numeric;

CREATE INDEX IF NOT EXISTS idx_inquiries_session_date ON public.inquiries (session_date);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries (status);

-- Booking slots
CREATE TABLE IF NOT EXISTS public.booking_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.booking_slots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.booking_slots TO authenticated;
GRANT ALL ON public.booking_slots TO service_role;

ALTER TABLE public.booking_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active slots" ON public.booking_slots
  FOR SELECT USING (active OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage slots" ON public.booking_slots
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_booking_slots_updated_at
  BEFORE UPDATE ON public.booking_slots
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.booking_slots (label, start_time, end_time, sort_order) VALUES
  ('10:00 AM – 11:30 AM', '10:00', '11:30', 1),
  ('12:30 PM – 2:00 PM', '12:30', '14:00', 2),
  ('3:00 PM – 4:30 PM', '15:00', '16:30', 3),
  ('6:00 PM – 7:30 PM', '18:00', '19:30', 4),
  ('8:00 PM – 9:30 PM', '20:00', '21:30', 5)
ON CONFLICT DO NOTHING;



-- INTERNAL SOURCE PART 2, DO NOT RUN BY ITSELF.
-- Original migrations 12-22.

-- SOURCE: supabase/migrations/20260706045252_0a0d3e70-56c0-47b8-ae8e-ea6fca9f1578.sql
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'cancelled';


-- SOURCE: supabase/migrations/20260706045309_7d2a5c94-ab5a-47a5-aee5-4e9f29b74f81.sql
CREATE OR REPLACE FUNCTION public.get_taken_slots(d date)
RETURNS TABLE(slot text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT session_slot
  FROM public.inquiries
  WHERE session_date = d
    AND session_slot IS NOT NULL
    AND status <> 'cancelled'::inquiry_status;
$$;

REVOKE ALL ON FUNCTION public.get_taken_slots(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_taken_slots(date) TO anon, authenticated;


-- SOURCE: supabase/migrations/20260707073416_fa118c4b-5e89-40c0-afc1-63f408ff47e9.sql

-- SERVICES
CREATE TABLE public.booking_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cover_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  booking_instructions text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.booking_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_services TO authenticated;
GRANT ALL ON public.booking_services TO service_role;
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active services" ON public.booking_services FOR SELECT USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage services" ON public.booking_services FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_booking_services_updated BEFORE UPDATE ON public.booking_services FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- PACKAGES (booking)
CREATE TABLE public.booking_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.booking_services(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  duration_minutes int NOT NULL DEFAULT 55,
  max_themes int NOT NULL DEFAULT 1,
  max_poses int NOT NULL DEFAULT 1,
  max_edited_photos int NOT NULL DEFAULT 1,
  max_family_members int NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  badge text,
  popular boolean NOT NULL DEFAULT false,
  advance_percent int NOT NULL DEFAULT 30,
  seasonal_discount_percent int NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.booking_packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_packages TO authenticated;
GRANT ALL ON public.booking_packages TO service_role;
ALTER TABLE public.booking_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active packages" ON public.booking_packages FOR SELECT USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage packages" ON public.booking_packages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_booking_packages_updated BEFORE UPDATE ON public.booking_packages FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_booking_packages_service ON public.booking_packages(service_id);

-- THEMES
CREATE TABLE public.booking_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.booking_services(id) ON DELETE CASCADE,
  name text NOT NULL,
  thumbnail_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_age text,
  bg_color text,
  props text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.booking_themes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_themes TO authenticated;
GRANT ALL ON public.booking_themes TO service_role;
ALTER TABLE public.booking_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active themes" ON public.booking_themes FOR SELECT USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage themes" ON public.booking_themes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_booking_themes_updated BEFORE UPDATE ON public.booking_themes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_booking_themes_service ON public.booking_themes(service_id);

-- POSES
CREATE TABLE public.booking_poses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL REFERENCES public.booking_themes(id) ON DELETE CASCADE,
  name text NOT NULL,
  preview_url text,
  category text,
  difficulty text,
  recommended_age text,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.booking_poses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_poses TO authenticated;
GRANT ALL ON public.booking_poses TO service_role;
ALTER TABLE public.booking_poses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active poses" ON public.booking_poses FOR SELECT USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage poses" ON public.booking_poses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_booking_poses_updated BEFORE UPDATE ON public.booking_poses FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_booking_poses_theme ON public.booking_poses(theme_id);

-- WORKING HOURS
CREATE TABLE public.booking_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  session_minutes int NOT NULL DEFAULT 55,
  open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.booking_hours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_hours TO authenticated;
GRANT ALL ON public.booking_hours TO service_role;
ALTER TABLE public.booking_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read hours" ON public.booking_hours FOR SELECT USING (true);
CREATE POLICY "admins manage hours" ON public.booking_hours FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_booking_hours_updated BEFORE UPDATE ON public.booking_hours FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- BLOCKED DATES
CREATE TABLE public.booking_blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  reason text,
  all_day boolean NOT NULL DEFAULT true,
  blocked_slots text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.booking_blocked_dates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_blocked_dates TO authenticated;
GRANT ALL ON public.booking_blocked_dates TO service_role;
ALTER TABLE public.booking_blocked_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read blocked" ON public.booking_blocked_dates FOR SELECT USING (true);
CREATE POLICY "admins manage blocked" ON public.booking_blocked_dates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_booking_blocked_updated BEFORE UPDATE ON public.booking_blocked_dates FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_booking_blocked_date ON public.booking_blocked_dates(date);

-- OFFERS
CREATE TABLE public.booking_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  discount_percent int,
  flat_amount numeric(10,2),
  starts_at date,
  ends_at date,
  applies_to_service_ids uuid[] NOT NULL DEFAULT '{}',
  applies_to_package_ids uuid[] NOT NULL DEFAULT '{}',
  weekday_mask int NOT NULL DEFAULT 127,
  active boolean NOT NULL DEFAULT true,
  auto_apply boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.booking_offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_offers TO authenticated;
GRANT ALL ON public.booking_offers TO service_role;
ALTER TABLE public.booking_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active offers" ON public.booking_offers FOR SELECT USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage offers" ON public.booking_offers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_booking_offers_updated BEFORE UPDATE ON public.booking_offers FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- EXTEND INQUIRIES
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS theme_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pose_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES public.booking_offers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booking_service_id uuid REFERENCES public.booking_services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booking_package_id uuid REFERENCES public.booking_packages(id) ON DELETE SET NULL;

-- Seed default hours (Mon-Sun open 10-14 & 15-21)
INSERT INTO public.booking_hours (day_of_week, blocks, session_minutes, open)
SELECT d, '[{"start":"10:00","end":"14:00"},{"start":"15:00","end":"21:00"}]'::jsonb, 55, true
FROM generate_series(0,6) d
ON CONFLICT (day_of_week) DO NOTHING;


-- SOURCE: supabase/migrations/20260708162711_e73496d1-411c-46ec-be18-b4fbea987f8f.sql

-- Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  baby_name TEXT,
  baby_dob DATE,
  baby_gender TEXT,
  phone TEXT,
  email TEXT,
  anniversary_date DATE,
  mother_name TEXT,
  father_name TEXT,
  city TEXT,
  address TEXT,
  notes TEXT,
  source TEXT,
  whatsapp_consent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage customers" ON public.customers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX customers_phone_idx ON public.customers(phone);

-- Custom important dates
CREATE TABLE public.customer_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  date DATE NOT NULL,
  recurring BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_dates TO authenticated;
GRANT ALL ON public.customer_dates TO service_role;
ALTER TABLE public.customer_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage customer_dates" ON public.customer_dates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Milestone configs
CREATE TABLE public.milestone_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  months INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(months)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestone_configs TO authenticated;
GRANT ALL ON public.milestone_configs TO service_role;
ALTER TABLE public.milestone_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage milestone_configs" ON public.milestone_configs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER milestone_configs_updated_at BEFORE UPDATE ON public.milestone_configs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Reminder offers
CREATE TABLE public.reminder_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  offer_type TEXT NOT NULL DEFAULT 'percent', -- percent | flat | free_item | text
  value NUMERIC,
  message TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_offers TO authenticated;
GRANT ALL ON public.reminder_offers TO service_role;
ALTER TABLE public.reminder_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage reminder_offers" ON public.reminder_offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER reminder_offers_updated_at BEFORE UPDATE ON public.reminder_offers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Message templates
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_templates TO authenticated;
GRANT ALL ON public.message_templates TO service_role;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage message_templates" ON public.message_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER message_templates_updated_at BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Reminders
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'baby_milestone', -- baby_milestone | anniversary | custom | birthday
  label TEXT NOT NULL,
  milestone_date DATE NOT NULL,
  remind_on DATE NOT NULL,
  offer_id UUID REFERENCES public.reminder_offers(id) ON DELETE SET NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sent | snoozed | dismissed
  sent_at TIMESTAMPTZ,
  snoozed_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, kind, label, milestone_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage reminders" ON public.reminders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER reminders_updated_at BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX reminders_remind_on_idx ON public.reminders(remind_on);
CREATE INDEX reminders_status_idx ON public.reminders(status);

-- Link inquiries to customers
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS inquiries_customer_id_idx ON public.inquiries(customer_id);

-- Seed default milestones
INSERT INTO public.milestone_configs (label, months, sort_order) VALUES
  ('1 Month', 1, 10),
  ('3 Months', 3, 20),
  ('5 Months', 5, 30),
  ('6 Months', 6, 40),
  ('9 Months', 9, 50),
  ('1 Year', 12, 60),
  ('18 Months', 18, 70),
  ('2 Years', 24, 80)
ON CONFLICT (months) DO NOTHING;

-- Seed message templates
INSERT INTO public.message_templates (body) VALUES
  ('Tiny hands, tiny feet, and memories that last forever. 💕'),
  ('Every month is a new adventure worth remembering. 📸'),
  ('Today''s little smile becomes tomorrow''s priceless memory. ✨'),
  ('They grow in the blink of an eye — capture every milestone. 🌸'),
  ('The cutest smiles deserve the most beautiful photographs. 📷');

-- Function: generate upcoming reminders (7 days ahead) for all active customers
CREATE OR REPLACE FUNCTION public.generate_upcoming_reminders(lookahead_days INTEGER DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count INTEGER := 0;
  c RECORD;
  m RECORD;
  milestone_dt DATE;
  remind_dt DATE;
BEGIN
  -- Baby milestones
  FOR c IN SELECT id, baby_dob FROM public.customers WHERE baby_dob IS NOT NULL LOOP
    FOR m IN SELECT label, months FROM public.milestone_configs WHERE active = true LOOP
      milestone_dt := c.baby_dob + (m.months || ' months')::interval;
      remind_dt := milestone_dt - (lookahead_days || ' days')::interval;
      IF remind_dt >= CURRENT_DATE - 1 AND remind_dt <= CURRENT_DATE + lookahead_days THEN
        INSERT INTO public.reminders (customer_id, kind, label, milestone_date, remind_on)
        VALUES (c.id, 'baby_milestone', m.label, milestone_dt, remind_dt)
        ON CONFLICT (customer_id, kind, label, milestone_date) DO NOTHING;
        IF FOUND THEN inserted_count := inserted_count + 1; END IF;
      END IF;
    END LOOP;
  END LOOP;

  -- Custom dates (recurring yearly)
  FOR c IN
    SELECT cd.customer_id, cd.label, cd.date, cd.recurring
    FROM public.customer_dates cd
  LOOP
    IF c.recurring THEN
      milestone_dt := make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM c.date)::int, EXTRACT(DAY FROM c.date)::int);
      IF milestone_dt < CURRENT_DATE THEN
        milestone_dt := milestone_dt + interval '1 year';
      END IF;
    ELSE
      milestone_dt := c.date;
    END IF;
    remind_dt := milestone_dt - (lookahead_days || ' days')::interval;
    IF remind_dt >= CURRENT_DATE - 1 AND remind_dt <= CURRENT_DATE + lookahead_days THEN
      INSERT INTO public.reminders (customer_id, kind, label, milestone_date, remind_on)
      VALUES (c.customer_id, 'custom', c.label, milestone_dt, remind_dt)
      ON CONFLICT (customer_id, kind, label, milestone_date) DO NOTHING;
    END IF;
  END LOOP;

  RETURN inserted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_upcoming_reminders(INTEGER) TO authenticated;


-- SOURCE: supabase/migrations/20260708162734_6198e1ee-3365-4eb9-a74b-3542ce3a50a6.sql

REVOKE EXECUTE ON FUNCTION public.generate_upcoming_reminders(INTEGER) FROM PUBLIC, authenticated;


-- SOURCE: supabase/migrations/20260806104407_835b3c69-49a1-4d2d-97d8-b469497c51ca.sql
ALTER TABLE public.images
  ADD COLUMN IF NOT EXISTS variants jsonb,
  ADD COLUMN IF NOT EXISTS optimized_at timestamptz;

-- SOURCE: supabase/migrations/20260809100416_86a66b97-9e4a-4386-b9a5-1c0b1136855a.sql
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'task',
  description text,
  contact_name text,
  phone text,
  event_date date NOT NULL,
  start_time time,
  end_time time,
  amount numeric,
  payment_status text,
  status text NOT NULL DEFAULT 'scheduled',
  priority text NOT NULL DEFAULT 'normal',
  reminder_at timestamptz,
  reminder_offset_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX calendar_events_date_idx ON public.calendar_events (event_date) WHERE deleted_at IS NULL;
CREATE INDEX calendar_events_customer_idx ON public.calendar_events (customer_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage calendar events" ON public.calendar_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- SOURCE: supabase/migrations/20260811140839_abf6537f-6d4f-4b89-9be6-baa07afa0b93.sql
CREATE TABLE public.studio_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note text NOT NULL,
  note_date date NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  moved_from_date date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_notes TO authenticated;
GRANT ALL ON public.studio_notes TO service_role;

ALTER TABLE public.studio_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage studio notes"
ON public.studio_notes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_studio_notes_date ON public.studio_notes (note_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_studio_notes_open ON public.studio_notes (is_completed, note_date) WHERE deleted_at IS NULL AND is_completed = false;

CREATE TRIGGER studio_notes_updated_at BEFORE UPDATE ON public.studio_notes
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- SOURCE: supabase/migrations/20260818065558_fa9b61a9-dfeb-444b-96a5-a6f2a0785d8d.sql

create or replace function public.gallery_object_public(objname text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- site-wide CMS assets (hero, covers) are public by design
    objname like 'site/%'
    or exists (
      select 1 from public.images i
      where i.hidden = false
        and (
          i.storage_path = objname
          or objname like (i.id::text || '/%')
          or split_part(objname, '/', 2) = i.id::text
          or split_part(split_part(objname, '/', 2), '.', 1) = i.id::text
        )
    );
$$;

revoke all on function public.gallery_object_public(text) from public;
grant execute on function public.gallery_object_public(text) to anon, authenticated, service_role;

drop policy if exists "gallery public read" on storage.objects;
create policy "gallery public read"
on storage.objects for select
to public
using (
  bucket_id = 'gallery'
  and (
    public.gallery_object_public(name)
    or has_role(auth.uid(), 'admin'::app_role)
  )
);

drop policy if exists "anon manage session favorites" on public.image_favorites;


-- SOURCE: supabase/migrations/20260818080306_7adf2590-c5bb-437d-8b04-376332fbeb42.sql
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

-- SOURCE: supabase/migrations/20260818095409_7fcaa52f-a3ab-4462-bea5-595c0f776384.sql
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


-- INTERNAL SOURCE PART 3, DO NOT RUN BY ITSELF.
-- Original migrations 23-33.

-- SOURCE: supabase/migrations/20260818095631_85f1b66f-8ec9-4927-a3b2-38e6ec2a9483.sql
-- SKIPPED FOR PRODUCTION SECURITY: historical validation-only block inserts/deletes temporary images and relies on seed category data.

-- SOURCE: supabase/migrations/20260819045115_217bdb8c-c73b-4682-a3f9-4ad2467d5f7b.sql
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS service_slug text;
ALTER TABLE public.customers ALTER COLUMN customer_name DROP NOT NULL;
CREATE INDEX IF NOT EXISTS customers_phone_digits_idx ON public.customers (regexp_replace(coalesce(phone,''), '[^0-9]', '', 'g'));
INSERT INTO public.settings (key, value)
VALUES ('google_profile_share_url', to_jsonb('https://share.google/T3UVPztmY6QZofvis'::text))
ON CONFLICT (key) DO NOTHING;

-- SOURCE: supabase/migrations/20260819053510_8c3d9bf0-d2d6-48d9-a693-90f29b162787.sql
DROP POLICY IF EXISTS "similar groups public read" ON public.image_similar_groups;
DROP POLICY IF EXISTS "similar members public read" ON public.image_similar_members;

CREATE POLICY "similar groups admin read" ON public.image_similar_groups
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "similar members admin read" ON public.image_similar_members
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE SELECT ON public.image_similar_groups FROM anon;
REVOKE SELECT ON public.image_similar_members FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_similar_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_similar_members TO authenticated;
GRANT ALL ON public.image_similar_groups TO service_role;
GRANT ALL ON public.image_similar_members TO service_role;

-- SOURCE: supabase/migrations/20260819092627_04992510-d015-41cf-b036-93e292a7ff0e.sql
REVOKE ALL ON public.image_similar_groups FROM anon;
REVOKE ALL ON public.image_similar_members FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_similar_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_similar_members TO authenticated;
GRANT ALL ON public.image_similar_groups TO service_role;
GRANT ALL ON public.image_similar_members TO service_role;

-- SOURCE: supabase/migrations/20260819183621_9190093a-fa0f-44d9-b796-292fd2136382.sql
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

-- SOURCE: supabase/migrations/20260819184255_1355a6f0-42b2-4329-b502-6c77c8285b9c.sql
CREATE TABLE public.contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  color text NOT NULL DEFAULT 'butter',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_notes TO authenticated;
GRANT ALL ON public.contact_notes TO service_role;
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage contact notes" ON public.contact_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX contact_notes_customer_idx ON public.contact_notes (customer_id, pinned DESC, created_at DESC);
CREATE TRIGGER contact_notes_updated_at BEFORE UPDATE ON public.contact_notes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.contact_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  what text NOT NULL,
  due_on date NOT NULL DEFAULT CURRENT_DATE,
  done_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_tasks TO authenticated;
GRANT ALL ON public.contact_tasks TO service_role;
ALTER TABLE public.contact_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage contact tasks" ON public.contact_tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX contact_tasks_due_idx ON public.contact_tasks (due_on) WHERE done_at IS NULL;
CREATE INDEX contact_tasks_customer_idx ON public.contact_tasks (customer_id, due_on);
CREATE TRIGGER contact_tasks_updated_at BEFORE UPDATE ON public.contact_tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- SOURCE: supabase/migrations/20260819185003_808610c0-41ef-4e97-9005-b769446aa373.sql
DROP POLICY IF EXISTS "settings readable by authenticated allowlist" ON public.settings;
CREATE POLICY "settings readable by authenticated allowlist"
ON public.settings
FOR SELECT
TO authenticated
USING (key IN ('maps_embed_url', 'site', 'communication', 'message_templates', 'google_profile_share_url'));

-- SOURCE: supabase/migrations/20260821115224_1cf40f39-845b-4369-a3ff-3d7cd78e12d9.sql
DROP POLICY IF EXISTS "settings public read allow-list" ON public.settings;
CREATE POLICY "settings public read allow-list" ON public.settings
FOR SELECT TO anon
USING (key = ANY (ARRAY['maps_embed_url'::text, 'google_profile_share_url'::text]));

-- SOURCE: supabase/migrations/20260821115611_e920c814-75f3-4b3e-abca-82efff609ba0.sql
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  inquiry_id uuid REFERENCES public.inquiries(id) ON DELETE SET NULL,
  contact_name text,
  phone text,
  service_slug text,
  service_label text,
  package_name text,
  session_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  notes text,
  total_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  balance_amount numeric GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('tentative','confirmed','completed','cancelled')),
  stage text NOT NULL DEFAULT 'upcoming' CHECK (stage IN ('upcoming','shot','editing','reels','delivered')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage bookings" ON public.bookings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX bookings_session_date_idx ON public.bookings (session_date) WHERE deleted_at IS NULL;
CREATE INDEX bookings_customer_idx ON public.bookings (customer_id);
CREATE INDEX bookings_balance_idx ON public.bookings (balance_amount) WHERE deleted_at IS NULL;

-- SOURCE: supabase/migrations/20260821121416_4c40b028-99b5-4817-ac49-2f459614a375.sql
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

-- Omitted unapproved sample cinematic-reel package prices.\n

-- SOURCE: supabase/migrations/20260821121444_dca74e80-2e71-4264-bb79-0eaafca3fe21.sql
REVOKE EXECUTE ON FUNCTION public.reels_enforce_short_id() FROM PUBLIC, anon, authenticated;


-- INTERNAL SOURCE PART 4, DO NOT RUN BY ITSELF.
-- Original migrations 34-41.

-- SOURCE: supabase/migrations/20260821121514_98cc3915-b8a7-43e5-a882-dd75a5bc4568.sql
CREATE POLICY "Admins manage reel videos"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'reels' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'reels' AND public.has_role(auth.uid(), 'admin'));

-- SOURCE: supabase/migrations/20260824105322_6a844c30-4932-40c6-8ade-6da90d1fc810.sql
DROP POLICY IF EXISTS "settings readable by authenticated allowlist" ON public.settings;
CREATE POLICY "settings readable by authenticated allowlist"
ON public.settings FOR SELECT TO authenticated
USING (key = ANY (ARRAY['maps_embed_url','site','google_profile_share_url']));

-- SOURCE: supabase/migrations/20260826140646_432dd528-f457-441a-86ac-f8e7c86567ce.sql
DROP POLICY IF EXISTS "settings readable by authenticated allowlist" ON public.settings;
CREATE POLICY "settings readable by authenticated" ON public.settings FOR SELECT TO authenticated USING (true);

-- SOURCE: supabase/migrations/20260826141001_f9e46413-11fc-45ef-8fad-d2ec3f8118c8.sql
-- EXCLUDED: unrestricted staff policies with USING (true) would expose private contact and CRM data to any signed-in account.

-- SOURCE: supabase/migrations/20260826152147_e11666bd-5634-4369-940c-ad4dc709ec4e.sql
-- SKIPPED FOR PRODUCTION SECURITY: historical SQL broadens all admin policies to any authenticated user. Keep admin-only RLS.

-- SOURCE: supabase/migrations/20261112090000_gifts_and_studio_workflow.sql
-- Rajmoti Studio independent-hosting extension (2026-11-12)
-- Run after the original 38 project migrations. No live customer/image rows are embedded here.

CREATE TABLE IF NOT EXISTS public.gift_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug TEXT NOT NULL CHECK (char_length(product_slug) BETWEEN 2 AND 80),
  product_name TEXT NOT NULL CHECK (char_length(product_name) BETWEEN 2 AND 120),
  requested_size TEXT NOT NULL DEFAULT 'To be discussed',
  customer_name TEXT NOT NULL CHECK (char_length(customer_name) BETWEEN 2 AND 140),
  phone TEXT NOT NULL CHECK (char_length(phone) BETWEEN 8 AND 20),
  email TEXT,
  customer_message TEXT NOT NULL DEFAULT '',
  photo_paths TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','confirmed','in_production','ready','fulfilled','cancelled')),
  quoted_price NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gift_orders_status_date_idx ON public.gift_orders(status, created_at DESC);
CREATE TRIGGER gift_orders_updated BEFORE UPDATE ON public.gift_orders FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
ALTER TABLE public.gift_orders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.gift_orders TO authenticated;
GRANT ALL ON public.gift_orders TO service_role;
CREATE POLICY "Only studio admins see and edit gift orders" ON public.gift_orders
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- No anonymous INSERT/SELECT: gift submissions must pass through the verified Edge Function.

CREATE TABLE IF NOT EXISTS public.studio_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  source_gift_order_id UUID UNIQUE REFERENCES public.gift_orders(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL CHECK (char_length(customer_name) BETWEEN 1 AND 140),
  phone TEXT NOT NULL DEFAULT '',
  photo_type TEXT NOT NULL DEFAULT 'Other',
  template_type TEXT NOT NULL DEFAULT 'custom',
  requested_size TEXT NOT NULL DEFAULT 'Not confirmed',
  restoration_instructions TEXT NOT NULL DEFAULT '',
  background_instructions TEXT NOT NULL DEFAULT '',
  memorial_name TEXT NOT NULL DEFAULT '',
  memorial_date TEXT NOT NULL DEFAULT '',
  memorial_tithi TEXT NOT NULL DEFAULT '',
  memorial_details TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  assumptions TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  job_status TEXT NOT NULL DEFAULT 'received' CHECK (job_status IN ('received','editing','review','printing','ready','delivered')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','advance','paid')),
  delivery_status TEXT NOT NULL DEFAULT 'not_ready' CHECK (delivery_status IN ('not_ready','ready','collected','sent')),
  total_amount NUMERIC(10,2) CHECK (total_amount IS NULL OR total_amount >= 0),
  amount_received NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (amount_received >= 0),
  received_on DATE NOT NULL DEFAULT CURRENT_DATE,
  due_on DATE,
  original_path TEXT,
  edited_path TEXT,
  review JSONB NOT NULL DEFAULT '{"identity_safe": false, "original_preserved": false, "instructions_checked": false, "size_verified": false, "client_approved": false}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT amount_received_not_over_total CHECK (total_amount IS NULL OR amount_received <= total_amount)
);
CREATE INDEX IF NOT EXISTS studio_jobs_queue_idx ON public.studio_jobs(job_status, due_on, priority);
CREATE INDEX IF NOT EXISTS studio_jobs_phone_idx ON public.studio_jobs(phone);
CREATE INDEX IF NOT EXISTS studio_jobs_updated_idx ON public.studio_jobs(updated_at DESC);
CREATE TRIGGER studio_jobs_updated BEFORE UPDATE ON public.studio_jobs FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
ALTER TABLE public.studio_jobs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_jobs TO authenticated;
GRANT ALL ON public.studio_jobs TO service_role;
CREATE POLICY "Only studio admins manage production jobs" ON public.studio_jobs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All customer-supplied images remain PRIVATE, accessible only by admin auth or service-role.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gift-order-photos', 'gift-order-photos', false, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('studio-job-files', 'studio-job-files', false, 20971520, ARRAY['image/jpeg','image/png','image/webp','image/tiff'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Admins manage gift photo objects" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'gift-order-photos' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'gift-order-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage studio job photo objects" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'studio-job-files' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'studio-job-files' AND public.has_role(auth.uid(), 'admin'));


-- SOURCE: supabase/migrations/20261112160000_explicit_owner_access.sql
-- New installations must assign the studio owner explicitly, not by an email string.
-- Existing admin role rows are preserved.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Original export created storage policies but assumed this bucket already existed.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('gallery','gallery',false,26214400,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;


-- SOURCE: supabase/migrations/20261122010000_reel_preview_url.sql
alter table public.reels
  add column if not exists preview_url text;

comment on column public.reels.preview_url is
  'Optional short silent web clip for hover previews on published reels.';


-- POST-INSTALL CHECKS: fail transaction if private public-schema tables have no RLS.
DO $verify$
DECLARE bad_tables text;
BEGIN
  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO bad_tables
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p')
    AND NOT c.relrowsecurity;
  IF bad_tables IS NOT NULL THEN
    RAISE EXCEPTION 'STOP: New public tables without RLS: %', bad_tables;
  END IF;

  IF to_regclass('public.customers') IS NULL
     OR to_regclass('public.bookings') IS NULL
     OR to_regclass('public.studio_jobs') IS NULL
     OR to_regclass('public.contact_tasks') IS NULL
     OR to_regclass('public.images') IS NULL THEN
    RAISE EXCEPTION 'STOP: Full schema bootstrap did not create all required studio tables.';
  END IF;
END $verify$;

-- Revalidate the two authorized administrator roles only for existing users.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE lower(email) IN ('rajmotistudio@gmail.com','jatinsakhija@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Refresh PostgREST API schema cache AFTER the transaction commits.
NOTIFY pgrst, 'reload schema';
COMMIT;

-- End. Refresh /admin/contacts ONLY after you verify results in 02-postcheck.sql.
