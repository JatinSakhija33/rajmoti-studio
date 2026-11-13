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