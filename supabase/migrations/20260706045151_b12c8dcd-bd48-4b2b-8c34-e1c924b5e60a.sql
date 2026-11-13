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
