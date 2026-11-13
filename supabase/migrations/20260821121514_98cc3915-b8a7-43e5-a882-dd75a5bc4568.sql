CREATE POLICY "Admins manage reel videos"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'reels' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'reels' AND public.has_role(auth.uid(), 'admin'));