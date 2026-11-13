
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
