import { supabase } from "@/integrations/supabase/client";
import iconAsset from "@/assets/icon.jpg.asset.json";

export const ICON_URL = iconAsset.url;

export type Lang = "pt" | "en";

export type VideoRow = {
  id: string;
  format: string;
  title: string;
  description: string;
  category: string;
  title_en?: string;
  description_en?: string;
  category_en?: string;
  duration: string;
  thumb_url: string;
  video_url: string;
  thumb_path?: string | null;
  video_path?: string | null;
  sort_order: number;
  lang?: string;
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
  hero_image: ICON_URL,
  short_title: "Short format",
  short_meta: "9:16 / VERTICAL",
  long_title: "Long format",
  long_meta: "16:9 / HORIZONTAL",
  about_title: "Sobre mim",
  about_text:
    "Sou Oleeo0, editor e colorista. Trabalho com produtoras independentes e marcas que buscam uma linguagem própria. Menos excesso, mais intenção.",
  about_image: "/images/about-editor.jpg",
  contact_title: "contact",
  footer_text: "OLEEO0 EDITOR — EDIÇÃO",
};

export const DEFAULT_CONTENT_EN: ContentMap = {
  brand_name: "OLEEO0 EDITOR",
  brand_role: "VIDEO EDITOR",
  hero_kicker: "PORTFOLIO 2026 / 32 PROJECTS",
  hero_title_1: "OLEEO0",
  hero_title_2: "EDITOR",
  hero_text:
    "Video editing with rhythm, color and intention. From storyboard to color grading, every frame gets the care it deserves.",
  hero_file: "REEL_2026.MP4",
  hero_timecode: "-00:00:42",
  hero_image: ICON_URL,
  short_title: "Short format",
  short_meta: "9:16 / VERTICAL",
  long_title: "Long format",
  long_meta: "16:9 / HORIZONTAL",
  about_title: "About me",
  about_text:
    "I'm Oleeo0, editor and colorist. I work with independent production companies and brands looking for a voice of their own. Less excess, more intention.",
  about_image: "/images/about-editor.jpg",
  contact_title: "contact",
  footer_text: "OLEEO0 EDITOR — EDITING",
};

/** Lê um texto respeitando o idioma: em inglês usa a chave `<key>_en` quando preenchida. */
export function t(content: ContentMap, key: string, lang: Lang): string {
  if (lang === "en") {
    const en = content[`${key}_en`];
    if (en && en.trim()) return en;
    return DEFAULT_CONTENT_EN[key] ?? content[key] ?? "";
  }
  return content[key] ?? DEFAULT_CONTENT[key] ?? "";
}

export const UI_TEXT = {
  pt: { home: "Home", projects: "Projetos", about: "Sobre", contact: "Contato", close: "Fechar" },
  en: { home: "Home", projects: "Projects", about: "About", contact: "Contact", close: "Close" },
} as const;

export const CONTENT_FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: "brand_name", label: "Nome da marca (topo)" },
  { key: "brand_role", label: "Função (topo)" },
  { key: "hero_kicker", label: "Etiqueta acima do título" },
  { key: "hero_title_1", label: "Título — linha 1" },
  { key: "hero_title_2", label: "Título — linha 2" },
  { key: "hero_text", label: "Texto de apresentação", multiline: true },
  { key: "hero_file", label: "Nome do arquivo (reel)" },
  { key: "hero_timecode", label: "Timecode do reel" },
  { key: "hero_image", label: "Imagem/ícone do topo (URL)" },
  { key: "short_title", label: "Título da seção vertical" },
  { key: "short_meta", label: "Etiqueta da seção vertical" },
  { key: "long_title", label: "Título da seção horizontal" },
  { key: "long_meta", label: "Etiqueta da seção horizontal" },
  { key: "about_title", label: "Título do sobre" },
  { key: "about_text", label: "Texto do sobre", multiline: true },
  { key: "about_image", label: "Foto do sobre (URL)" },
  { key: "contact_title", label: "Título dos contatos" },
  { key: "footer_text", label: "Texto do rodapé" },
];

/** Campos que não são traduzíveis (imagens, timecode). */
export const NON_TRANSLATABLE = new Set(["hero_image", "about_image", "hero_timecode"]);


/** Prefixo usado quando a imagem foi enviada para o armazenamento do projeto. */
export const STORAGE_PREFIX = "storage:";

async function resolveImage(value: string): Promise<string> {
  if (!value.startsWith(STORAGE_PREFIX)) return value;
  const path = value.slice(STORAGE_PREFIX.length);
  const { data } = await supabase.storage.from("portfolio-videos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? "";
}

export async function fetchContent(): Promise<ContentMap> {
  const { data, error } = await supabase.from("site_content").select("key, value");
  if (error) throw error;
  const map: ContentMap = { ...DEFAULT_CONTENT };
  for (const row of data ?? []) map[row.key] = row.value;
  await Promise.all(
    Object.keys(map)
      .filter((key) => map[key]?.startsWith(STORAGE_PREFIX))
      .map(async (key) => {
        map[key] = await resolveImage(map[key] ?? "");
      }),
  );
  return map;
}


export async function fetchVideos(): Promise<VideoRow[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  const videos = (data ?? []) as VideoRow[];
  return Promise.all(
    videos.map(async (video) => {
      const [videoResult, thumbResult] = await Promise.all([
        video.video_path
          ? supabase.storage.from("portfolio-videos").createSignedUrl(video.video_path, 3600)
          : Promise.resolve({ data: null, error: null }),
        video.thumb_path
          ? supabase.storage.from("portfolio-videos").createSignedUrl(video.thumb_path, 3600)
          : Promise.resolve({ data: null, error: null }),
      ]);

      return {
        ...video,
        video_url: videoResult.data?.signedUrl ?? video.video_url,
        thumb_url: thumbResult.data?.signedUrl ?? video.thumb_url,
      };
    }),
  );
}

export async function fetchContacts(): Promise<ContactRow[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ContactRow[];
}

/** Campos de conteúdo que são imagens. */
export const IMAGE_FIELDS = new Set(["hero_image", "about_image"]);

/** Conteúdo sem resolver imagens (para edição no painel). */
export async function fetchRawContent(): Promise<ContentMap> {
  const { data, error } = await supabase.from("site_content").select("key, value");
  if (error) throw error;
  const map: ContentMap = { ...DEFAULT_CONTENT };
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}
