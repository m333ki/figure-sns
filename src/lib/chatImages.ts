import { supabase } from "@/lib/supabase";

export const MAX_CHAT_IMAGES = 3;
export const MAX_CHAT_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 1920;
const COMPRESS_QUALITY = 0.8;

export const ACCEPTED_CHAT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

// Empty file.type (common for HEIC picked on some OS/browser combos, which
// don't register a MIME type for it) is treated as unknown-but-allowed
// rather than rejected -- the extension-based fallback elsewhere covers it.
export function validateChatImageFile(file: File): string | null {
  if (file.size > MAX_CHAT_IMAGE_BYTES) {
    return "ファイルサイズが大きすぎます（10MB以下にしてください）";
  }
  if (file.type && !ACCEPTED_CHAT_IMAGE_TYPES.includes(file.type)) {
    return "対応していないファイル形式です（JPEG/PNG/WebP/HEICのみ）";
  }
  return null;
}

let webpSupported: boolean | null = null;
function supportsWebpEncoding(): boolean {
  if (webpSupported !== null) return webpSupported;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  webpSupported = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  return webpSupported;
}

export type CompressedChatImage = { blob: Blob; ext: string };

// Resizes to a 1920px-long-edge max and re-encodes as WebP (JPEG where WebP
// encoding isn't available) before upload, for faster sends and cheaper
// storage. Falls back to uploading the original file untouched if decoding
// fails -- notably HEIC, which most desktop browsers' canvas can't decode
// at all -- rather than blocking the send.
export async function compressChatImage(file: File): Promise<CompressedChatImage> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas context unavailable");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const useWebp = supportsWebpEncoding();
    const mimeType = useWebp ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mimeType, COMPRESS_QUALITY)
    );
    if (!blob) throw new Error("compression produced no output");
    return { blob, ext: useWebp ? "webp" : "jpg" };
  } catch (e) {
    console.error("chat image compression failed, using original", e);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    return { blob: file, ext };
  }
}

export async function uploadChatImage(image: CompressedChatImage): Promise<string> {
  const path = `chat/${Date.now()}-${Math.random().toString(36).slice(2)}.${image.ext}`;
  const { error } = await supabase.storage
    .from("figures")
    .upload(path, image.blob, { contentType: image.blob.type || `image/${image.ext}` });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("figures").getPublicUrl(path);
  return publicUrl;
}
