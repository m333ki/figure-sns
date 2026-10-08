"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { fetchReportsWithContext, deleteUserAsAdmin, type ReportWithContext } from "@/lib/admin";
import { deletePost } from "@/lib/posts";
import ChatImageLightbox from "@/components/ChatImageLightbox";

const TARGET_TYPE_LABEL: Record<ReportWithContext["targetType"], string> = {
  post: "投稿",
  user: "ユーザー",
  message: "メッセージ",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<ReportWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      setReports(await fetchReportsWithContext());
    } catch (e) {
      setError(e instanceof Error ? e.message : "通報一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // AdminLayout (src/app/admin/layout.tsx) already confirms is_admin before
  // this page ever renders -- safe to load unconditionally.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReports();
  }, []);

  const handleDeletePost = async (report: ReportWithContext) => {
    if (!report.post) return;
    if (!window.confirm(`「${report.post.username}」の投稿を削除しますか？この操作は取り消せません。`)) return;
    setPendingId(report.id);
    try {
      await deletePost(report.post.id);
      showToast("投稿を削除しました");
      await loadReports();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "削除に失敗しました");
    } finally {
      setPendingId(null);
    }
  };

  const handleDeleteUser = async (report: ReportWithContext) => {
    if (!report.accusedUserId) return;
    if (
      !window.confirm(
        "このユーザーのアカウントを完全に削除しますか？投稿・コメント・メッセージなどすべてに影響し、取り消せません。"
      )
    )
      return;
    setPendingId(report.id);
    try {
      await deleteUserAsAdmin(report.accusedUserId);
      showToast("ユーザーを削除しました");
      await loadReports();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "削除に失敗しました");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-foreground">通報管理</h1>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted">読み込み中...</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : reports.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">通報はありません</p>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => {
            const pending = pendingId === r.id;
            const post = r.post;
            const message = r.message;
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-muted dark:bg-gray-800">
                    {TARGET_TYPE_LABEL[r.targetType]}を報告
                  </span>
                  <span className="text-xs text-muted">{formatDateTime(r.createdAt)}</span>
                </div>

                <p className="text-sm text-foreground">
                  理由: <span className="font-semibold">{r.reason}</span>
                </p>
                {r.detail && <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{r.detail}</p>}
                <p className="mt-1 text-xs text-muted">
                  報告者: {r.reporterUsername ?? "不明"}
                </p>

                <div className="mt-3 rounded-lg border border-border bg-background p-3">
                  {r.targetType === "post" &&
                    (post ? (
                      <div className="flex gap-3">
                        {post.imageUrls[0] && (
                          <button
                            type="button"
                            onClick={() => setLightbox({ urls: post.imageUrls, index: 0 })}
                            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                          >
                            <Image src={post.imageUrls[0]} alt="" fill sizes="64px" className="object-cover" />
                          </button>
                        )}
                        <div className="min-w-0">
                          {post.userId ? (
                            <Link href={`/u/${post.userId}`} className="text-sm font-medium text-foreground hover:underline">
                              @{post.username}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium text-foreground">@{post.username}</span>
                          )}
                          {post.caption && (
                            <p className="mt-0.5 line-clamp-2 text-sm text-muted">{post.caption}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted">この投稿は既に削除されています</p>
                    ))}

                  {r.targetType === "user" &&
                    (r.user ? (
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <Image src={r.user.avatarUrl} alt="" fill sizes="40px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/u/${r.user.userId}`} className="text-sm font-medium text-foreground hover:underline">
                            {r.user.displayName}
                          </Link>
                          <p className="text-xs text-muted">@{r.user.username}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted">このユーザーは既に削除されています</p>
                    ))}

                  {r.targetType === "message" &&
                    (message ? (
                      <div>
                        <p className="text-sm font-medium text-foreground">@{message.senderUsername}</p>
                        {message.body && <p className="mt-0.5 text-sm text-muted">{message.body}</p>}
                        {message.imageUrls.length > 0 && (
                          <div className="mt-1.5 flex gap-1.5">
                            {message.imageUrls.slice(0, 3).map((url, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setLightbox({ urls: message.imageUrls, index: i })}
                                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                              >
                                <Image src={url} alt="" fill sizes="56px" className="object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted">このメッセージは既に削除されています</p>
                    ))}
                </div>

                <div className="mt-3 flex gap-2">
                  {r.targetType === "post" && r.post && (
                    <button
                      type="button"
                      onClick={() => handleDeletePost(r)}
                      disabled={pending}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      投稿を削除
                    </button>
                  )}
                  {r.accusedUserId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(r)}
                      disabled={pending}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      {pending ? "処理中..." : "ユーザーを削除"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lightbox && (
        <ChatImageLightbox
          urls={lightbox.urls}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
