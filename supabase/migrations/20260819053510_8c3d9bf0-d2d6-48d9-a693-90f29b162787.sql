DROP POLICY IF EXISTS "similar groups public read" ON public.image_similar_groups;
DROP POLICY IF EXISTS "similar members public read" ON public.image_similar_members;

CREATE POLICY "similar groups admin read" ON public.image_similar_groups
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "similar members admin read" ON public.image_similar_members
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE SELECT ON public.image_similar_groups FROM anon;
REVOKE SELECT ON public.image_similar_members FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_similar_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_similar_members TO authenticated;
GRANT ALL ON public.image_similar_groups TO service_role;
GRANT ALL ON public.image_similar_members TO service_role;