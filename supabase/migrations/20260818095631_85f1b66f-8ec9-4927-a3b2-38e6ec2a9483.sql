DO $$
DECLARE cat uuid; rid uuid; sid text; sid2 text; ok boolean := false;
BEGIN
  SELECT id INTO cat FROM public.categories LIMIT 1;
  INSERT INTO public.images (image_url, category_id, theme, hidden)
  VALUES ('https://example.com/test.webp', cat, 'Princess Theme', false)
  RETURNING id, short_id INTO rid, sid;
  RAISE NOTICE 'generated short_id: %', sid;
  UPDATE public.images SET short_id = 'hacked', title = 'renamed', category_id = cat WHERE id = rid;
  SELECT short_id INTO sid2 FROM public.images WHERE id = rid;
  IF sid2 <> sid THEN RAISE EXCEPTION 'public id changed! % -> %', sid, sid2; END IF;
  BEGIN
    INSERT INTO public.images (image_url, category_id, hidden) VALUES ('https://example.com/bad.webp', NULL, false);
  EXCEPTION WHEN others THEN ok := true;
  END;
  IF NOT ok THEN RAISE EXCEPTION 'published photo without category was allowed'; END IF;
  DELETE FROM public.images WHERE id = rid;
  RAISE NOTICE 'verification passed';
END $$;