"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { AppNotification } from "@/types";
import { fetchNotifications, markAllNotificationsRead } from "@/lib/notifications";
import { formatTimeAgo } from "@/lib/formatTimeAgo";
import { usePosts } from "@/context/PostsContext";
import { useNotifications } from "@/context/NotificationsContext";
import PostDetailModal from "@/components/PostDetailModal";

const ICONS = {
  like: { Icon: Heart, className: "text-pink-500", filled: true },
  comment: { Icon: MessageCircle, className: "text-blue-500", filled: false },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { posts, isPostLiked, toggleLike, isPostSaved, toggleSave } = usePosts();
  const { refresh: refreshBadges } = useNotifications();
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const detailPost = posts.find((p) => p.id === detailPostId) ?? null;

  useEffect(() => {
    // マウント時に一覧取得＋既読化。一発取得のみ（アプリ内リアルタイム
    // 反映はしない設計 — プラン参照）。
    const load = async () => {
      try {
        const data = await fetchNotifications();
        setNotifications(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "通知の取得に失敗しました");
      } finally {
        setLoading(false);
      }
      // 既読化はベストエフォート。失敗しても一覧表示自体は成立させる。
      try {
        await markAllNotificationsRead();
        refreshBadges();
      } catch (e) {
        console.error("markAllNotificationsRead failed", e);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto w-full px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">通知</h1>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          読み込み中...
        </p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : notifications.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          まだ通知はありません
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
          {notifications.map((n) => {
            const { Icon, className, filled } = ICONS[n.type];
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => n.postId && setDetailPostId(n.postId)}
                className="flex items-start gap-3 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <Icon
                  size={20}
                  className={`mt-0.5 shrink-0 ${className}`}
                  fill={filled ? "currentColor" : "none"}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <span className="font-semibold">{n.actorUsername}</span>
                    {n.type === "like"
                      ? "があなたの投稿にいいねしました"
                      : `があなたの投稿にコメントしました：「${n.commentBody}」`}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {formatTimeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-pink-500" />
                )}
              </button>
            );
          })}
        </div>
      )}

      <PostDetailModal
        open={detailPostId !== null}
        post={detailPost}
        isLiked={detailPost ? isPostLiked(detailPost.id) : false}
        onToggleLike={() => detailPost && toggleLike(detailPost.id)}
        isSaved={detailPost ? isPostSaved(detailPost.id) : false}
        onToggleSave={() => detailPost && toggleSave(detailPost.id)}
        onClose={() => setDetailPostId(null)}
      />
    </div>
  );
}
