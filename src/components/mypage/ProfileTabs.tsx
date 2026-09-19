"use client";

import { useState } from "react";
import { Post, ShelfItem } from "@/types";
import DisplayShelf from "@/components/mypage/DisplayShelf";
import PostCard from "@/components/PostCard";

type Tab = "shelf" | "posts";

export default function ProfileTabs({
  shelfSlots,
  figureCatalog,
  posts,
}: {
  shelfSlots: (ShelfItem | null)[];
  figureCatalog: ShelfItem[];
  posts: Post[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("shelf");
  const [myPosts, setMyPosts] = useState<Post[]>(posts);

  const togglePin = (id: string) => {
    setMyPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPinned: !p.isPinned } : p))
    );
  };

  const sortedPosts = [...myPosts].sort(
    (a, b) => Number(!!b.isPinned) - Number(!!a.isPinned)
  );

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
          <DisplayShelf initialSlots={shelfSlots} catalog={figureCatalog} />
        ) : sortedPosts.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
            まだ投稿がありません
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {sortedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onTogglePin={() => togglePin(post.id)}
              />
            ))}
          </div>
        )}
      </div>
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
      className={`flex-1 border-b-2 px-2 py-3 text-center text-sm font-medium transition ${
        isActive
          ? "border-pink-600 text-pink-600 dark:text-pink-400"
          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      }`}
    >
      {label}
    </button>
  );
}
