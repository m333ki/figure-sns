import { supabase } from "@/lib/supabase";

export async function followUser(targetUserId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("ログインが必要です");

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: session.user.id, following_id: targetUserId });
  if (error) throw error;
}

export async function unfollowUser(targetUserId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("ログインが必要です");

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", session.user.id)
    .eq("following_id", targetUserId);
  if (error) throw error;
}

export async function fetchIsFollowing(targetUserId: string): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return false;

  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", session.user.id)
    .eq("following_id", targetUserId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function fetchFollowCounts(
  targetUserId: string
): Promise<{ followerCount: number; followingCount: number }> {
  const [followers, following] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetUserId),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", targetUserId),
  ]);
  if (followers.error) throw followers.error;
  if (following.error) throw following.error;
  return {
    followerCount: followers.count ?? 0,
    followingCount: following.count ?? 0,
  };
}
