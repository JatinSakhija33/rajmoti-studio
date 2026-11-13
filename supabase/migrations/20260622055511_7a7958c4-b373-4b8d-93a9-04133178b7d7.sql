
-- Restrict profiles read to authenticated users
DROP POLICY IF EXISTS "profiles readable by all" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;
CREATE POLICY "profiles readable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Restrict settings read to authenticated users
DROP POLICY IF EXISTS "settings public read" ON public.settings;
REVOKE SELECT ON public.settings FROM anon;
CREATE POLICY "settings readable by authenticated" ON public.settings
  FOR SELECT TO authenticated USING (true);
