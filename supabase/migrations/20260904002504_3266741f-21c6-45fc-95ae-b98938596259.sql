CREATE POLICY "portfolio videos admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'portfolio-videos' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "portfolio videos admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'portfolio-videos' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'portfolio-videos' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "portfolio videos admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'portfolio-videos' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "portfolio videos admin read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'portfolio-videos' AND public.has_role(auth.uid(), 'admin'::public.app_role));