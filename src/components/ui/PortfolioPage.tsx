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
  fetchVideoPlaybackUrl,
  fetchVideos,
  t,
  type ContactRow,
  type Lang,
  type VideoRow,
} from "@/lib/portfolio";

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

function youtubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/,
  );
  return match?.[1] ?? null;
}

function fallbackThumbnail(video: VideoRow): string {
  if (video.thumb_url?.trim()) return video.thumb_url.trim();

  const id = youtubeId(video.video_url || "");
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

function SafeImage({
  src,
  alt,
  className,
  width,
  height,
  loading,
  fetchPriority,
}: {
  src: string;
  alt: string;
  className: string;
  width: number;
  height: number;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return <div className={`${className} bg-card`} aria-hidden />;
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function PortfolioPage({ lang }: { lang: Lang }) {
  const [active, setActive] = useState<VideoRow | null>(null);

  const { data: content = DEFAULT_CONTENT } = useQuery({
    queryKey: ["content"],
    queryFn: fetchContent,
    placeholderData: DEFAULT_CONTENT,
    staleTime: 10 * 60 * 1000,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["videos"],
    queryFn: fetchVideos,
    staleTime: 10 * 60 * 1000,
  });

  const { data: contacts = FALLBACK_CONTACTS } = useQuery({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
    placeholderData: FALLBACK_CONTACTS,
    staleTime: 10 * 60 * 1000,
  });

  const ui = UI_TEXT[lang];

  const ptVideos = videos.filter((v) => (v.lang ?? "pt") !== "en");
  const enVideos = videos.filter((v) => v.lang === "en");
  const langVideos =
    lang === "en" && enVideos.length > 0 ? enVideos : ptVideos;

  const shorts = langVideos.filter((v) => v.format === "short");
  const longs = langVideos.filter((v) => v.format === "long");

  const heroImage = t(content, "hero_image", lang).trim();
  const aboutImage = t(content, "about_image", lang).trim();

  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            decoding="async"
            className="h-8 w-8 rounded-md object-cover ring-1 ring-signal/40"
          />

          <span className="font-display text-lg tracking-wide">
            {highlightEditor(t(content, "brand_name", lang))}
          </span>

          <span className="mono-label hidden sm:inline">
            {t(content, "brand_role", lang)}
          </span>

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
                style={{
                  transform:
                    lang === "en" ? "translateX(100%)" : "translateX(0)",
                }}
              />

              <a
                href="/"
                aria-current={lang === "pt" ? "page" : undefined}
                className={`relative z-10 rounded-full px-3 py-1 font-mono text-xs tracking-widest uppercase transition-colors duration-300 ${
                  lang === "pt"
                    ? "text-background"
                    : "text-signal hover:text-foreground"
                }`}
              >
                pt
              </a>

              <a
                href="/en"
                aria-current={lang === "en" ? "page" : undefined}
                className={`relative z-10 rounded-full px-3 py-1 font-mono text-xs tracking-widest uppercase transition-colors duration-300 ${
                  lang === "en"
                    ? "text-background"
                    : "text-signal hover:text-foreground"
                }`}
              >
                en
              </a>
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 animate-fade-in">
        <section
          id="home"
          className="scroll-mt-24 grid gap-10 py-16 md:grid-cols-[1.1fr_1fr] md:items-center md:py-24"
        >
          <div>
            <p className="mono-label flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" />
              {t(content, "hero_kicker", lang)}
            </p>

            <h1 className="display-title mt-5 text-[clamp(3.5rem,12vw,8rem)] text-foreground">
              {highlightEditor(t(content, "hero_title_1", lang))}
              <br />
              {highlightEditor(t(content, "hero_title_2", lang))}
            </h1>

            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t(content, "hero_text", lang)}
            </p>
          </div>

          <figure className="frame overflow-hidden p-3">
            <div className="glow-media overflow-hidden rounded-xl">
              <SafeImage
                src={heroImage}
                alt="Imagem principal do portfólio"
                width={1280}
                height={1280}
                fetchPriority="high"
                className="aspect-square w-full object-cover"
              />
            </div>

            <figcaption className="mono-label flex items-center justify-between px-1 pt-3">
              <span>{t(content, "hero_file", lang)}</span>
              <span>{t(content, "hero_timecode", lang)}</span>
            </figcaption>
          </figure>
        </section>

        <section id="projetos" className="scroll-mt-24 py-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="display-title text-3xl md:text-4xl">
              {t(content, "short_title", lang)}
            </h2>
            <span className="mono-label">
              {t(content, "short_meta", lang)}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {shorts.map((video) => (
              <VideoCardVertical
                key={video.id}
                video={video}
                lang={lang}
                onOpen={() => setActive(video)}
              />
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="display-title text-3xl md:text-4xl">
              {t(content, "long_title", lang)}
            </h2>
            <span className="mono-label">
              {t(content, "long_meta", lang)}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {longs.map((video) => (
              <VideoCardWide
                key={video.id}
                video={video}
                lang={lang}
                onOpen={() => setActive(video)}
              />
            ))}
          </div>
        </section>

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
            <SafeImage
              src={
                aboutImage.startsWith("data:image/gif") ? "" : aboutImage
              }
              alt="Retrato do editor"
              loading="lazy"
              width={832}
              height={1024}
              className="aspect-3/4 w-full object-cover"
            />
          </div>
        </section>
      </main>

      <section
        id="contato"
        className="mt-10 scroll-mt-24 border-t border-border/60 px-6 py-20"
      >
        <div className="mx-auto max-w-[1000px]">
          <h2 className="display-title text-center text-5xl tracking-tight md:text-6xl">
            {t(content, "contact_title", lang)}
            <span className="text-signal">.</span>
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {contacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
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
  const yt = youtubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}`;

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
  const {
    data: signedPlaybackUrl = "",
    isLoading: loadingPlayback,
  } = useQuery({
    queryKey: ["video-playback", video.id, video.video_path],
    queryFn: () => fetchVideoPlaybackUrl(video),
    enabled: Boolean(video.video_path),
    staleTime: 50 * 60 * 1000,
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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
  const playbackUrl = video.video_path
    ? signedPlaybackUrl
    : video.video_url || "";

  const embed = playbackUrl ? embedUrl(playbackUrl) : null;
  const poster = fallbackThumbnail(video);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={videoTitle(video, lang)}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(event) => event.stopPropagation()}
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
          className={`overflow-hidden rounded-xl bg-black ${
            vertical ? "aspect-9/16 max-h-[80vh]" : "aspect-video"
          }`}
        >
          {loadingPlayback && video.video_path ? (
            <div className="flex h-full w-full items-center justify-center">
              <span className="mono-label">
                {lang === "en" ? "loading video..." : "carregando vídeo..."}
              </span>
            </div>
          ) : embed ? (
            <iframe
              src={embed}
              title={videoTitle(video, lang)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : playbackUrl ? (
            <video
              src={playbackUrl}
              poster={poster || undefined}
              controls
              autoPlay
              playsInline
              preload="metadata"
              controlsList="nodownload"
              className="h-full w-full object-contain"
              ref={(element) => {
                if (element) element.volume = 0.6;
              }}
            />
          ) : (
            <SafeImage
              src={poster}
              alt={videoTitle(video, lang)}
              width={1280}
              height={720}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="px-1 pt-3">
          <div className="mono-label flex items-center justify-between">
            <span>{videoCategory(video, lang)}</span>
            <span>{video.duration}</span>
          </div>

          <h3 className="mt-1 text-base font-semibold">
            {videoTitle(video, lang)}
          </h3>

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
  const thumbnail = fallbackThumbnail(video);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-xl border border-border/60 bg-card text-left"
    >
      <SafeImage
        src={thumbnail}
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
  const thumbnail = fallbackThumbnail(video);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group block w-full overflow-hidden rounded-xl border border-border/60 bg-card text-left"
    >
      <div className="relative overflow-hidden">
        <SafeImage
          src={thumbnail}
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

        <h3 className="mt-2 text-base font-semibold text-foreground">
          {videoTitle(video, lang)}
        </h3>

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
        <span className="block truncate text-lg font-semibold">
          {contact.handle}
        </span>
      </span>

      {contact.copyable && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            void copy();
          }}
          className="flex shrink-0 items-center gap-2 rounded-full bg-signal-soft px-4 py-2 text-sm font-medium text-signal transition-colors hover:bg-signal hover:text-background"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "copiado" : "copy"}
        </button>
      )}
    </>
  );

  const cls =
    "flex items-center gap-4 rounded-xl border border-border/60 bg-card px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-signal/60";

  return contact.url ? (
    <a
      href={contact.url}
      target="_blank"
      rel="noreferrer"
      className={cls}
    >
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
