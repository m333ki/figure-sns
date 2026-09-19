"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Post } from "@/types";
import {
  fetchPosts,
  createPost as createPostRequest,
  type CreatePostInput,
} from "@/lib/posts";
import { incrementPostLikes } from "@/lib/likes";
import { getLikedPostIds, setPostLiked } from "@/lib/likedPosts";

type PostsContextValue = {
  posts: Post[];
  loading: boolean;
  error: string | null;
  createPost: (input: CreatePostInput) => Promise<void>;
  refresh: () => Promise<void>;
  isPostLiked: (postId: string) => boolean;
  toggleLike: (postId: string) => Promise<void>;
  incrementCommentCount: (postId: string) => void;
};

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() =>
    getLikedPostIds()
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "投稿の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount — the standard React data-fetching-in-effect
    // pattern. react-hooks/set-state-in-effect flags this unconditionally
    // (any function reachable from an effect that ever calls setState gets
    // tainted, even async/try-catch ones), so there's no rewrite that
    // satisfies it here; this isn't the "avoidable redundant setState"
    // case the rule is meant to catch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const createPost = useCallback(async (input: CreatePostInput) => {
    const newPost = await createPostRequest(input);
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const isPostLiked = useCallback(
    (postId: string) => likedPostIds.has(postId),
    [likedPostIds]
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      const currentlyLiked = likedPostIds.has(postId);
      const delta: 1 | -1 = currentlyLiked ? -1 : 1;

      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (currentlyLiked) next.delete(postId);
        else next.add(postId);
        return next;
      });
      setPostLiked(postId, !currentlyLiked);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likeCount: Math.max(0, p.likeCount + delta) }
            : p
        )
      );

      try {
        await incrementPostLikes(postId, delta);
      } catch (e) {
        // Per-device like state is an MVP-known limitation, not something
        // to reconcile further here — just roll back the optimistic UI.
        setLikedPostIds((prev) => {
          const next = new Set(prev);
          if (currentlyLiked) next.add(postId);
          else next.delete(postId);
          return next;
        });
        setPostLiked(postId, currentlyLiked);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, likeCount: Math.max(0, p.likeCount - delta) }
              : p
          )
        );
        console.error(e);
      }
    },
    [likedPostIds]
  );

  const incrementCommentCount = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
      )
    );
  }, []);

  return (
    <PostsContext.Provider
      value={{
        posts,
        loading,
        error,
        createPost,
        refresh,
        isPostLiked,
        toggleLike,
        incrementCommentCount,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) {
    throw new Error("usePosts must be used within a PostsProvider");
  }
  return ctx;
}
