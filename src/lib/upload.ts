import * as tus from "tus-js-client";

import { supabase } from "@/integrations/supabase/client";

const BUCKET = "portfolio-videos";
const RESUMABLE_THRESHOLD = 20 * 1024 * 1024; // 20MB

function endpoint() {
  const url = import.meta.env["VITE_SUPABASE_URL"] as string;
  return `${url}/storage/v1/upload/resumable`;
}

/**
 * Envia um arquivo para o bucket. Arquivos grandes usam upload resumível (em pedaços),
 * evitando o erro "Failed to fetch" em conexões instáveis.
 */
export async function uploadFile(
  path: string,
  file: File | Blob,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  if (file.size < RESUMABLE_THRESHOLD) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType, upsert: true });
    if (error) throw error;
    onProgress?.(100);
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre novamente para enviar o arquivo.");

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: endpoint(),
      retryDelays: [0, 1000, 3000, 5000, 10000],
      headers: {
        authorization: `Bearer ${token}`,
        apikey: import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: BUCKET,
        objectName: path,
        contentType,
        cacheControl: "3600",
      },
      onError: (error) => reject(error),
      onProgress: (sent, total) => onProgress?.(Math.round((sent / total) * 100)),
      onSuccess: () => resolve(),
    });

    void upload.findPreviousUploads().then((previous) => {
      if (previous.length > 0 && previous[0]) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    });
  });
}
