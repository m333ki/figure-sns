import Link from "next/link";
import Image from "next/image";
import { Post } from "@/types";
import PostImage from "@/components/PostImage";
import PostReportMenu from "@/components/PostReportMenu";
import ExpandableText from "@/components/ExpandableText";

export default function PostCard({
  post,
  onTogglePin,
  isLiked,
  onToggleLike,
  onOpenDetail,
}: {
  post: Post;
  onTogglePin?: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onOpenDetail?: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="relative w-full">
        <PostImage
          src={post.imageUrl}
          alt={post.figureName ?? post.username}
          sizes="(max-width: 640px) 100vw, 640px"
        />

        {onOpenDetail && (
          <button
            type="button"
            onClick={onOpenDetail}
            aria-label="投稿を拡大表示"
            className="absolute inset-0 h-full w-full"
          />
        )}

        {onOpenDetail && (
          <div className="absolute right-2 top-2 z-10">
            <PostReportMenu
              postId={post.id}
              buttonClassName="bg-black/40 text-white hover:bg-black/60 hover:text-white"
            />
          </div>
        )}

        {onTogglePin && (
          <button
            type="button"
            onClick={onTogglePin}
            aria-pressed={post.isPinned}
            aria-label={post.isPinned ? "固定を解除" : "投稿を固定する"}
            title={post.isPinned ? "固定を解除" : "投稿を固定する"}
            className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full transition ${
              post.isPinned
                ? "bg-pink-600 text-white"
                : "bg-black/40 text-white hover:bg-black/60"
            }`}
          >
            <PinIcon filled={!!post.isPinned} />
          </button>
        )}
      </div>

      <div className="space-y-2.5 p-4">
        {(post.isPinned || post.figureName || post.makerName) && (
          <div>
            {(post.isPinned || post.figureName) && (
              <div className="flex items-center gap-1.5">
                {post.isPinned && (
                  <span className="text-xs font-medium text-pink-600 dark:text-pink-400">固定</span>
                )}
                {post.figureName && (
                  <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                    {post.figureName}
                  </h3>
                )}
              </div>
            )}
            {post.makerName && (
              <p className="truncate text-sm text-gray-500 dark:text-gray-400">{post.makerName}</p>
            )}
          </div>
        )}

        {post.caption && (
          <ExpandableText
            text={post.caption}
            className="whitespace-pre-wrap break-words text-sm text-gray-600 dark:text-gray-400"
          />
        )}

        <div className="flex items-center justify-between">
          <Link
            href="/mypage"
            className="flex min-w-0 items-center gap-2 rounded-full transition hover:opacity-80"
          >
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <Image
                src={post.userAvatarUrl}
                alt={post.username}
                fill
                className="object-cover"
              />
            </div>
            <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
              {post.username}
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {onOpenDetail && (
              <button
                type="button"
                onClick={onOpenDetail}
                aria-label="コメントを見る"
                className="flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-pink-500 dark:text-gray-500"
              >
                <CommentIcon />
                {post.commentCount}
              </button>
            )}

            {onToggleLike ? (
              <button
                type="button"
                onClick={onToggleLike}
                aria-pressed={isLiked}
                aria-label={isLiked ? "いいねを取り消す" : "いいねする"}
                className={`flex items-center gap-1.5 text-sm transition ${
                  isLiked ? "text-pink-600 dark:text-pink-400" : "text-gray-400 hover:text-pink-500 dark:text-gray-500"
                }`}
              >
                <HeartIcon filled={!!isLiked} />
                {post.likeCount}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
                <HeartIcon filled={false} />
                {post.likeCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
      <circle
        cx="12"
        cy="9"
        r="5"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.8}
      />
      <line
        x1="12"
        y1="14"
        x2="12"
        y2="20"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
      />
    </svg>
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
