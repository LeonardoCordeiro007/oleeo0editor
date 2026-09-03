CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = uid AND role = 'admin');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin');
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content public read" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "content admin write" ON public.site_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_content_updated BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  format text NOT NULL DEFAULT 'short',
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  thumb_url text NOT NULL DEFAULT '',
  video_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos public read" ON public.videos FOR SELECT USING (true);
CREATE POLICY "videos admin write" ON public.videos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER videos_updated BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT '',
  handle text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'at',
  copyable boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contacts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts public read" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "contacts admin write" ON public.contacts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER contacts_updated BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_content (key, value) VALUES
  ('brand_name', 'OLEEO0 EDITOR'),
  ('brand_role', 'EDITOR DE VÍDEO'),
  ('hero_kicker', 'PORTFÓLIO 2026 / 32 PROJETOS'),
  ('hero_title_1', 'OLEEO0'),
  ('hero_title_2', 'EDITOR'),
  ('hero_text', 'Edição de vídeo com ritmo, cor e intenção. Do storyboard à colorização, cada frame recebe o cuidado que merece.'),
  ('hero_file', 'REEL_2026.MP4'),
  ('hero_timecode', '-00:00:42'),
  ('hero_image', '/images/hero-reel.jpg'),
  ('short_title', 'Short format'),
  ('short_meta', '9:16 / VERTICAL'),
  ('long_title', 'Long format'),
  ('long_meta', '16:9 / HORIZONTAL'),
  ('about_kicker', '(C) SOBRE'),
  ('about_title', 'Por trás da timeline'),
  ('about_text', 'Sou Oleeo0, editor e colorista. Trabalho com produtoras independentes e marcas que buscam uma linguagem própria. Menos excesso, mais intenção.'),
  ('about_image', '/images/about-editor.jpg'),
  ('contact_title', 'contact'),
  ('footer_text', 'OLEEO0 EDITOR — EDIÇÃO');

INSERT INTO public.videos (format, title, description, category, duration, thumb_url, video_url, sort_order) VALUES
  ('short', 'Pausa para Dança', '', '', '0:28', '/images/short-danca.jpg', '', 1),
  ('short', 'Ritual do Café', '', '', '0:19', '/images/short-cafe.jpg', '', 2),
  ('short', 'Pedal Neon', '', '', '0:34', '/images/short-pedal.jpg', '', 3),
  ('short', 'Comida de Rua', '', '', '0:22', '/images/short-comida.jpg', '', 4),
  ('long', 'Serra ao Amanhecer', 'Retrato de uma comunidade de montanha em 12 minutos de luz natural.', 'Documentário', '12:34', '/images/long-serra.jpg', '', 1),
  ('long', 'Eco de Estação', 'Set ao vivo editado com cortes sincronizados ao ritmo.', 'Performance', '8:12', '/images/long-eco.jpg', '', 2),
  ('long', 'Cozinha Aberta', 'Filme de marca para um restaurante, com a cozinha como protagonista.', 'Marca', '3:45', '/images/long-cozinha.jpg', '', 3);

INSERT INTO public.contacts (label, handle, url, icon, copyable, sort_order) VALUES
  ('DISCORD', '@lipefilipi', '', 'discord', true, 1),
  ('TWITTER / X', '@eusouluizf', 'https://x.com/eusouluizf', 'twitter', false, 2);
