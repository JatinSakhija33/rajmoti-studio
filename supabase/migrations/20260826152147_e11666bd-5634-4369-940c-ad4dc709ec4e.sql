-- Studio-internal tool: any signed-in account is studio staff.
DO $$
DECLARE p record; q text; wc text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, cmd, roles::text AS roles, qual, with_check
      FROM pg_policies
     WHERE (schemaname = 'public' OR (schemaname = 'storage' AND tablename = 'objects'))
       AND (qual ILIKE '%has_role%' OR with_check ILIKE '%has_role%')
  LOOP
    q := replace(coalesce(p.qual, ''), 'has_role(auth.uid(), ''admin''::app_role)', '(auth.uid() IS NOT NULL)');
    wc := replace(coalesce(p.with_check, ''), 'has_role(auth.uid(), ''admin''::app_role)', '(auth.uid() IS NOT NULL)');
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR %s TO %s %s %s',
      p.policyname, p.schemaname, p.tablename,
      CASE p.cmd WHEN 'ALL' THEN 'ALL' ELSE p.cmd END,
      trim(both '{}' from p.roles),
      CASE WHEN p.qual IS NULL THEN '' ELSE 'USING (' || q || ')' END,
      CASE WHEN p.with_check IS NULL THEN '' ELSE 'WITH CHECK (' || wc || ')' END
    );
  END LOOP;
END $$;