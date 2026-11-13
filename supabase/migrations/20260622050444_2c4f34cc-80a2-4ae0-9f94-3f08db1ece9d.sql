
DROP POLICY IF EXISTS "anyone can submit inquiry" ON public.inquiries;
CREATE POLICY "anyone can submit inquiry" ON public.inquiries FOR INSERT
  WITH CHECK (
    length(coalesce(name,'')) BETWEEN 1 AND 200
    AND length(coalesce(message,'')) <= 5000
    AND length(coalesce(phone,'')) <= 50
    AND length(coalesce(whatsapp,'')) <= 50
    AND length(coalesce(email,'')) <= 320
  );

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
