
GRANT SELECT ON public.settings TO anon;
CREATE POLICY "settings public read allow-list" ON public.settings
  FOR SELECT TO anon
  USING (key IN ('maps_embed_url'));
