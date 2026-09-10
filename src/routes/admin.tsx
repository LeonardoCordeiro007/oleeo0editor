import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTENT_FIELDS,
  DEFAULT_CONTENT,
  IMAGE_FIELDS,
  NON_TRANSLATABLE,
  STORAGE_PREFIX,
  fetchContacts,
  fetchRawContent,
  fetchRawVideos,
  type ContactRow,
  type VideoRow,
} from "@/lib/portfolio";
import { uploadFile } from "@/lib/upload";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel" },
      {
        name: "description",
        content: "Área restrita de administração do portfólio.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Painel" },
      { property: "og:description", content: "Área restrita." },
    ],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    );

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      return;
    }

    void (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) toast.error(error.message);
      setIsAdmin(Boolean(data));
    })();
  }, [session]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <LoginCard />;
  if (!isAdmin) return <NoAccessCard />;

  return <AdminPanel email={session.user.email ?? ""} />;
}

function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const request =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/admin`,
            },
          });

    const { error } = await request;
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(
      mode === "login" ? "Bem-vindo de volta." : "Conta criada.",
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <form
        onSubmit={submit}
        className="frame w-full max-w-sm space-y-4 p-8"
      >
        <h1 className="display-title text-3xl">Painel</h1>
        <p className="text-sm text-muted-foreground">
          Acesso restrito ao administrador.
        </p>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "login" ? "Entrar" : "Criar conta"}
        </Button>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full text-center text-xs text-muted-foreground underline"
        >
          {mode === "login"
            ? "Primeiro acesso? Criar conta"
            : "Já tenho conta"}
        </button>
      </form>
    </div>
  );
}

function NoAccessCard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="frame max-w-sm space-y-4 p-8 text-center">
        <h1 className="display-title text-2xl">Sem acesso</h1>
        <p className="text-sm text-muted-foreground">
          Esta conta não é a administradora do site.
        </p>
        <Button variant="secondary" onClick={() => supabase.auth.signOut()}>
          Sair
        </Button>
      </div>
    </div>
  );
}

function AdminPanel({ email }: { email: string }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"videos" | "textos" | "contatos">("videos");

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-[1000px] flex-wrap items-center gap-4 px-6 py-4">
          <h1 className="display-title text-2xl">Painel</h1>
          <span className="mono-label">{email}</span>

          <Button variant="ghost" size="sm" className="ml-auto" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>

        <div className="mx-auto flex max-w-[1000px] gap-2 px-6 pb-4">
          {(["videos", "textos", "contatos"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
                tab === item
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] px-6 py-8">
        {tab === "videos" && <VideosEditor />}
        {tab === "textos" && <ContentEditor />}
        {tab === "contatos" && <ContactsEditor />}
      </main>
    </div>
  );
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries();
  };
}

function VideosEditor() {
  const invalidate = useInvalidate();
  const [lang, setLang] = useState<"pt" | "en">("pt");

  const { data: videos = [] } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: fetchRawVideos,
  });

  const addVideo = async (format: string) => {
    const { error } = await supabase.from("videos").insert({
      format,
      lang,
      title: lang === "en" ? "New video" : "Novo vídeo",
      sort_order:
        videos.filter(
          (video) =>
            video.format === format && (video.lang ?? "pt") === lang,
        ).length + 1,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Vídeo adicionado.");
    invalidate();
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-2">
        {(["pt", "en"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setLang(item)}
            className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
              lang === item
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {item === "pt" ? "Página PT" : "Página EN"}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {lang === "pt"
          ? "Estes vídeos aparecem em oleeo0editor.vercel.app/."
          : "Estes vídeos aparecem em oleeo0editor.vercel.app/en."}
      </p>

      {(["short", "long"] as const).map((format) => (
        <section key={format} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="display-title text-xl">
              {format === "short" ? "Vertical (9:16)" : "Horizontal (16:9)"}
            </h3>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => addVideo(format)}
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </div>

          {videos
            .filter(
              (video) =>
                video.format === format && (video.lang ?? "pt") === lang,
            )
            .map((video) => (
              <VideoForm
                key={video.id}
                video={video}
                onChanged={invalidate}
              />
            ))}
        </section>
      ))}
    </div>
  );
}

function youtubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/,
  );
  return match?.[1] ?? null;
}

function youtubeThumbnail(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

async function vimeoThumbnail(url: string): Promise<string | null> {
  if (!/vimeo\.com\/\d+/.test(url)) return null;

  const response = await fetch(
    `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
  );

  if (!response.ok) return null;

  const data = (await response.json()) as {
    thumbnail_url?: string;
  };

  return data.thumbnail_url ?? null;
}

