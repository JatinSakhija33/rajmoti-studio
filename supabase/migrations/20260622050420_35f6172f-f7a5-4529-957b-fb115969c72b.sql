
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

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
CREATE POLICY "profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

INSERT INTO public.packages (category_id, slug, name, description, price, currency, featured, display_order) VALUES
  ((SELECT id FROM public.categories WHERE slug='baby'), 'baby-essence', 'Essence', '90-minute studio session with one theme setup, 15 hand-edited frames delivered digitally.', 8500, 'INR', false, 1),
  ((SELECT id FROM public.categories WHERE slug='baby'), 'baby-heritage', 'Heritage', 'Three theme setups, 50 edited frames, premium linen photo book.', 22000, 'INR', true, 2),
  ((SELECT id FROM public.categories WHERE slug='maternity'), 'maternity-classic', 'Maternity Classic', 'Indoor or outdoor session, 25 edited frames, online gallery.', 12000, 'INR', true, 1),
  ((SELECT id FROM public.categories WHERE slug='family'), 'family-portrait', 'Family Portrait', 'Studio or location session, 30 edited frames, framed signature print.', 15000, 'INR', false, 1),
  ((SELECT id FROM public.categories WHERE slug='wedding'), 'wedding-legacy', 'Wedding Legacy', 'Full-day coverage, two photographers, 400+ frames, heirloom album.', 145000, 'INR', true, 1);

INSERT INTO public.package_features (package_id, feature, display_order) VALUES
  ((SELECT id FROM public.packages WHERE slug='baby-essence'), '90-minute studio session', 1),
  ((SELECT id FROM public.packages WHERE slug='baby-essence'), '1 theme setup', 2),
  ((SELECT id FROM public.packages WHERE slug='baby-essence'), '15 hand-edited digital frames', 3),
  ((SELECT id FROM public.packages WHERE slug='baby-heritage'), '3 theme setups', 1),
  ((SELECT id FROM public.packages WHERE slug='baby-heritage'), '50 hand-edited frames', 2),
  ((SELECT id FROM public.packages WHERE slug='baby-heritage'), 'Premium linen photo book', 3),
  ((SELECT id FROM public.packages WHERE slug='baby-heritage'), 'Online private gallery', 4),
  ((SELECT id FROM public.packages WHERE slug='maternity-classic'), 'Indoor or outdoor location', 1),
  ((SELECT id FROM public.packages WHERE slug='maternity-classic'), '25 hand-edited frames', 2),
  ((SELECT id FROM public.packages WHERE slug='maternity-classic'), 'Wardrobe consultation', 3),
  ((SELECT id FROM public.packages WHERE slug='family-portrait'), 'Studio or location session', 1),
  ((SELECT id FROM public.packages WHERE slug='family-portrait'), '30 hand-edited frames', 2),
  ((SELECT id FROM public.packages WHERE slug='family-portrait'), 'Framed signature print', 3),
  ((SELECT id FROM public.packages WHERE slug='wedding-legacy'), 'Full-day coverage', 1),
  ((SELECT id FROM public.packages WHERE slug='wedding-legacy'), 'Two photographers', 2),
  ((SELECT id FROM public.packages WHERE slug='wedding-legacy'), '400+ edited frames', 3),
  ((SELECT id FROM public.packages WHERE slug='wedding-legacy'), 'Heirloom linen album', 4),
  ((SELECT id FROM public.packages WHERE slug='wedding-legacy'), 'Private cinematic teaser reel', 5);

-- Named testimonial seed rows omitted from the source export.

INSERT INTO public.settings (key, value) VALUES
  ('site', '{"studio_name":"Rajmoti Studio","tagline":"Capturing Life''s Most Beautiful Moments","email":"rajmotistudio@gmail.com","phone":"+91 00000 00000","whatsapp":"+910000000000","address":"India","instagram":"https://instagram.com/rajmotistudio"}'::jsonb),
  ('hero', '{"title_line_1":"Capturing Life''s Most","title_line_2":"Beautiful Moments","subtitle":"Bespoke photography for the milestones that define your legacy."}'::jsonb);
