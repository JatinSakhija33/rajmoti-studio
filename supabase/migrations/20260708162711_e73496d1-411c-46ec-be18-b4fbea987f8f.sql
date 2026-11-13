
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
