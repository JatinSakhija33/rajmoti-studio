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