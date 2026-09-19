"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { Post, PostComment } from "@/types";
import { fetchComments, createComment } from "@/lib/comments";
import { usePosts } from "@/context/PostsContext";
import UserAvatar from "@/components/UserAvatar";
import PostReportMenu from "@/components/PostReportMenu";
import ExpandableText from "@/components/ExpandableText";

type ReplyTarget = { parentId: string; username: string };

export default function PostDetailModal({
  open,
  post,
  isLiked,
  onToggleLike,
  onClose,
}: {
  open: boolean;
  post: Post | null;
  isLiked: boolean;
  onToggleLike: () => void;
  onClose: () => void;
}) {
  const { incrementCommentCount } = usePosts();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !post) return;
    let cancelled = false;

    const loadComments = async () => {
      setComments([]);
      setCommentBody("");
      setReplyTarget(null);
      setCommentsError(null);
      setCommentsLoading(true);
      try {
        const data = await fetchComments(post.id);
        if (!cancelled) setComments(data);
      } catch (e) {
        if (!cancelled) {
          setCommentsError(
            e instanceof Error ? e.message : "コメントの取得に失敗しました"
          );
        }
      } finally {
        if (!cancelled) setCommentsLoading(false);
      }
    };

    loadComments();

    return () => {
      cancelled = true;
    };
    // Depend on post?.id (not `post`): the parent derives `post` fresh via
    // posts.find() on every render, so its object identity changes whenever
    // *any* post's likeCount changes. Depending on the object itself would
    // refetch comments every time this post is liked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post?.id]);

  const topLevelComments = useMemo(
    () => comments.filter((c) => !c.parentId),
    [comments]
  );
  const repliesByParent = useMemo(() => {
    const map = new Map<string, PostComment[]>();
    for (const c of comments) {
      if (!c.parentId) continue;
      const arr = map.get(c.parentId) ?? [];
      arr.push(c);
      map.set(c.parentId, arr);
    }
    return map;
  }, [comments]);

  if (!open || !post) return null;

  const canSubmitComment = commentBody.trim().length > 0 && !commentSubmitting;

  const handleReplyClick = (parentId: string, username: string) => {
    setReplyTarget({ parentId, username });
    setCommentBody(`@${username} `);
    textareaRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyTarget(null);
    setCommentBody("");
  };

  const handleAddComment = async () => {
    if (!canSubmitComment) return;
    setCommentSubmitting(true);
    try {
      const newComment = await createComment({
        postId: post.id,
        body: commentBody.trim(),
        parentId: replyTarget?.parentId ?? null,
      });
      setComments((prev) => [...prev, newComment]);
      setCommentBody("");
      setReplyTarget(null);
      incrementCommentCount(post.id);
    } catch (e) {
      setCommentsError(
        e instanceof Error ? e.message : "コメントの投稿に失敗しました"
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="投稿の詳細"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:h-[90vh] sm:flex-row dark:bg-gray-900"
      >
        {/* Left: image */}
        <div className="relative flex h-[58vh] w-full shrink-0 items-center justify-center bg-neutral-900 sm:h-full sm:w-2/3">
          <Image
            src={post.imageUrl}
            alt={post.figureName ?? post.username}
            fill
            sizes="(max-width: 640px) 100vw, 1024px"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Right: info + comments + input */}
        <div className="flex min-h-0 w-full flex-1 flex-col sm:w-1/3">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <Link
              href="/mypage"
              onClick={onClose}
              className="flex min-w-0 items-center gap-2.5 rounded-full transition hover:opacity-80"
            >
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <UserAvatar src={post.userAvatarUrl} alt={post.username} />
              </div>
              <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {post.username}
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-1">
              <PostReportMenu postId={post.id} />
              <button
                type="button"
                onClick={onClose}
                aria-label="閉じる"
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {(post.figureName || post.makerName) && (
              <div className="mb-2">
                {post.figureName && (
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{post.figureName}</h3>
                )}
                {post.makerName && <p className="text-xs text-gray-500 dark:text-gray-400">{post.makerName}</p>}
              </div>
            )}
            {post.caption && (
              <ExpandableText
                text={post.caption}
                wrapperClassName="mb-3"
                className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300"
              />
            )}

            <div className="mb-4 flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleLike}
                aria-pressed={isLiked}
                className={`flex items-center gap-1 text-sm ${
                  isLiked ? "text-pink-600 dark:text-pink-400" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                <HeartIcon filled={isLiked} />
                {post.likeCount}
              </button>
            </div>

            <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
              <p className="mb-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                コメント{comments.length > 0 && `（${comments.length}）`}
              </p>
              {commentsLoading ? (
                <p className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">読み込み中...</p>
              ) : commentsError ? (
                <p className="py-4 text-center text-xs text-red-500 dark:text-red-400">{commentsError}</p>
              ) : topLevelComments.length === 0 ? (
                <p className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">まだコメントがありません</p>
              ) : (
                <ul className="space-y-4">
                  {topLevelComments.map((c) => (
                    <li key={c.id}>
                      <CommentRow comment={c} onReply={() => handleReplyClick(c.id, c.username)} />
                      {(repliesByParent.get(c.id) ?? []).map((r) => (
                        <div
                          key={r.id}
                          className="ml-9 mt-3 border-l-2 border-gray-100 pl-3 dark:border-gray-800"
                        >
                          <CommentRow comment={r} onReply={() => handleReplyClick(c.id, r.username)} />
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
            {replyTarget && (
              <div className="mb-2 flex items-center justify-between rounded-md bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <span>{replyTarget.username} さんに返信</span>
                <button
                  type="button"
                  onClick={handleCancelReply}
                  aria-label="返信をキャンセル"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="コメントを追加..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 dark:border-gray-700 dark:text-gray-100"
                />
                <p className="mt-0.5 text-right text-[11px] text-gray-400 dark:text-gray-500">
                  {commentBody.length}/200
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!canSubmitComment}
                className="shrink-0 rounded-full bg-pink-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                送信
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  onReply,
}: {
  comment: PostComment;
  onReply: () => void;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        {comment.userAvatarUrl && (
          <Image src={comment.userAvatarUrl} alt={comment.username} fill className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{comment.username}</p>
        <ExpandableText
          text={comment.body}
          className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700 dark:text-gray-300"
          buttonClassName="mt-0.5 text-[11px] font-medium text-gray-400 transition hover:text-pink-500 dark:text-gray-500"
        />
        <button
          type="button"
          onClick={onReply}
          className="mt-1 text-[11px] font-medium text-gray-400 transition hover:text-pink-500 dark:text-gray-500"
        >
          返信
        </button>
      </div>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
    >
      <path d="M12 21s-6.716-4.35-9.428-8.06C.86 10.42 1.02 6.9 3.6 5.06a5.4 5.4 0 0 1 7.2 1.02l1.2 1.44 1.2-1.44a5.4 5.4 0 0 1 7.2-1.02c2.58 1.84 2.74 5.36 1.03 7.88C18.716 16.65 12 21 12 21Z" />
    </svg>
  );
}
