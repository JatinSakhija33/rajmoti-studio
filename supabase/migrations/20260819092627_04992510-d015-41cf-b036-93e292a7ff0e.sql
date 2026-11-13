REVOKE ALL ON public.image_similar_groups FROM anon;
REVOKE ALL ON public.image_similar_members FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_similar_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_similar_members TO authenticated;
GRANT ALL ON public.image_similar_groups TO service_role;
GRANT ALL ON public.image_similar_members TO service_role;