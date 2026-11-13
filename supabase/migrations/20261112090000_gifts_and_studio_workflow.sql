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
