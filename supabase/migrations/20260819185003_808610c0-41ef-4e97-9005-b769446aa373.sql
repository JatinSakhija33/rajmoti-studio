DROP POLICY IF EXISTS "settings readable by authenticated allowlist" ON public.settings;
CREATE POLICY "settings readable by authenticated allowlist"
ON public.settings
FOR SELECT
TO authenticated
USING (key IN ('maps_embed_url', 'site', 'communication', 'message_templates', 'google_profile_share_url'));