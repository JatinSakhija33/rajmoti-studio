DROP POLICY IF EXISTS "settings readable by authenticated allowlist" ON public.settings;
CREATE POLICY "settings readable by authenticated" ON public.settings FOR SELECT TO authenticated USING (true);