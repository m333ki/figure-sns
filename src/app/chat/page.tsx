"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { ChatThreadSummary } from "@/types";
import { fetchThreads } from "@/lib/messages";
import { formatTimeAgo } from "@/lib/formatTimeAgo";

export default function ChatPage() {
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchThreads()
      .then(setThreads)
      .catch((e) => setError(e instanceof Error ? e.message : "会話の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-foreground">チャット</h1>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted">
          読み込み中...
        </p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : threads.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-24 text-center">
          <MessageCircle size={40} className="mb-4 text-gray-300 dark:text-gray-700" />
          <p className="text-sm text-muted">
            まだ会話がありません。投稿のユーザー名の横にあるメッセージアイコンから話しかけてみましょう。
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
          {threads.map((t) => (
            <Link
              key={t.otherUserId}
              href={`/chat/${t.otherUserId}`}
              className="flex items-center gap-3 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                {t.otherUsername[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`truncate text-sm ${
                      t.unreadCount > 0
                        ? "font-semibold text-foreground"
                        : "font-medium text-muted"
                    }`}
                  >
                    {t.otherUsername}
                  </p>
                  <span className="shrink-0 text-xs text-muted">
                    {formatTimeAgo(t.lastMessageAt)}
                  </span>
                </div>
                <p className="truncate text-xs text-muted">
                  {t.lastMessage}
                </p>
              </div>
              {t.unreadCount > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-medium text-accent-foreground">
                  {t.unreadCount > 99 ? "99+" : t.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
