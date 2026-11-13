ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'cancelled';
