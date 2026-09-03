import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AtSign,
  Check,
  Copy,
  Instagram,
  Mail,
  MessageCircle,
  Play,
  Youtube,
} from "lucide-react";

import {
  DEFAULT_CONTENT,
  fetchContacts,
  fetchContent,
  fetchVideos,
  type ContactRow,
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

function Portfolio() {
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

  const shorts = videos.filter((v) => v.format === "short");
  const longs = videos.filter((v) => v.format === "long");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-6 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary font-display text-sm text-foreground">
            O
          </span>
          <span className="font-display text-lg tracking-wide">{content["brand_name"]}</span>
          <span className="mono-label hidden sm:inline">{content["brand_role"]}</span>
          <span className="ml-auto mono-label flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
            REC
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6">
        {/* HERO */}
        <section className="grid gap-10 py-16 md:grid-cols-[1.1fr_1fr] md:items-center md:py-24">
          <div>
            <p className="mono-label flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" />
              {content["hero_kicker"]}
            </p>
            <h1 className="display-title mt-5 text-[clamp(3.5rem,12vw,8rem)] text-foreground">
              {content["hero_title_1"]}
              <br />
              {content["hero_title_2"]}
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
              {content["hero_text"]}
            </p>
          </div>

          <figure className="frame overflow-hidden p-3">
            <div className="overflow-hidden rounded-xl">
              <img
                src={content["hero_image"]}
                alt="Sessão de edição de vídeo"
                width={1280}
                height={960}
                className="aspect-4/3 w-full object-cover"
              />
            </div>
            <figcaption className="mono-label flex items-center justify-between px-1 pt-3">
              <span>{content["hero_file"]}</span>
              <span>{content["hero_timecode"]}</span>
            </figcaption>
          </figure>
        </section>

        {/* SHORT FORMAT */}
        <section className="py-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="display-title text-3xl md:text-4xl">
              {content["short_title"]} <sup className="mono-label align-super">(a)</sup>
            </h2>
            <span className="mono-label">{content["short_meta"]}</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {shorts.map((v) => (
              <VideoCardVertical key={v.id} video={v} />
            ))}
          </div>
        </section>

        {/* LONG FORMAT */}
        <section className="py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="display-title text-3xl md:text-4xl">
              {content["long_title"]} <sup className="mono-label align-super">(b)</sup>
            </h2>
            <span className="mono-label">{content["long_meta"]}</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {longs.map((v) => (
              <VideoCardWide key={v.id} video={v} />
            ))}
          </div>
        </section>

        {/* SOBRE */}
        <section className="frame my-10 grid gap-10 p-8 md:grid-cols-2 md:items-center md:p-12">
          <div>
            <p className="mono-label">{content["about_kicker"]}</p>
            <h2 className="display-title mt-4 text-4xl md:text-5xl">{content["about_title"]}</h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              {content["about_text"]}
            </p>
          </div>
          <img
            src={content["about_image"]}
            alt="Retrato do editor"
            loading="lazy"
            width={832}
            height={1024}
            className="aspect-3/4 w-full rounded-xl object-cover"
          />
        </section>
      </main>

      {/* CONTATOS */}
      <section className="mt-10 border-t border-border/60 px-6 py-20">
        <div className="mx-auto max-w-[1000px]">
          <p className="mono-label text-center">(C) CONTATO</p>
          <h2 className="display-title mt-4 text-center text-5xl tracking-tight md:text-6xl">
            {content["contact_title"]}
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
          <span>{content["footer_text"]}</span>
          <span>REC ● 00:00:00:00</span>
        </div>
      </footer>
    </div>
  );
}

function VideoCardVertical({ video }: { video: VideoRow }) {
  return (
    <a
      href={video.video_url || undefined}
      target={video.video_url ? "_blank" : undefined}
      rel="noreferrer"
      className="group relative block overflow-hidden rounded-xl border border-border/60 bg-card"
    >
      <img
        src={video.thumb_url}
        alt={video.title}
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
        {video.title} · {video.duration}
      </span>
    </a>
  );
}

function VideoCardWide({ video }: { video: VideoRow }) {
  return (
    <a
      href={video.video_url || undefined}
      target={video.video_url ? "_blank" : undefined}
      rel="noreferrer"
      className="group block overflow-hidden rounded-xl border border-border/60 bg-card"
    >
      <div className="relative overflow-hidden">
        <img
          src={video.thumb_url}
          alt={video.title}
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
          <span>{video.category}</span>
          <span>{video.duration}</span>
        </div>
        <h3 className="mt-2 text-base font-semibold text-foreground">{video.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{video.description}</p>
      </div>
    </a>
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
