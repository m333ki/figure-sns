"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Copy, LayoutGrid, Rows3, Search as SearchIcon, X } from "lucide-react";
import PostCard from "@/components/PostCard";
import PostDetailModal from "@/components/PostDetailModal";
import UserAvatar from "@/components/UserAvatar";
import { usePosts } from "@/context/PostsContext";
import { useAuth } from "@/context/AuthContext";
import { normalizeSearchQuery } from "@/lib/hashtags";
import { searchProfiles, type Profile } from "@/lib/profiles";
import { fetchMyShelf } from "@/lib/shelfFigures";
import type { Post, ShelfItem } from "@/types";

type ResultTab = "top" | "latest" | "users" | "displays";
type LayoutMode = "grid" | "timeline";

function matchesQuery(post: Post, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  return [post.figureName, post.makerName, post.caption, post.username].some((field) =>
    field?.toLowerCase().includes(normalizedQuery)
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const { posts, loading, error, refresh, isPostLiked, toggleLike, isPostSaved, toggleSave } =
    usePosts();
  const { user } = useAuth();

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  // Re-syncs when a hashtag link (or browser back/forward) changes the URL
  // out from under an already-mounted page -- typing itself never writes
  // back to the URL, so this can't fight the user's own input. Adjusting
  // state during render (React's documented pattern for this) rather than
  // in an effect avoids an extra post-commit re-render.
  const [syncedSearchParams, setSyncedSearchParams] = useState(searchParams);
  if (searchParams !== syncedSearchParams) {
    setSyncedSearchParams(searchParams);
    setQuery(searchParams.get("q") ?? "");
  }

  const [activeTab, setActiveTab] = useState<ResultTab>("top");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const detailPost = posts.find((p) => p.id === detailPostId) ?? null;

  const trimmedQuery = query.trim();
  const normalizedQuery = normalizeSearchQuery(query).toLowerCase();

  const matchedPosts = useMemo(
    () => posts.filter((post) => matchesQuery(post, normalizedQuery)),
    [posts, normalizedQuery]
  );
  const topPosts = useMemo(
    () =>
      [...matchedPosts].sort(
        (a, b) => b.likeCount * 2 + b.commentCount - (a.likeCount * 2 + a.commentCount)
      ),
    [matchedPosts]
  );
  // Already latest-first: fetchPosts orders by created_at desc and new
  // posts are prepended, so no separate sort is needed here.
  const latestPosts = matchedPosts;
  const postsForActiveTab = activeTab === "latest" ? latestPosts : topPosts;

  // Kept rather than cleared when the tab/query stops matching -- the
  // derived `visibleUserResults` below hides them instead, so a debounced
  // fetch in flight has no earlier synchronous reset to race against.
  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  useEffect(() => {
    if (activeTab !== "users" || !normalizedQuery) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      setUsersLoading(true);
      setUsersError(null);
      searchProfiles(normalizedQuery)
        .then((results) => {
          if (!cancelled) setUserResults(results);
        })
        .catch((e) => {
          if (!cancelled) {
            setUsersError(e instanceof Error ? e.message : "ユーザーの検索に失敗しました");
          }
        })
        .finally(() => {
          if (!cancelled) setUsersLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeTab, normalizedQuery]);
  const visibleUserResults = normalizedQuery ? userResults : [];

  // fetchMyShelf() itself resolves to an all-null shelf when logged out, so
  // this can run unconditionally rather than branching on `user` with an
  // early synchronous reset.
  const [shelf, setShelf] = useState<(ShelfItem | null)[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchMyShelf().then((data) => {
      if (!cancelled) setShelf(data);
    });
    return () => {
      cancelled = true;
    };
    // user?.id (not `user`): see the matching comment in mypage/page.tsx --
    // the object reference churns on every auth event (e.g. background
    // token refresh), which would otherwise re-fetch the shelf needlessly.
  }, [user?.id]);
  const matchedShelfItems = useMemo(() => {
    if (!shelf || !normalizedQuery) return [];
    return shelf
      .map((item, slotIndex) => ({ item, slotIndex }))
      .filter(
        (entry): entry is { item: ShelfItem; slotIndex: number } =>
          !!entry.item && !!entry.item.figureName?.toLowerCase().includes(normalizedQuery)
      );
  }, [shelf, normalizedQuery]);

  return (
    <div className="mx-auto w-full px-4 py-6">
      <div className="relative mb-4">
        <SearchIcon
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="フィギュア名・メーカー名・ハッシュタグで検索"
          className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 outline-none transition focus:border-pink-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="検索をクリア"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="mb-4 flex border-b border-gray-200 dark:border-gray-800">
        <SearchTabButton label="話題" isActive={activeTab === "top"} onClick={() => setActiveTab("top")} />
        <SearchTabButton label="最新" isActive={activeTab === "latest"} onClick={() => setActiveTab("latest")} />
        <SearchTabButton label="ユーザー" isActive={activeTab === "users"} onClick={() => setActiveTab("users")} />
        <SearchTabButton
          label="Myデトルフ"
          isActive={activeTab === "displays"}
          onClick={() => setActiveTab("displays")}
        />
      </div>

      {(activeTab === "top" || activeTab === "latest") && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {trimmedQuery ? `検索結果（${postsForActiveTab.length}件）` : "投稿一覧"}
            </h2>
            <div className="flex shrink-0 gap-1 rounded-full border border-gray-200 p-0.5 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setLayoutMode("grid")}
                aria-label="グリッド表示"
                aria-pressed={layoutMode === "grid"}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                  layoutMode === "grid"
                    ? "bg-pink-600 text-white"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("timeline")}
                aria-label="タイムライン表示"
                aria-pressed={layoutMode === "timeline"}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                  layoutMode === "timeline"
                    ? "bg-pink-600 text-white"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
              >
                <Rows3 size={14} />
              </button>
            </div>
          </div>

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
          ) : postsForActiveTab.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
              該当する投稿が見つかりませんでした
            </p>
          ) : layoutMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {postsForActiveTab.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setDetailPostId(post.id)}
                  className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                >
                  <Image
                    src={post.imageUrls[0]}
                    alt={post.figureName ?? post.username}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                  />
                  {post.imageUrls.length > 1 && (
                    <Copy
                      size={16}
                      className="absolute right-1.5 top-1.5 text-white drop-shadow"
                      strokeWidth={2}
                    />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {postsForActiveTab.map((post) => (
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
        </>
      )}

      {activeTab === "users" && (
        <div>
          {!normalizedQuery ? (
            <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
              ユーザー名を入力して検索してください
            </p>
          ) : usersLoading ? (
            <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
              読み込み中...
            </p>
          ) : usersError ? (
            <p className="py-12 text-center text-sm text-red-500 dark:text-red-400">{usersError}</p>
          ) : visibleUserResults.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
              該当するユーザーが見つかりませんでした
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {visibleUserResults.map((profile) => (
                <li key={profile.userId}>
                  <Link
                    href={
                      user && profile.userId === user.id
                        ? "/mypage"
                        : `/u/${profile.userId}?username=${encodeURIComponent(profile.username)}`
                    }
                    className="flex items-center gap-3 py-3 transition hover:opacity-80"
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <UserAvatar src={profile.avatarUrl} alt={profile.username} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {profile.displayName}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        @{profile.username}
                      </p>
                      {profile.bio && (
                        <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                          {profile.bio}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === "displays" && (
        <div>
          {!user ? (
            <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
              ログインすると自分のMyデトルフを検索できます
            </p>
          ) : !normalizedQuery ? (
            <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
              検索キーワードを入力すると、Myデトルフ内の一致するフィギュアを表示します
            </p>
          ) : shelf === null ? (
            <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
              読み込み中...
            </p>
          ) : matchedShelfItems.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
              自分のMyデトルフに一致するフィギュアが見つかりませんでした
            </p>
          ) : (
            <div>
              <p className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
                Myデトルフ内の一致（{matchedShelfItems.length}件）
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {matchedShelfItems.map(({ item, slotIndex }) => (
                  <Link
                    key={item.id}
                    href="/mypage"
                    className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-50 ring-2 ring-pink-500 transition hover:ring-pink-400 dark:bg-gray-900"
                  >
                    <Image
                      src={item.backgroundRemoved ? item.imageUrl : (item.originalImageUrl ?? item.imageUrl)}
                      alt={item.figureName ?? "フィギュア"}
                      fill
                      sizes="(max-width: 640px) 33vw, 160px"
                      className="object-contain object-bottom p-1"
                      style={{
                        transform: `scale(${item.displayScale})`,
                        transformOrigin: "center bottom",
                      }}
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-4">
                      <p className="truncate text-[10px] font-medium text-white">{item.figureName}</p>
                      <p className="truncate text-[9px] text-white/70">
                        {Math.floor(slotIndex / 3) + 1}段目
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
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

function SearchTabButton({
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
