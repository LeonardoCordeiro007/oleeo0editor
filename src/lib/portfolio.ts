import { supabase } from "@/integrations/supabase/client";

export type VideoRow = {
  id: string;
  format: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  thumb_url: string;
  video_url: string;
  sort_order: number;
};

export type ContactRow = {
  id: string;
  label: string;
  handle: string;
  url: string;
  icon: string;
  copyable: boolean;
  sort_order: number;
};

export type ContentMap = Record<string, string>;

export const DEFAULT_CONTENT: ContentMap = {
  brand_name: "OLEEO0 EDITOR",
  brand_role: "EDITOR DE VÍDEO",
  hero_kicker: "PORTFÓLIO 2026 / 32 PROJETOS",
  hero_title_1: "OLEEO0",
  hero_title_2: "EDITOR",
  hero_text:
    "Edição de vídeo com ritmo, cor e intenção. Do storyboard à colorização, cada frame recebe o cuidado que merece.",
  hero_file: "REEL_2026.MP4",
  hero_timecode: "-00:00:42",
  hero_image: "/images/hero-reel.jpg",
  short_title: "Short format",
  short_meta: "9:16 / VERTICAL",
  long_title: "Long format",
  long_meta: "16:9 / HORIZONTAL",
  about_kicker: "(C) SOBRE",
  about_title: "Por trás da timeline",
  about_text:
    "Sou Oleeo0, editor e colorista. Trabalho com produtoras independentes e marcas que buscam uma linguagem própria. Menos excesso, mais intenção.",
  about_image: "/images/about-editor.jpg",
  contact_title: "contact",
  footer_text: "OLEEO0 EDITOR — EDIÇÃO",
};

export const CONTENT_FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: "brand_name", label: "Nome da marca (topo)" },
  { key: "brand_role", label: "Função (topo)" },
  { key: "hero_kicker", label: "Etiqueta acima do título" },
  { key: "hero_title_1", label: "Título — linha 1" },
  { key: "hero_title_2", label: "Título — linha 2" },
  { key: "hero_text", label: "Texto de apresentação", multiline: true },
  { key: "hero_file", label: "Nome do arquivo (reel)" },
  { key: "hero_timecode", label: "Timecode do reel" },
  { key: "hero_image", label: "Imagem do reel (URL)" },
  { key: "short_title", label: "Título da seção vertical" },
  { key: "short_meta", label: "Etiqueta da seção vertical" },
  { key: "long_title", label: "Título da seção horizontal" },
  { key: "long_meta", label: "Etiqueta da seção horizontal" },
  { key: "about_kicker", label: "Etiqueta do sobre" },
  { key: "about_title", label: "Título do sobre" },
  { key: "about_text", label: "Texto do sobre", multiline: true },
  { key: "about_image", label: "Foto do sobre (URL)" },
  { key: "contact_title", label: "Título dos contatos" },
  { key: "footer_text", label: "Texto do rodapé" },
];

export async function fetchContent(): Promise<ContentMap> {
  const { data, error } = await supabase.from("site_content").select("key, value");
  if (error) throw error;
  const map: ContentMap = { ...DEFAULT_CONTENT };
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

export async function fetchVideos(): Promise<VideoRow[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as VideoRow[];
}

export async function fetchContacts(): Promise<ContactRow[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ContactRow[];
}
