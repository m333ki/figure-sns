import { supabase } from "@/lib/supabase";
import { AppNotification } from "@/types";

type DbNotification = {
  id: string;
  type: "like" | "comment";
  actor_username: string;
  post_id: string | null;
  comment_body: string | null;
  is_read: boolean;
  created_at: string;
};

function mapDbNotificationToNotification(row: DbNotification): AppNotification {
  return {
    id: row.id,
    type: row.type,
    actorUsername: row.actor_username,
    postId: row.post_id,
    commentBody: row.comment_body,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data as DbNotification[]).map(mapDbNotificationToNotification);
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);
  if (error) throw error;
}

// コメント本体の投稿が成功した"後"に呼ぶベストエフォート処理。ここで失敗して
// も既に保存済みのコメントには影響させない（increment_post_commentsと同じ
// 「握りつぶす」流儀）。呼び出し側で自分自身の投稿への通知は除外すること。
export async function notifyComment(
  recipientId: string,
  actorUsername: string,
  postId: string,
  commentBody: string
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const { error } = await supabase.from("notifications").insert({
    recipient_id: recipientId,
    actor_id: session.user.id,
    actor_username: actorUsername,
    type: "comment",
    post_id: postId,
    comment_body: commentBody,
  });
  if (error) console.error("notifyComment failed", error);
}
