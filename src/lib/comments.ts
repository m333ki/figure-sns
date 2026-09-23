import { supabase } from "@/lib/supabase";
import { PostComment } from "@/types";
import { ensureProfileAndGetAvatarUrl } from "@/lib/profiles";

type DbComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_id: string | null;
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
    userId: row.user_id,
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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("ログインが必要です");
  const username =
    (session.user.user_metadata?.username as string | undefined) ??
    session.user.email?.split("@")[0] ??
    "unknown";
  const avatarUrl = await ensureProfileAndGetAvatarUrl(session.user.id, username);

  let { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: input.postId,
      parent_id: input.parentId ?? null,
      user_id: session.user.id,
      username,
      user_avatar_url: avatarUrl,
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
        user_id: session.user.id,
        username,
        user_avatar_url: avatarUrl,
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

// `decrementBy` covers cascade-deleted replies too: deleting a top-level
// comment with N replies removes 1+N rows, so the counter needs the same
// adjustment or it drifts upward forever (nothing else decrements it).
export async function deleteComment(
  commentId: string,
  postId: string,
  decrementBy: number
): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;

  await supabase
    .rpc("increment_post_comments", { post_id: postId, delta: -decrementBy })
    .then(({ error: rpcError }) => {
      if (rpcError) console.error("increment_post_comments failed", rpcError);
    });
}
