CREATE OR REPLACE FUNCTION public.get_taken_slots(d date)
RETURNS TABLE(slot text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT session_slot
  FROM public.inquiries
  WHERE session_date = d
    AND session_slot IS NOT NULL
    AND status <> 'cancelled'::inquiry_status;
$$;

REVOKE ALL ON FUNCTION public.get_taken_slots(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_taken_slots(date) TO anon, authenticated;
