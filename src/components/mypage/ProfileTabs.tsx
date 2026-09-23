"use client";

import { useState } from "react";
import DisplayShelf from "@/components/mypage/DisplayShelf";
import PostCard from "@/components/PostCard";
import PostDetailModal from "@/components/PostDetailModal";
import { usePosts } from "@/context/PostsContext";
import { useAuth } from "@/context/AuthContext";

type Tab = "shelf" | "posts";

export default function ProfileTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("shelf");
  const { user } = useAuth();
  const { posts, isPostLiked, toggleLike, isPostSaved, toggleSave } = usePosts();
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [detailPostId, setDetailPostId] = useState<string | null>(null);

  const myPosts = user ? posts.filter((p) => p.userId === user.id) : [];
  const sortedPosts = [...myPosts].sort(
    (a, b) => Number(pinnedIds.has(b.id)) - Number(pinnedIds.has(a.id))
  );
  const detailPost = posts.find((p) => p.id === detailPostId) ?? null;

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-4">
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <TabButton
          label="My デトルフ（コレクション棚）"
          isActive={activeTab === "shelf"}
          onClick={() => setActiveTab("shelf")}
        />
        <TabButton
          label="投稿一覧"
          isActive={activeTab === "posts"}
          onClick={() => setActiveTab("posts")}
        />
      </div>

      <div className="pt-4">
        {activeTab === "shelf" ? (
          <DisplayShelf />
        ) : !user ? (
          <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
            ログインすると自分の投稿が表示されます
          </p>
        ) : sortedPosts.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
            まだ投稿がありません
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {sortedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={{ ...post, isPinned: pinnedIds.has(post.id) }}
                onTogglePin={() => togglePin(post.id)}
                isLiked={isPostLiked(post.id)}
                onToggleLike={() => toggleLike(post.id)}
                isSaved={isPostSaved(post.id)}
                onToggleSave={() => toggleSave(post.id)}
                onOpenDetail={() => setDetailPostId(post.id)}
              />
            ))}
          </div>
        )}
      </div>

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

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 border-b-2 px-3 py-3 text-center text-sm font-medium transition ${
        isActive
          ? "border-pink-600 text-pink-600 dark:text-pink-400"
          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      }`}
    >
      {label}
    </button>
  );
}
