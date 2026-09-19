import { supabase } from "@/lib/supabase";
import { PostComment } from "@/types";
import { dummyUserProfile } from "@/lib/dummy-data";
import { FALLBACK_AVATAR_URL } from "@/lib/posts";

type DbComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  username: string;
  user_avatar_url: string | null;
  body: string;
  created_at: string;
};

function mapDbCommentToComment(row: DbComment): PostComment {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    username: row.username,
    userAvatarUrl: row.user_avatar_url,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function fetchComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as DbComment[]).map(mapDbCommentToComment);
}

export type CreateCommentInput = {
  postId: string;
  body: string;
  parentId?: string | null;
};

export async function createComment(
  input: CreateCommentInput
): Promise<PostComment> {
  let { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: input.postId,
      parent_id: input.parentId ?? null,
      username: dummyUserProfile.username,
      user_avatar_url: dummyUserProfile.avatarUrl ?? FALLBACK_AVATAR_URL,
      body: input.body,
    })
    .select()
    .single();

  // Fallback for before the parent_id migration has been run: retry as a
  // top-level comment rather than failing the whole submission.
  if (error?.message?.includes("parent_id")) {
    ({ data, error } = await supabase
      .from("comments")
      .insert({
        post_id: input.postId,
        username: dummyUserProfile.username,
        user_avatar_url: dummyUserProfile.avatarUrl ?? FALLBACK_AVATAR_URL,
        body: input.body,
      })
      .select()
      .single());
  }

  if (error) throw error;

  // Best-effort: the comment itself is already saved, so a failure here
  // (e.g. the RPC not yet deployed) shouldn't surface as a submit error.
  await supabase
    .rpc("increment_post_comments", { post_id: input.postId, delta: 1 })
    .then(({ error: rpcError }) => {
      if (rpcError) console.error("increment_post_comments failed", rpcError);
    });

  return mapDbCommentToComment(data as DbComment);
}
