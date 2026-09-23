import { supabase } from "@/lib/supabase";

export async function likePost(postId: string, actorUsername: string): Promise<void> {
  const { error } = await supabase.rpc("like_post", {
    p_post_id: postId,
    p_actor_username: actorUsername,
  });
  if (error) throw error;
}

export async function unlikePost(postId: string): Promise<void> {
  const { error } = await supabase.rpc("unlike_post", { p_post_id: postId });
  if (error) throw error;
}
