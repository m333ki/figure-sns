import { supabase } from "@/lib/supabase";
import { FALLBACK_AVATAR_URL } from "@/lib/profiles";
import type { ReportTargetType } from "@/lib/reports";

export async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.is_admin ?? false;
}

type DbReport = {
  id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  detail: string | null;
  reporter_id: string | null;
  created_at: string;
};

type ReportedPost = {
  id: string;
  userId: string | null;
  username: string;
  caption: string | null;
  imageUrls: string[];
};

type ReportedUser = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
};

type ReportedMessage = {
  id: string;
  senderId: string;
  senderUsername: string;
  body: string;
  imageUrls: string[];
};

export type ReportWithContext = {
  id: string;
  targetType: ReportTargetType;
  reason: string;
  detail: string | null;
  createdAt: string;
  reporterUsername: string | null;
  // The user a "ユーザーを削除" action on this report would remove --
  // the reported user themselves, or the author/sender of the reported
  // post/message. Null if that content (or its author) was already deleted.
  accusedUserId: string | null;
  post: ReportedPost | null;
  user: ReportedUser | null;
  message: ReportedMessage | null;
};

export async function fetchReportsWithContext(): Promise<ReportWithContext[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const reports = data as DbReport[];

  const postIds = [...new Set(reports.filter((r) => r.target_type === "post").map((r) => r.target_id))];
  const userIds = [...new Set(reports.filter((r) => r.target_type === "user").map((r) => r.target_id))];
  const messageIds = [...new Set(reports.filter((r) => r.target_type === "message").map((r) => r.target_id))];
  const reporterIds = [...new Set(reports.map((r) => r.reporter_id).filter((id): id is string => !!id))];

  const [postsRes, usersRes, messagesRes, reportersRes] = await Promise.all([
    postIds.length
      ? supabase.from("posts").select("id,user_id,username,caption,image_url,image_urls").in("id", postIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? supabase.from("profiles").select("user_id,username,display_name,avatar_url").in("user_id", userIds)
      : Promise.resolve({ data: [], error: null }),
    messageIds.length
      ? supabase.from("messages").select("id,sender_id,sender_username,body,image_urls").in("id", messageIds)
      : Promise.resolve({ data: [], error: null }),
    reporterIds.length
      ? supabase.from("profiles").select("user_id,username").in("user_id", reporterIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (postsRes.error) throw postsRes.error;
  if (usersRes.error) throw usersRes.error;
  if (messagesRes.error) throw messagesRes.error;
  if (reportersRes.error) throw reportersRes.error;

  const postById = new Map(
    (postsRes.data as { id: string; user_id: string | null; username: string; caption: string | null; image_url: string; image_urls: string[] | null }[]).map(
      (p) => [
        p.id,
        {
          id: p.id,
          userId: p.user_id,
          username: p.username,
          caption: p.caption,
          imageUrls: p.image_urls && p.image_urls.length > 0 ? p.image_urls : p.image_url ? [p.image_url] : [],
        } satisfies ReportedPost,
      ]
    )
  );
  const userById = new Map(
    (usersRes.data as { user_id: string; username: string; display_name: string; avatar_url: string | null }[]).map(
      (u) => [
        u.user_id,
        {
          userId: u.user_id,
          username: u.username,
          displayName: u.display_name,
          avatarUrl: u.avatar_url ?? FALLBACK_AVATAR_URL,
        } satisfies ReportedUser,
      ]
    )
  );
  const messageById = new Map(
    (messagesRes.data as { id: string; sender_id: string; sender_username: string; body: string; image_urls: string[] | null }[]).map(
      (m) => [
        m.id,
        {
          id: m.id,
          senderId: m.sender_id,
          senderUsername: m.sender_username,
          body: m.body,
          imageUrls: m.image_urls ?? [],
        } satisfies ReportedMessage,
      ]
    )
  );
  const reporterUsernameById = new Map(
    (reportersRes.data as { user_id: string; username: string }[]).map((r) => [r.user_id, r.username])
  );

  return reports.map((r) => {
    const post = r.target_type === "post" ? (postById.get(r.target_id) ?? null) : null;
    const user = r.target_type === "user" ? (userById.get(r.target_id) ?? null) : null;
    const message = r.target_type === "message" ? (messageById.get(r.target_id) ?? null) : null;

    const accusedUserId =
      r.target_type === "post"
        ? (post?.userId ?? null)
        : r.target_type === "user"
          ? (user?.userId ?? null)
          : (message?.senderId ?? null);

    return {
      id: r.id,
      targetType: r.target_type,
      reason: r.reason,
      detail: r.detail,
      createdAt: r.created_at,
      reporterUsername: r.reporter_id ? (reporterUsernameById.get(r.reporter_id) ?? null) : null,
      accusedUserId,
      post,
      user,
      message,
    };
  });
}

export async function deleteUserAsAdmin(userId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("ログインが必要です");

  const res = await fetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error || "削除に失敗しました");
  }
}