function extractRemoteVideoThumbnail(
  url: string,
): Promise<{ blob: Blob; duration: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const fail = () =>
      reject(
        new Error(
          "Não consegui ler esse vídeo pela URL. O servidor pode estar bloqueando a geração automática da capa.",
        ),
      );

    video.onerror = fail;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, Math.max(0, video.duration / 3));
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");
        if (!context) {
          fail();
          return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              fail();
              return;
            }

            const totalSeconds = Math.round(video.duration || 0);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = String(totalSeconds % 60).padStart(2, "0");

            resolve({
              blob,
              duration: `${minutes}:${seconds}`,
            });
          },
          "image/jpeg",
          0.86,
        );
      } catch {
        fail();
      }
    };

    video.src = url;
  });
}

async function automaticThumbnailForUrl(
  videoId: string,
  url: string,
): Promise<{
  thumb_url: string;
  thumb_path: string | null;
  duration?: string;
}> {
  const youtube = youtubeThumbnail(url);
  if (youtube) {
    return {
      thumb_url: youtube,
      thumb_path: null,
    };
  }

  const vimeo = await vimeoThumbnail(url);
  if (vimeo) {
    return {
      thumb_url: vimeo,
      thumb_path: null,
    };
  }

  if (/^https?:\/\/.+\.(mp4|webm|mov)(\?.*)?$/i.test(url)) {
    const thumbnail = await extractRemoteVideoThumbnail(url);
    const thumbPath = `${videoId}/${Date.now()}-auto.jpg`;

    await uploadFile(thumbPath, thumbnail.blob, "image/jpeg");

    return {
      thumb_url: "",
      thumb_path: thumbPath,
      duration: thumbnail.duration,
    };
  }

  throw new Error(
    "Link não reconhecido. Use YouTube, Vimeo ou um link direto para MP4/WebM/MOV.",
  );
}

