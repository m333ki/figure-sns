"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import PostDetailModal from "@/components/PostDetailModal";
import { usePosts } from "@/context/PostsContext";

const TAGS = [
  "ねんどろいど",
  "figma",
  "スケールフィギュア",
  "プライズ",
  "ガレージキット",
  "アクリルスタンド",
  "デフォルメ",
  "痛バ",
];

export default function ExplorePage() {
  const { posts, loading, error, refresh, isPostLiked, toggleLike } = usePosts();
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const detailPost = posts.find((p) => p.id === detailPostId) ?? null;

  const popularPosts = useMemo(
    () => [...posts].sort((a, b) => b.likeCount - a.likeCount),
    [posts],
  );

  return (
    <div className="mx-auto w-full px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">探索</h1>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            className="shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            #{tag}
          </button>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
        人気の投稿
      </h2>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          読み込み中...
        </p>
      ) : error ? (
        <div className="py-12 text-center text-sm text-red-500 dark:text-red-400">
          <p>{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-3 rounded-full border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            再読み込み
          </button>
        </div>
      ) : popularPosts.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          まだ投稿がありません
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {popularPosts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setDetailPostId(post.id)}
              className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
            >
              <Image
                src={post.imageUrl}
                alt={post.figureName ?? post.username}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <PostDetailModal
        open={detailPostId !== null}
        post={detailPost}
        isLiked={detailPost ? isPostLiked(detailPost.id) : false}
        onToggleLike={() => detailPost && toggleLike(detailPost.id)}
        onClose={() => setDetailPostId(null)}
      />
    </div>
  );
}
