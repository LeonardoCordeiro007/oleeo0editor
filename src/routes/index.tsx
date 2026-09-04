import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  AtSign,
  Check,
  Copy,
  Instagram,
  Mail,
  MessageCircle,
  Play,
  X,
  Youtube,
} from "lucide-react";

import {
  DEFAULT_CONTENT,
  ICON_URL,
  UI_TEXT,
  fetchContacts,
  fetchContent,
  fetchVideos,
  t,
  type ContactRow,
  type Lang,
  type VideoRow,
} from "@/lib/portfolio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oleeo0 Editor — Portfólio de Edição de Vídeo" },
      {
        name: "description",
        content:
          "Portfólio de edição de vídeo: projetos em formato curto e longo, com ritmo, cor e intenção.",
      },
      { property: "og:title", content: "Oleeo0 Editor — Portfólio de Edição de Vídeo" },
      {
        property: "og:description",
        content: "Projetos em formato curto e longo editados com ritmo, cor e intenção.",
      },
    ],
  }),
  component: Portfolio,
});

const FALLBACK_SHORTS: VideoRow[] = [
  {
    id: "s1",
    format: "short",
    title: "Pausa para Dança",
    description: "",
    category: "",
    duration: "0:28",
    thumb_url: "/images/short-danca.jpg",
    video_url: "",
    sort_order: 1,
  },
  {
    id: "s2",
    format: "short",
    title: "Ritual do Café",
    description: "",
    category: "",
    duration: "0:19",
    thumb_url: "/images/short-cafe.jpg",
    video_url: "",
    sort_order: 2,
  },
  {
    id: "s3",
    format: "short",
    title: "Pedal Neon",
    description: "",
    category: "",
    duration: "0:34",
    thumb_url: "/images/short-pedal.jpg",
    video_url: "",
    sort_order: 3,
  },
  {
    id: "s4",
    format: "short",
    title: "Comida de Rua",
    description: "",
    category: "",
    duration: "0:22",
    thumb_url: "/images/short-comida.jpg",
    video_url: "",
    sort_order: 4,
  },
];

const FALLBACK_LONGS: VideoRow[] = [
  {
    id: "l1",
    format: "long",
    title: "Serra ao Amanhecer",
    description: "Retrato de uma comunidade de montanha em 12 minutos de luz natural.",
    category: "Documentário",
    duration: "12:34",
    thumb_url: "/images/long-serra.jpg",
    video_url: "",
    sort_order: 1,
  },
  {
    id: "l2",
    format: "long",
    title: "Eco de Estação",
    description: "Set ao vivo editado com cortes sincronizados ao ritmo.",
    category: "Performance",
    duration: "8:12",
    thumb_url: "/images/long-eco.jpg",
    video_url: "",
    sort_order: 2,
  },
  {
    id: "l3",
    format: "long",
    title: "Cozinha Aberta",
    description: "Filme de marca para um restaurante, com a cozinha como protagonista.",
    category: "Marca",
    duration: "3:45",
    thumb_url: "/images/long-cozinha.jpg",
    video_url: "",
    sort_order: 3,
  },
];

const FALLBACK_CONTACTS: ContactRow[] = [
  {
    id: "c1",
    label: "DISCORD",
    handle: "@o_leeo0",
    url: "",
    icon: "discord",
    copyable: true,
    sort_order: 1,
  },
  {
    id: "c2",
    label: "TWITTER / X",
    handle: "@Oleeo0_",
    url: "https://x.com/eusouluizf",
    icon: "twitter",
    copyable: false,
    sort_order: 2,
  },
  {
    id: "c3",
    label: "E-MAIL",
    handle: "oleeo0.contato@gmail.com",
    url: "mailto:oleeo0.contato@gmail.com",
    icon: "mail",
    copyable: true,
    sort_order: 3,
  },
];

function ContactIcon({ icon }: { icon: string }) {
  const cls = "h-5 w-5";
  if (icon === "discord") return <MessageCircle className={cls} />;
  if (icon === "instagram") return <Instagram className={cls} />;
  if (icon === "youtube") return <Youtube className={cls} />;
  if (icon === "mail") return <Mail className={cls} />;
  return <AtSign className={cls} />;
}

function videoTitle(v: VideoRow, lang: Lang) {
  return (lang === "en" && v.title_en?.trim()) || v.title;
}
function videoDescription(v: VideoRow, lang: Lang) {
  return (lang === "en" && v.description_en?.trim()) || v.description;
}
function videoCategory(v: VideoRow, lang: Lang) {
  return (lang === "en" && v.category_en?.trim()) || v.category;
}

function highlightEditor(text: string) {
  if (!text.includes("EDITOR")) return text;
  const [before, after] = text.split("EDITOR");
  return (
    <>
      {before}
      <span className="text-signal">EDITOR</span>
      {after}
    </>
  );
}

