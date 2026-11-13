ALTER TABLE public.images
  ADD COLUMN IF NOT EXISTS variants jsonb,
  ADD COLUMN IF NOT EXISTS optimized_at timestamptz;