function VideoForm({
  video,
  onChanged,
}: {
  video: VideoRow;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState(video);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingThumb, setGeneratingThumb] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(video), [video]);

  const uploadVideo = async (file: File) => {
    setUploading(true);
    setProgress(0);

    try {
      if (file.size > 2 * 1024 * 1024 * 1024) {
        throw new Error(
          "O arquivo passa de 2GB. Comprima o vídeo antes de enviar.",
        );
      }

      const thumbnail = await extractVideoThumbnail(file);
      const extension = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const stamp = Date.now();
      const videoPath = `${video.id}/${stamp}.${extension}`;
      const thumbPath = `${video.id}/${stamp}.jpg`;

      await uploadFile(
        videoPath,
        file,
        file.type || "video/mp4",
        setProgress,
      );
      await uploadFile(thumbPath, thumbnail.blob, "image/jpeg");

      const { error: updateError } = await supabase
        .from("videos")
        .update({
          video_path: videoPath,
          thumb_path: thumbPath,
          video_url: "",
          thumb_url: "",
          duration: thumbnail.duration,
        })
        .eq("id", video.id);

      if (updateError) throw updateError;

      if (video.video_path || video.thumb_path) {
        await supabase.storage
          .from("portfolio-videos")
          .remove(
            [video.video_path, video.thumb_path].filter(
              (item): item is string => Boolean(item),
            ),
          );
      }

      toast.success("Vídeo enviado e capa gerada automaticamente.");
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message === "Failed to fetch"
            ? "A conexão caiu durante o envio. Tente novamente."
            : error.message
          : "Não foi possível enviar o vídeo.",
      );
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const generateThumbnail = async () => {
    if (!draft.video_url.trim()) {
      toast.error("Cole primeiro o link do vídeo.");
      return;
    }

    setGeneratingThumb(true);

    try {
      const generated = await automaticThumbnailForUrl(
        video.id,
        draft.video_url.trim(),
      );

      setDraft((current) => ({
        ...current,
        thumb_url: generated.thumb_url,
        thumb_path: generated.thumb_path,
        duration: generated.duration ?? current.duration,
      }));

      toast.success("Capa gerada. Clique em Salvar para publicar.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar a capa.",
      );
    } finally {
      setGeneratingThumb(false);
    }
  };

  const save = async () => {
    setSaving(true);
    let nextDraft = draft;

    try {
      if (
        !draft.thumb_url.trim() &&
        !draft.thumb_path &&
        draft.video_url.trim()
      ) {
        try {
          const generated = await automaticThumbnailForUrl(
            video.id,
            draft.video_url.trim(),
          );

          nextDraft = {
            ...draft,
            thumb_url: generated.thumb_url,
            thumb_path: generated.thumb_path,
            duration: generated.duration ?? draft.duration,
          };

          setDraft(nextDraft);
        } catch {
          // Falha na capa não impede salvar o restante.
        }
      }

      const { error } = await supabase
        .from("videos")
        .update({
          title: nextDraft.title,
          description: nextDraft.description,
          category: nextDraft.category,
          duration: nextDraft.duration,
          thumb_url: nextDraft.thumb_url,
          video_url: nextDraft.video_url,
          thumb_path: nextDraft.thumb_path ?? null,
          video_path: nextDraft.video_path ?? null,
          sort_order: nextDraft.sort_order,
        })
        .eq("id", video.id);

      if (error) throw error;

      toast.success("Vídeo salvo.");
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const { error } = await supabase.from("videos").delete().eq("id", video.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (video.video_path || video.thumb_path) {
      await supabase.storage
        .from("portfolio-videos")
        .remove(
          [video.video_path, video.thumb_path].filter(
            (item): item is string => Boolean(item),
          ),
        );
    }

    toast.success("Vídeo removido.");
    onChanged();
  };

  const onVideoUrlChange = (value: string) => {
    const automaticYoutube = youtubeThumbnail(value);

    setDraft((current) => ({
      ...current,
      video_url: value,
      video_path: null,
      ...(automaticYoutube && !current.thumb_url && !current.thumb_path
        ? {
            thumb_url: automaticYoutube,
            thumb_path: null,
          }
        : {}),
    }));
  };

  return (
    <div className="frame grid gap-4 p-5 md:grid-cols-2">
      <Field
        label="Título"
        value={draft.title}
        onChange={(value) => setDraft({ ...draft, title: value })}
      />
      <Field
        label="Duração"
        value={draft.duration}
        onChange={(value) => setDraft({ ...draft, duration: value })}
      />
      <Field
        label="Categoria"
        value={draft.category}
        onChange={(value) => setDraft({ ...draft, category: value })}
      />
      <Field
        label="Ordem"
        value={String(draft.sort_order)}
        onChange={(value) =>
          setDraft({ ...draft, sort_order: Number(value) || 0 })
        }
      />

      <div className="space-y-3 md:col-span-2">
        <Label>Arquivo do vídeo</Label>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadVideo(file);
          }}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploading ? `Enviando... ${progress}%` : "Escolher vídeo"}
          </Button>

          <span className="text-xs text-muted-foreground">
            MP4, WebM ou MOV · a capa e a duração são geradas automaticamente
          </span>
        </div>

        <VideoThumbPreview
          title={draft.title}
          thumbUrl={draft.thumb_url}
          thumbPath={draft.thumb_path}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Ou link do vídeo (YouTube, Vimeo, MP4)"
            value={draft.video_url}
            onChange={onVideoUrlChange}
          />
          <Field
            label="Capa por URL (opcional)"
            value={draft.thumb_url}
            onChange={(value) =>
              setDraft({
                ...draft,
                thumb_url: value,
                thumb_path: null,
              })
            }
          />
        </div>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={generatingThumb || !draft.video_url.trim()}
          onClick={() => void generateThumbnail()}
        >
          {generatingThumb ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="mr-2 h-4 w-4" />
          )}
          Gerar capa automaticamente
        </Button>
      </div>

      <div className="md:col-span-2">
        <Field
          label="Descrição"
          multiline
          value={draft.description}
          onChange={(value) =>
            setDraft({ ...draft, description: value })
          }
        />
      </div>

      <div className="flex gap-2 md:col-span-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
        <Button size="sm" variant="ghost" onClick={remove}>
          <Trash2 className="mr-2 h-4 w-4" /> Remover
        </Button>
      </div>
    </div>
  );
}


