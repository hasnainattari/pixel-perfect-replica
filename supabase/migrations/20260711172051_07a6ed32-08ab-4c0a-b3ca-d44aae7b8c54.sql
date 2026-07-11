
CREATE POLICY "Public read evidence" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'evidence');
CREATE POLICY "Auth write evidence" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence');
CREATE POLICY "Auth update evidence" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'evidence');
