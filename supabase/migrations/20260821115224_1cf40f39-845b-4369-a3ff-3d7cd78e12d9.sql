DROP POLICY IF EXISTS "settings public read allow-list" ON public.settings;
CREATE POLICY "settings public read allow-list" ON public.settings
FOR SELECT TO anon
USING (key = ANY (ARRAY['maps_embed_url'::text, 'google_profile_share_url'::text]));