function VideoThumbPreview({
  title,
  thumbUrl,
  thumbPath,
}: {
  title: string;
  thumbUrl: string;
  thumbPath?: string | null;
}) {
  const [preview, setPreview] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);

    void (async () => {
      if (thumbPath) {
        const { data } = await supabase.storage
          .from("portfolio-videos")
          .createSignedUrl(thumbPath, 3600);

        if (alive) setPreview(data?.signedUrl ?? "");
        return;
      }

      if (alive) setPreview(thumbUrl || "");
    })();

    return () => {
      alive = false;
    };
  }, [thumbPath, thumbUrl]);

  if (!preview || failed) {
    return (
      <div className="flex aspect-video w-full max-w-xs items-center justify-center rounded-md border border-border bg-card text-xs text-muted-foreground">
        Capa não disponível
      </div>
    );
  }

  return (
    <img
      src={preview}
      alt={`Capa atual de ${title}`}
      onError={() => setFailed(true)}
      className="aspect-video w-full max-w-xs rounded-md border border-border object-cover"
    />
  );
}

function extractVideoThumbnail(
  file: File,
): Promise<{ blob: Blob; duration: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    video.onerror = () => {
      cleanup();
      reject(
        new Error(
          "Este formato de vídeo não pôde ser lido pelo navegador.",
        ),
      );
    };

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, Math.max(0, video.duration / 3));
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        cleanup();
        reject(new Error("Não foi possível gerar a capa do vídeo."));
        return;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          cleanup();

          if (!blob) {
            reject(new Error("Não foi possível gerar a capa do vídeo."));
            return;
          }

          const totalSeconds = Math.round(video.duration || 0);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = String(totalSeconds % 60).padStart(2, "0");

          resolve({
            blob,
            duration: `${minutes}:${seconds}`,
          });
        },
        "image/jpeg",
        0.86,
      );
    };

    video.src = objectUrl;
  });
}

function ContentEditor() {
  const invalidate = useInvalidate();

  const { data: content = DEFAULT_CONTENT } = useQuery({
    queryKey: ["raw-content"],
    queryFn: fetchRawContent,
  });

  const [draft, setDraft] =
    useState<Record<string, string>>(content);
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const [saving, setSaving] = useState(false);
  const [savingImages, setSavingImages] = useState(false);

  useEffect(() => setDraft(content), [content]);

  const fields = CONTENT_FIELDS.filter(
    (field) =>
      lang === "pt" ||
      !NON_TRANSLATABLE.has(field.key) ||
      IMAGE_FIELDS.has(field.key),
  );

  const keyFor = (key: string) =>
    lang === "en" ? `${key}_en` : key;

  const save = async () => {
    setSaving(true);

    const rows = CONTENT_FIELDS.flatMap((field) => {
      const output = [
        {
          key: field.key,
          value: draft[field.key] ?? "",
        },
      ];

      if (!NON_TRANSLATABLE.has(field.key)) {
        output.push({
          key: `${field.key}_en`,
          value: draft[`${field.key}_en`] ?? "",
        });
      }

      return output;
    });

    const { error } = await supabase
      .from("site_content")
      .upsert(rows, { onConflict: "key" });

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Textos salvos.");
    invalidate();
  };

  const saveImages = async () => {
    setSavingImages(true);

    const rows = [...IMAGE_FIELDS].map((key) => ({
      key,
      value: draft[key] ?? "",
    }));

    const { error } = await supabase
      .from("site_content")
      .upsert(rows, { onConflict: "key" });

    setSavingImages(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Imagens salvas e publicadas.");
    invalidate();
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(["pt", "en"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setLang(item)}
            className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
              lang === item
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {item === "pt" ? "Página PT" : "Página EN"}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {lang === "pt"
          ? "Textos da página /."
          : "Textos da página /en. Deixe em branco para reaproveitar o texto em português."}
      </p>

      <div className="frame grid gap-4 p-5 md:grid-cols-2">
        {fields.map((field) =>
          IMAGE_FIELDS.has(field.key) ? (
            <div
              key={field.key}
              className="space-y-3 md:col-span-2"
            >
              <ImageField
                label={field.label}
                value={draft[field.key] ?? ""}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    [field.key]: value,
                  })
                }
              />

              <Button
                type="button"
                size="sm"
                onClick={saveImages}
                disabled={savingImages}
              >
                {savingImages && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar imagens
              </Button>
            </div>
          ) : (
            <div
              key={keyFor(field.key)}
              className={
                field.multiline ? "md:col-span-2" : ""
              }
            >
              <Field
                label={field.label}
                multiline={field.multiline}
                value={draft[keyFor(field.key)] ?? ""}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    [keyFor(field.key)]: value,
                  })
                }
              />
            </div>
          ),
        )}
      </div>

      <Button onClick={save} disabled={saving}>
        {saving && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Salvar textos
      </Button>
    </div>
  );
}

