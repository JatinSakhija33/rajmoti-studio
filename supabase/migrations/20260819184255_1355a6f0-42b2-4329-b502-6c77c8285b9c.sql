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