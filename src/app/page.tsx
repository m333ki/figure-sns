"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import AdFeedCard from "@/components/AdFeedCard";
import PostCard from "@/components/PostCard";
import PostDetailModal from "@/components/PostDetailModal";
import { usePosts } from "@/context/PostsContext";

// One placeholder ad slot after every 4 posts -- matches the mobile app's
// in-feed ad placement (src/components/PostGrid.tsx there).
const AD_INTERVAL = 4;

export default function TimelinePage() {
  const { posts, loading, error, refresh, isPostLiked, toggleLike, isPostSaved, toggleSave } =
    usePosts();
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const detailPost = posts.find((p) => p.id === detailPostId) ?? null;
  // Distinguish the very first (empty-feed) load from a background reload
  // triggered by tapping Home while already at the top -- the latter should
  // keep the existing feed on screen (with a small spinner) instead of
  // replacing it with the full-page loading/error states.
  const isInitialLoad = loading && posts.length === 0 && !error;
  const isBackgroundRefreshing = loading && posts.length > 0;

  return (
    <div className="mx-auto w-full px-4 py-6">
      {isBackgroundRefreshing && (
        <div className="flex justify-center py-3">
          <Loader2 size={20} className="animate-spin text-pink-500" />
        </div>
      )}
      {isInitialLoad ? (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">読み込み中...</p>
      ) : error && posts.length === 0 ? (
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
          {posts.map((post, index) => (
            <div key={post.id} className="flex flex-col gap-4">
              <PostCard
                post={post}
                isLiked={isPostLiked(post.id)}
                onToggleLike={() => toggleLike(post.id)}
                isSaved={isPostSaved(post.id)}
                onToggleSave={() => toggleSave(post.id)}
                onOpenDetail={() => setDetailPostId(post.id)}
              />
              {(index + 1) % AD_INTERVAL === 0 && <AdFeedCard />}
            </div>
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
