ALTER TABLE public.videos
ADD COLUMN video_path text,
ADD COLUMN thumb_path text;

CREATE POLICY "portfolio videos public read"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'portfolio-videos');