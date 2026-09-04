import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Loader2, LogOut, Plus, Trash2, Upload } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTENT_FIELDS,
  DEFAULT_CONTENT,
  fetchContacts,
  fetchContent,
  fetchVideos,
  type ContactRow,
  type VideoRow,
} from "@/lib/portfolio";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel" },
      { name: "description", content: "Área restrita de administração do portfólio." },
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
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fn =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/admin` },
          });
    const { error } = await fn;
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(mode === "login" ? "Bem-vindo de volta." : "Conta criada.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <form onSubmit={submit} className="frame w-full max-w-sm space-y-4 p-8">
        <h1 className="display-title text-3xl">Painel</h1>
        <p className="text-sm text-muted-foreground">Acesso restrito ao administrador.</p>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {mode === "login" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
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
          {(["videos", "textos", "contatos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {t}
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
  const { data: videos = [] } = useQuery({ queryKey: ["videos"], queryFn: fetchVideos });

  const addVideo = async (format: string) => {
    const { error } = await supabase.from("videos").insert({
      format,
      title: "Novo vídeo",
      sort_order: videos.filter((v) => v.format === format).length + 1,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Vídeo adicionado.");
    invalidate();
  };

  return (
    <div className="space-y-10">
      {(["short", "long"] as const).map((format) => (
        <section key={format} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="display-title text-xl">
              {format === "short" ? "Vertical (9:16)" : "Horizontal (16:9)"}
            </h2>
            <Button size="sm" variant="secondary" onClick={() => addVideo(format)}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </div>
          {videos
            .filter((v) => v.format === format)
            .map((v) => (
              <VideoForm key={v.id} video={v} onChanged={invalidate} />
            ))}
        </section>
      ))}
    </div>
  );
}

function VideoForm({ video, onChanged }: { video: VideoRow; onChanged: () => void }) {
  const [draft, setDraft] = useState(video);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(video), [video]);

  const uploadVideo = async (file: File) => {
    setUploading(true);
    try {
      const thumbnail = await extractVideoThumbnail(file);
      const extension = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const stamp = Date.now();
      const videoPath = `${video.id}/${stamp}.${extension}`;
      const thumbPath = `${video.id}/${stamp}.jpg`;

      const { error: videoError } = await supabase.storage
        .from("portfolio-videos")
        .upload(videoPath, file, { contentType: file.type, upsert: false });
      if (videoError) throw videoError;

      const { error: thumbError } = await supabase.storage
        .from("portfolio-videos")
        .upload(thumbPath, thumbnail.blob, { contentType: "image/jpeg", upsert: false });
      if (thumbError) {
        await supabase.storage.from("portfolio-videos").remove([videoPath]);
        throw thumbError;
      }

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
          .remove([video.video_path, video.thumb_path].filter((path): path is string => Boolean(path)));
      }

      toast.success("Vídeo enviado e capa gerada automaticamente.");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o vídeo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("videos")
      .update({
        title: draft.title,
        description: draft.description,
        category: draft.category,
        title_en: draft.title_en ?? "",
        description_en: draft.description_en ?? "",
        category_en: draft.category_en ?? "",
        duration: draft.duration,
        thumb_url: draft.thumb_url,
        video_url: draft.video_url,
        thumb_path: draft.thumb_path ?? null,
        video_path: draft.video_path ?? null,
        sort_order: draft.sort_order,
      })
      .eq("id", video.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Vídeo salvo.");
    onChanged();
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
        .remove([video.video_path, video.thumb_path].filter((path): path is string => Boolean(path)));
    }
    toast.success("Vídeo removido.");
    onChanged();
  };

  return (
    <div className="frame grid gap-4 p-5 md:grid-cols-2">
      <Field label="Título" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
      <Field
        label="Duração"
        value={draft.duration}
        onChange={(v) => setDraft({ ...draft, duration: v })}
      />
      <Field
        label="Categoria"
        value={draft.category}
        onChange={(v) => setDraft({ ...draft, category: v })}
      />
      <Field
        label="Ordem"
        value={String(draft.sort_order)}
        onChange={(v) => setDraft({ ...draft, sort_order: Number(v) || 0 })}
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
            {uploading ? "Enviando..." : "Escolher vídeo"}
          </Button>
          <span className="text-xs text-muted-foreground">
            MP4, WebM ou MOV · a capa e a duração são geradas automaticamente
          </span>
        </div>
        {draft.thumb_url && (
          <img
            src={draft.thumb_url}
            alt={`Capa atual de ${draft.title}`}
            className="aspect-video w-full max-w-xs rounded-md border border-border object-cover"
          />
        )}
      </div>
      <div className="md:col-span-2">
        <Field
          label="Descrição"
          multiline
          value={draft.description}
          onChange={(v) => setDraft({ ...draft, description: v })}
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

function extractVideoThumbnail(file: File): Promise<{ blob: Blob; duration: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => URL.revokeObjectURL(objectUrl);
    video.onerror = () => {
      cleanup();
      reject(new Error("Este formato de vídeo não pôde ser lido pelo navegador."));
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
          resolve({ blob, duration: `${minutes}:${seconds}` });
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
    queryKey: ["content"],
    queryFn: fetchContent,
  });
  const [draft, setDraft] = useState<Record<string, string>>(content);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(content), [content]);

  const save = async () => {
    setSaving(true);
    const rows = CONTENT_FIELDS.map((f) => ({ key: f.key, value: draft[f.key] ?? "" }));
    const { error } = await supabase.from("site_content").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Textos salvos.");
    invalidate();
  };

  return (
    <div className="space-y-5">
      <div className="frame grid gap-4 p-5 md:grid-cols-2">
        {CONTENT_FIELDS.map((f) => (
          <div key={f.key} className={f.multiline ? "md:col-span-2" : ""}>
            <Field
              label={f.label}
              multiline={f.multiline}
              value={draft[f.key] ?? ""}
              onChange={(v) => setDraft({ ...draft, [f.key]: v })}
            />
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar textos
      </Button>
    </div>
  );
}

function ContactsEditor() {
  const invalidate = useInvalidate();
  const { data: contacts = [] } = useQuery({ queryKey: ["contacts"], queryFn: fetchContacts });

  const add = async () => {
    const { error } = await supabase
      .from("contacts")
      .insert({ label: "NOVO", handle: "@usuario", sort_order: contacts.length + 1 });
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
          <Plus className="mr-2 h-4 w-4" /> Adicionar contato
        </Button>
      </div>
      {contacts.map((c) => (
        <ContactForm key={c.id} contact={c} onChanged={invalidate} />
      ))}
    </div>
  );
}

function ContactForm({ contact, onChanged }: { contact: ContactRow; onChanged: () => void }) {
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
    const { error } = await supabase.from("contacts").delete().eq("id", contact.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    onChanged();
  };

  return (
    <div className="frame grid gap-4 p-5 md:grid-cols-2">
      <Field label="Rótulo" value={draft.label} onChange={(v) => setDraft({ ...draft, label: v })} />
      <Field
        label="Usuário"
        value={draft.handle}
        onChange={(v) => setDraft({ ...draft, handle: v })}
      />
      <Field
        label="Link (opcional)"
        value={draft.url}
        onChange={(v) => setDraft({ ...draft, url: v })}
      />
      <div className="space-y-2">
        <Label>Ícone</Label>
        <select
          value={draft.icon}
          onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {["discord", "twitter", "instagram", "youtube", "mail", "at"].map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>
      <Field
        label="Ordem"
        value={String(draft.sort_order)}
        onChange={(v) => setDraft({ ...draft, sort_order: Number(v) || 0 })}
      />
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={draft.copyable}
          onChange={(e) => setDraft({ ...draft, copyable: e.target.checked })}
        />
        Mostrar botão de copiar
      </label>
      <div className="flex gap-2 md:col-span-2">
        <Button size="sm" onClick={save}>
          Salvar
        </Button>
        <Button size="sm" variant="ghost" onClick={remove}>
          <Trash2 className="mr-2 h-4 w-4" /> Remover
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
  onChange: (v: string) => void;
  multiline?: boolean | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {multiline ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