function Portfolio() {
  const [lang, setLangState] = useState<Lang>("pt");
  const [active, setActive] = useState<VideoRow | null>(null);

  // Restaura o idioma salvo após a hidratação.
  useEffect(() => {
    const saved = window.localStorage.getItem("portfolio-lang");
    if (saved === "en" || saved === "pt") setLangState(saved);
  }, []);

  // Trocar de idioma "recarrega" a página: volta ao topo e refaz as animações de entrada.
  const setLang = (next: Lang) => {
    if (next === lang) return;
    window.localStorage.setItem("portfolio-lang", next);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setLangState(next);
  };

  const { data: content = DEFAULT_CONTENT } = useQuery({
    queryKey: ["content"],
    queryFn: fetchContent,
    placeholderData: DEFAULT_CONTENT,
  });
  const { data: videos = [] } = useQuery({
    queryKey: ["videos"],
    queryFn: fetchVideos,
    placeholderData: [...FALLBACK_SHORTS, ...FALLBACK_LONGS],
  });
  const { data: contacts = FALLBACK_CONTACTS } = useQuery({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
    placeholderData: FALLBACK_CONTACTS,
  });

  const ui = UI_TEXT[lang];
  // Vídeos são separados por idioma; se um idioma ainda não tem vídeos, reaproveita os de PT.
  const ptVideos = videos.filter((v) => (v.lang ?? "pt") !== "en");
  const enVideos = videos.filter((v) => v.lang === "en");
  const langVideos = lang === "en" && enVideos.length > 0 ? enVideos : ptVideos;
  const shorts = langVideos.filter((v) => v.format === "short");
  const longs = langVideos.filter((v) => v.format === "long");

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-6 py-4">
          <img
            src={ICON_URL}
            alt="Ícone do editor"
            width={32}
            height={32}
            className="h-8 w-8 rounded-md object-cover ring-1 ring-signal/40"
          />
          <span className="font-display text-lg tracking-wide">{highlightEditor(t(content, "brand_name", lang))}</span>
          <span className="mono-label hidden sm:inline">{t(content, "brand_role", lang)}</span>

          <nav className="ml-auto flex items-center gap-1">
            {[
              { id: "home", label: ui.home },
              { id: "projetos", label: ui.projects },
              { id: "about", label: ui.about },
              { id: "contato", label: ui.contact },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </button>
            ))}
            <div className="relative ml-2 flex rounded-full border border-signal/50 p-0.5">
              <span
                aria-hidden
                className="absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-signal transition-transform duration-300 ease-out"
                style={{ transform: lang === "en" ? "translateX(100%)" : "translateX(0)" }}
              />
              {(["pt", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`relative z-10 rounded-full px-3 py-1 font-mono text-xs tracking-widest uppercase transition-colors duration-300 ${
                    lang === l ? "text-background" : "text-signal hover:text-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main key={lang} className="mx-auto max-w-[1200px] px-6 animate-fade-in">
        {/* HERO */}
        <section id="home" className="scroll-mt-24 grid gap-10 py-16 md:grid-cols-[1.1fr_1fr] md:items-center md:py-24">
          <div>
            <p className="mono-label flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" />
              {t(content, "hero_kicker", lang)}
            </p>
            <h1 className="display-title mt-5 text-[clamp(3.5rem,12vw,8rem)] text-foreground">
              {t(content, "hero_title_1", lang)}
              <br />
              {t(content, "hero_title_2", lang)}
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t(content, "hero_text", lang)}
            </p>
          </div>

          <figure className="frame overflow-hidden p-3">
            <div className="glow-media overflow-hidden rounded-xl">
              <img
                src={t(content, "hero_image", lang)}
                alt="Ícone do editor"
                width={1280}
                height={1280}
                className="aspect-square w-full object-cover"
              />
            </div>
            <figcaption className="mono-label flex items-center justify-between px-1 pt-3">
              <span>{t(content, "hero_file", lang)}</span>
              <span>{t(content, "hero_timecode", lang)}</span>
            </figcaption>
          </figure>
        </section>

        {/* SHORT FORMAT */}
        <section id="projetos" className="scroll-mt-24 py-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="display-title text-3xl md:text-4xl">{t(content, "short_title", lang)}</h2>
            <span className="mono-label">{t(content, "short_meta", lang)}</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {shorts.map((v) => (
              <VideoCardVertical key={v.id} video={v} lang={lang} onOpen={() => setActive(v)} />
            ))}
          </div>
        </section>

        {/* LONG FORMAT */}
        <section className="py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="display-title text-3xl md:text-4xl">{t(content, "long_title", lang)}</h2>
            <span className="mono-label">{t(content, "long_meta", lang)}</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {longs.map((v) => (
              <VideoCardWide key={v.id} video={v} lang={lang} onOpen={() => setActive(v)} />
            ))}
          </div>
        </section>

        {/* SOBRE */}
        <section
          id="about"
          className="frame my-10 scroll-mt-24 grid gap-10 p-8 md:grid-cols-2 md:items-center md:p-12"
        >
          <div>
            <h2 className="display-title text-4xl md:text-5xl">
              {t(content, "about_title", lang)}
              <span className="text-signal">.</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t(content, "about_text", lang)}
            </p>
          </div>
          <div className="glow-media overflow-hidden rounded-xl">
            <img
              src={t(content, "about_image", lang)}
              alt="Retrato do editor"
              loading="lazy"
              width={832}
              height={1024}
              className="aspect-3/4 w-full object-cover"
            />
          </div>
        </section>
      </main>

      {/* CONTATOS */}
      <section id="contato" className="mt-10 scroll-mt-24 border-t border-border/60 px-6 py-20">
        <div className="mx-auto max-w-[1000px]">
          <h2 className="display-title text-center text-5xl tracking-tight md:text-6xl">
            {t(content, "contact_title", lang)}
            <span className="text-signal">.</span>
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {contacts.map((c) => (
              <ContactCard key={c.id} contact={c} />
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mono-label mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6">
          <span>{t(content, "footer_text", lang)}</span>
          <span>REC ● 00:00:00:00</span>
        </div>
      </footer>

      {active && (
        <VideoModal
          video={active}
          lang={lang}
          closeLabel={ui.close}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}

function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function VideoModal({
  video,
  lang,
  closeLabel,
  onClose,
}: {
  video: VideoRow;
  lang: Lang;
  closeLabel: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const vertical = video.format === "short";
  const embed = video.video_url ? embedUrl(video.video_url) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={videoTitle(video, lang)}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`frame relative w-full overflow-hidden p-3 animate-scale-in ${
          vertical ? "max-w-[min(420px,92vw)]" : "max-w-4xl"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground transition-colors hover:bg-signal hover:text-background"
        >
          <X className="h-4 w-4" />
        </button>

        <div
          className={`overflow-hidden rounded-xl bg-black ${vertical ? "aspect-9/16 max-h-[80vh]" : "aspect-video"}`}
        >
          {embed ? (
            <iframe
              src={embed}
              title={videoTitle(video, lang)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : video.video_url ? (
            <video
              src={video.video_url}
              poster={video.thumb_url || undefined}
              controls
              autoPlay
              playsInline
              controlsList="nodownload"
              className="h-full w-full object-contain"
              ref={(el) => {
                if (el) el.volume = 0.6;
              }}
            />
          ) : (
            <img
              src={video.thumb_url}
              alt={videoTitle(video, lang)}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="px-1 pt-3">
          <div className="mono-label flex items-center justify-between">
            <span>{videoCategory(video, lang)}</span>
            <span>{video.duration}</span>
          </div>
          <h3 className="mt-1 text-base font-semibold">{videoTitle(video, lang)}</h3>
          {videoDescription(video, lang) && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {videoDescription(video, lang)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function VideoCardVertical({
  video,
  lang,
  onOpen,
}: {
  video: VideoRow;
  lang: Lang;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-xl border border-border/60 bg-card text-left"
    >
      <img
        src={video.thumb_url}
        alt={videoTitle(video, lang)}
        loading="lazy"
        width={640}
        height={1088}
        className="aspect-9/16 w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
      <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-signal/90 text-background opacity-0 transition-opacity group-hover:opacity-100">
        <Play className="h-5 w-5" />
      </span>
      <span className="mono-label absolute bottom-3 left-3 right-3 text-foreground">
        {videoTitle(video, lang)} · {video.duration}
      </span>
    </button>
  );
}

function VideoCardWide({
  video,
  lang,
  onOpen,
}: {
  video: VideoRow;
  lang: Lang;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group block w-full overflow-hidden rounded-xl border border-border/60 bg-card text-left"
    >
      <div className="relative overflow-hidden">
        <img
          src={video.thumb_url}
          alt={videoTitle(video, lang)}
          loading="lazy"
          width={1280}
          height={720}
          className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-signal/90 text-background opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-5 w-5" />
        </span>
      </div>
      <div className="p-4">
        <div className="mono-label flex items-center justify-between">
          <span>{videoCategory(video, lang)}</span>
          <span>{video.duration}</span>
        </div>
        <h3 className="mt-2 text-base font-semibold text-foreground">{videoTitle(video, lang)}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {videoDescription(video, lang)}
        </p>
      </div>
    </button>
  );
}

function ContactCard({ contact }: { contact: ContactRow }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.handle);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const inner = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-signal-soft text-signal">
        <ContactIcon icon={contact.icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="mono-label block">{contact.label}</span>
        <span className="block truncate text-lg font-semibold">{contact.handle}</span>
      </span>
      {contact.copyable && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            void copy();
          }}
          className="flex shrink-0 items-center gap-2 rounded-full bg-signal-soft px-4 py-2 text-sm font-medium text-signal transition-colors hover:bg-signal hover:text-background"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "copiado" : "copy"}
        </button>
      )}
    </>
  );

  const cls =
    "flex items-center gap-4 rounded-xl border border-border/60 bg-card px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-signal/60";

  return contact.url ? (
    <a href={contact.url} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