function ContactsEditor() {
  const invalidate = useInvalidate();

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
  });

  const add = async () => {
    const { error } = await supabase
      .from("contacts")
      .insert({
        label: "NOVO",
        handle: "@usuario",
        sort_order: contacts.length + 1,
      });

    if (error) {
      toast.error(error.message);
      return;
    }

    invalidate();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={add}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar contato
        </Button>
      </div>

      {contacts.map((contact) => (
        <ContactForm
          key={contact.id}
          contact={contact}
          onChanged={invalidate}
        />
      ))}
    </div>
  );
}

function ContactForm({
  contact,
  onChanged,
}: {
  contact: ContactRow;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState(contact);

  useEffect(() => setDraft(contact), [contact]);

  const save = async () => {
    const { error } = await supabase
      .from("contacts")
      .update({
        label: draft.label,
        handle: draft.handle,
        url: draft.url,
        icon: draft.icon,
        copyable: draft.copyable,
        sort_order: draft.sort_order,
      })
      .eq("id", contact.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Contato salvo.");
    onChanged();
  };

  const remove = async () => {
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contact.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    onChanged();
  };

  return (
    <div className="frame grid gap-4 p-5 md:grid-cols-2">
      <Field
        label="Rótulo"
        value={draft.label}
        onChange={(value) =>
          setDraft({ ...draft, label: value })
        }
      />

      <Field
        label="Usuário"
        value={draft.handle}
        onChange={(value) =>
          setDraft({ ...draft, handle: value })
        }
      />

      <Field
        label="Link (opcional)"
        value={draft.url}
        onChange={(value) =>
          setDraft({ ...draft, url: value })
        }
      />

      <div className="space-y-2">
        <Label>Ícone</Label>
        <select
          value={draft.icon}
          onChange={(event) =>
            setDraft({
              ...draft,
              icon: event.target.value,
            })
          }
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {[
            "discord",
            "twitter",
            "instagram",
            "youtube",
            "mail",
            "at",
          ].map((icon) => (
            <option key={icon} value={icon}>
              {icon}
            </option>
          ))}
        </select>
      </div>

      <Field
        label="Ordem"
        value={String(draft.sort_order)}
        onChange={(value) =>
          setDraft({
            ...draft,
            sort_order: Number(value) || 0,
          })
        }
      />

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={draft.copyable}
          onChange={(event) =>
            setDraft({
              ...draft,
              copyable: event.target.checked,
            })
          }
        />
        Mostrar botão de copiar
      </label>

      <div className="flex gap-2 md:col-span-2">
        <Button size="sm" onClick={save}>
          Salvar
        </Button>

        <Button size="sm" variant="ghost" onClick={remove}>
          <Trash2 className="mr-2 h-4 w-4" />
          Remover
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {multiline ? (
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
        />
      ) : (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);

    void (async () => {
      if (!value.startsWith(STORAGE_PREFIX)) {
        setPreview(value);
        return;
      }

      const { data } = await supabase.storage
        .from("portfolio-videos")
        .createSignedUrl(
          value.slice(STORAGE_PREFIX.length),
          3600,
        );

      if (alive) setPreview(data?.signedUrl ?? "");
    })();

    return () => {
      alive = false;
    };
  }, [value]);

  const upload = async (file: File) => {
    setUploading(true);

    try {
      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `site/${Date.now()}.${extension}`;

      await uploadFile(
        path,
        file,
        file.type || "image/jpeg",
      );

      onChange(`${STORAGE_PREFIX}${path}`);

      toast.success(
        "Imagem enviada. Clique em salvar imagens para publicar.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a imagem.",
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {preview && !failed && (
        <img
          src={preview}
          alt={label}
          onError={() => setFailed(true)}
          className="max-h-48 w-auto rounded-md border border-border object-cover"
        />
      )}

      {(!preview || failed) && (
        <div className="flex h-32 max-w-sm items-center justify-center rounded-md border border-border bg-card text-xs text-muted-foreground">
          Imagem não disponível
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}

          {uploading ? "Enviando..." : "Enviar imagem"}
        </Button>

        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="ou cole uma URL"
          className="max-w-sm"
        />
      </div>
    </div>
  );
}
