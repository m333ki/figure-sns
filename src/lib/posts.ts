import { supabase } from "@/lib/supabase";
import { Post } from "@/types";
import { dummyUserProfile } from "@/lib/dummy-data";

// UserProfile.avatarUrl is `string | null`; Post.userAvatarUrl is a
// non-nullable `string`. This covers the gap in both directions.
export const FALLBACK_AVATAR_URL =
  "https://placehold.co/80x80/f3f4f6/374151/png?text=%3F";

type DbPost = {
  id: string;
  username: string;
  user_avatar_url: string | null;
  figure_name: string | null;
  maker_name: string | null;
  image_url: string;
  caption: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
};

function mapDbPostToPost(row: DbPost): Post {
  return {
    id: row.id,
    username: row.username,
    userAvatarUrl: row.user_avatar_url ?? FALLBACK_AVATAR_URL,
    figureName: row.figure_name,
    makerName: row.maker_name,
    imageUrl: row.image_url,
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

export type CreatePostInput = {
  figureName?: string | null;
  makerName?: string | null;
  caption?: string | null;
  file: File;
};

function extensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5 && !fromName.includes("/")) {
    return fromName.toLowerCase();
  }
  const fromType = file.type.split("/").pop();
  return fromType ? fromType.toLowerCase() : "jpg";
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const ext = extensionFromFile(input.file);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("figures")
    .upload(path, input.file, {
      contentType: input.file.type || "image/jpeg",
    });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("figures").getPublicUrl(path);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      username: dummyUserProfile.username,
      user_avatar_url: dummyUserProfile.avatarUrl ?? FALLBACK_AVATAR_URL,
      figure_name: input.figureName ?? null,
      maker_name: input.makerName ?? null,
      caption: input.caption ?? null,
      image_url: publicUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbPostToPost(data as DbPost);
}
