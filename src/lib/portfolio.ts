import { supabase } from "@/integrations/supabase/client";

export const ICON_URL = "/rudeus.jpg";

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

  // Vazios no fallback: evita o texto do reel piscar antes do Supabase carregar.
  hero_file: "",
  hero_timecode: "",

  // Sem imagem de fallback: evita mostrar uma imagem errada antes do conteúdo do Supabase carregar.
  hero_image: "",

  short_title: "Short format",
  short_meta: "9:16 / VERTICAL",
  long_title: "Long format",
  long_meta: "16:9 / HORIZONTAL",
  about_title: "Sobre mim",
  about_text:
    "Sou Oleeo0, editor e colorista. Trabalho com produtoras independentes e marcas que buscam uma linguagem própria. Menos excesso, mais intenção.",

  // Placeholder transparente: evita mostrar a foto de exemplo durante o carregamento.
  about_image:
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",

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

  // Vazios no fallback: evita o texto do reel piscar antes do Supabase carregar.
  hero_file: "",
  hero_timecode: "",

  hero_image: "",

  short_title: "Short format",
  short_meta: "9:16 / VERTICAL",
  long_title: "Long format",
  long_meta: "16:9 / HORIZONTAL",
  about_title: "About me",
  about_text:
    "I'm Oleeo0, editor and colorist. I work with independent production companies and brands looking for a voice of their own. Less excess, more intention.",

  // Placeholder transparente: evita mostrar a foto de exemplo durante o carregamento.
  about_image:
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",

  contact_title: "contact",
  footer_text: "OLEEO0 EDITOR — EDITING",
};

/** Lê um texto respeitando o idioma: em inglês usa a chave `<key>_en` quando preenchida. */
export function t(content: ContentMap, key: string, lang: Lang): string {
  if (lang === "en") {
    const en = content[`${key}_en`];
    if (en && en.trim()) return en;

    // Imagens são compartilhadas entre idiomas — nunca cair no padrão em inglês.
    if (IMAGE_FIELDS.has(key)) return content[key] ?? DEFAULT_CONTENT[key] ?? "";

    return DEFAULT_CONTENT_EN[key] ?? content[key] ?? "";
  }

  return content[key] ?? DEFAULT_CONTENT[key] ?? "";
}

export const UI_TEXT = {
  pt: {
    home: "Home",
    projects: "Projetos",
    about: "Sobre",
    contact: "Contato",
    close: "Fechar",
  },
  en: {
    home: "Home",
    projects: "Projects",
    about: "About",
    contact: "Contact",
    close: "Close",
  },
} as const;

export const CONTENT_FIELDS: {
  key: string;
  label: string;
  multiline?: boolean;
}[] = [
  { key: "brand_name", label: "Nome da marca (topo)" },
  { key: "brand_role", label: "Função (topo)" },
  { key: "hero_kicker", label: "Etiqueta acima do título" },
  { key: "hero_title_1", label: "Título — linha 1" },
  { key: "hero_title_2", label: "Título — linha 2" },
  { key: "hero_text", label: "Texto de apresentação", multiline: true },
  { key: "hero_file", label: "Nome do arquivo (reel)" },
  { key: "hero_timecode", label: "Timecode do reel" },
  { key: "hero_image", label: "Imagem principal do topo (URL)" },
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
export const NON_TRANSLATABLE = new Set([
  "hero_image",
  "about_image",
  "hero_timecode",
]);

/** Prefixo usado quando a imagem foi enviada para o armazenamento do projeto. */
export const STORAGE_PREFIX = "storage:";

export async function fetchContent(): Promise<ContentMap> {
  const { data, error } = await supabase
    .from("site_content")
    .select("key, value");

  if (error) throw error;

  const map: ContentMap = { ...DEFAULT_CONTENT };
  for (const row of data ?? []) map[row.key] = row.value;

  const storageEntries = Object.entries(map).filter(([, value]) =>
    value?.startsWith(STORAGE_PREFIX),
  );

  if (storageEntries.length === 0) return map;

  const paths = storageEntries.map(([, value]) =>
    value.slice(STORAGE_PREFIX.length),
  );

  const { data: signedImages, error: signError } = await supabase.storage
    .from("portfolio-videos")
    .createSignedUrls(paths, 3600);

  if (signError || !signedImages) return map;

  storageEntries.forEach(([key], index) => {
    map[key] = signedImages[index]?.signedUrl ?? "";
  });

  return map;
}

export async function fetchVideos(): Promise<VideoRow[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const videos = (data ?? []) as VideoRow[];

  // Antes: até 2 requisições extras por vídeo (thumbnail + vídeo).
  // Agora: todas as URLs assinadas são geradas em UMA única requisição.
  const paths = Array.from(
    new Set(
      videos.flatMap((video) =>
        [video.thumb_path, video.video_path].filter(
          (path): path is string => Boolean(path),
        ),
      ),
    ),
  );

  if (paths.length === 0) return videos;

  const { data: signedFiles, error: signError } = await supabase.storage
    .from("portfolio-videos")
    .createSignedUrls(paths, 3600);

  if (signError || !signedFiles) return videos;

  const urlByPath = new Map<string, string>();

  paths.forEach((path, index) => {
    const signedUrl = signedFiles[index]?.signedUrl;
    if (signedUrl) urlByPath.set(path, signedUrl);
  });

  return videos.map((video) => ({
    ...video,
    video_url:
      (video.video_path && urlByPath.get(video.video_path)) ||
      video.video_url,
    thumb_url:
      (video.thumb_path && urlByPath.get(video.thumb_path)) ||
      video.thumb_url,
  }));
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
  const { data, error } = await supabase
    .from("site_content")
    .select("key, value");

  if (error) throw error;

  const map: ContentMap = { ...DEFAULT_CONTENT };

  for (const row of data ?? []) map[row.key] = row.value;

  return map;
}
