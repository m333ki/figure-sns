"use client";

import { useState } from "react";
import PostCard from "@/components/PostCard";
import PostDetailModal from "@/components/PostDetailModal";
import { usePosts } from "@/context/PostsContext";

export default function TimelinePage() {
  const { posts, loading, error, refresh, isPostLiked, toggleLike } = usePosts();
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const detailPost = posts.find((p) => p.id === detailPostId) ?? null;

  return (
    <div className="mx-auto w-full px-4 py-6">
      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">読み込み中...</p>
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
      ) : posts.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">まだ投稿がありません</p>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLiked={isPostLiked(post.id)}
              onToggleLike={() => toggleLike(post.id)}
              onOpenDetail={() => setDetailPostId(post.id)}
            />
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
