import { supabase } from "@/lib/supabase";

export async function incrementPostLikes(
  postId: string,
  delta: 1 | -1
): Promise<void> {
  const { error } = await supabase.rpc("increment_post_likes", {
    post_id: postId,
    delta,
  });
  if (error) throw error;
}
