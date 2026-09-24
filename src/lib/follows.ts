import { supabase } from "@/lib/supabase";
import { Profile } from "@/lib/profiles";

type DbProfile = {
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
};

function mapDbProfileToProfile(row: DbProfile): Profile {
  return {
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
  };
}

// Two round-trips (follow rows, then the profiles they point at) rather than
// a PostgREST embed -- keeps this independent of the exact foreign-key
// constraint name, matching how the rest of this codebase queries Supabase.
async function fetchProfilesFor(userIds: string[]): Promise<Profile[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase.from("profiles").select("*").in("user_id", userIds);
  if (error) throw error;
  const byId = new Map((data as DbProfile[]).map((row) => [row.user_id, mapDbProfileToProfile(row)]));
  // .in() doesn't preserve input order, so re-derive it from userIds -- also
  // silently drops any id with no matching profile row instead of throwing.
  return userIds.map((id) => byId.get(id)).filter((p): p is Profile => !!p);
}

export async function fetchFollowers(targetUserId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", targetUserId);
  if (error) throw error;
  return fetchProfilesFor((data as { follower_id: string }[]).map((row) => row.follower_id));
}

export async function fetchFollowing(targetUserId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", targetUserId);
  if (error) throw error;
  return fetchProfilesFor((data as { following_id: string }[]).map((row) => row.following_id));
}

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
