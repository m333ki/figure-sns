import { supabase } from "@/lib/supabase";
import { Post } from "@/types";
import { FALLBACK_AVATAR_URL, ensureProfileAndGetAvatarUrl } from "@/lib/profiles";

type DbPost = {
  id: string;
  user_id: string | null;
  username: string;
  user_avatar_url: string | null;
  figure_name: string | null;
  maker_name: string | null;
  image_url: string;
  image_urls: string[] | null;
  caption: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
};

function mapDbPostToPost(row: DbPost): Post {
  // Falls back to the single legacy image_url column when image_urls is
  // empty/missing — covers rows written before the multi-image migration,
  // and the migration not having been run yet at all.
  const imageUrls =
    row.image_urls && row.image_urls.length > 0
      ? row.image_urls
      : row.image_url
        ? [row.image_url]
        : [];

  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    userAvatarUrl: row.user_avatar_url ?? FALLBACK_AVATAR_URL,
    figureName: row.figure_name,
    makerName: row.maker_name,
    imageUrls,
    caption: row.caption,
    likeCount: row.like_count,
    commentCount: row.comment_count ?? 0,
  };
}

export async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as DbPost[]).map(mapDbPostToPost);
}

export const MAX_POST_IMAGES = 10;

export type CreatePostInput = {
  figureName?: string | null;
  makerName?: string | null;
  caption?: string | null;
  files: File[];
};

function extensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5 && !fromName.includes("/")) {
    return fromName.toLowerCase();
  }
  const fromType = file.type.split("/").pop();
  return fromType ? fromType.toLowerCase() : "jpg";
}

async function uploadPostImage(file: File): Promise<string> {
  const ext = extensionFromFile(file);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("figures")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("figures").getPublicUrl(path);
  return publicUrl;
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  if (input.files.length === 0) throw new Error("画像を選択してください");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("ログインが必要です");
  const username =
    (session.user.user_metadata?.username as string | undefined) ??
    session.user.email?.split("@")[0] ??
    "unknown";

  // Uploaded in parallel; a failure partway through leaves any
  // already-uploaded files orphaned in storage rather than rolled back —
  // an acceptable MVP tradeoff, matching this app's other best-effort paths.
  const [imageUrls, avatarUrl] = await Promise.all([
    Promise.all(input.files.map(uploadPostImage)),
    ensureProfileAndGetAvatarUrl(session.user.id, username),
  ]);

  const basePayload = {
    user_id: session.user.id,
    username,
    user_avatar_url: avatarUrl,
    figure_name: input.figureName ?? null,
    maker_name: input.makerName ?? null,
    caption: input.caption ?? null,
    image_url: imageUrls[0],
  };

  let { data, error } = await supabase
    .from("posts")
    .insert({ ...basePayload, image_urls: imageUrls })
    .select()
    .single();

  // Fallback for before the image_urls migration has been run: post with
  // just the first image rather than failing the whole submission.
  if (error?.message?.includes("image_urls")) {
    ({ data, error } = await supabase.from("posts").insert(basePayload).select().single());
  }

  if (error) throw error;
  return mapDbPostToPost(data as DbPost);
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;
}
