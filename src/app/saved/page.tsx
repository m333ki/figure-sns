"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import PostCard from "@/components/PostCard";
import PostDetailModal from "@/components/PostDetailModal";
import { usePosts } from "@/context/PostsContext";

export default function SavedPage() {
  const { posts, loading, error, refresh, isPostLiked, toggleLike, isPostSaved, toggleSave } =
    usePosts();
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const detailPost = posts.find((p) => p.id === detailPostId) ?? null;

  const savedPosts = posts.filter((p) => isPostSaved(p.id));

  return (
    <div className="mx-auto w-full px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">保存済み</h1>

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
      ) : savedPosts.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-24 text-center">
          <Bookmark size={40} className="mb-4 text-gray-300 dark:text-gray-700" />
          <p className="text-sm text-gray-400 dark:text-gray-500">
            保存した投稿はまだありません
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {savedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLiked={isPostLiked(post.id)}
              onToggleLike={() => toggleLike(post.id)}
              isSaved={isPostSaved(post.id)}
              onToggleSave={() => toggleSave(post.id)}
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
        isSaved={detailPost ? isPostSaved(detailPost.id) : false}
        onToggleSave={() => detailPost && toggleSave(detailPost.id)}
        onClose={() => setDetailPostId(null)}
      />
    </div>
  );
}
