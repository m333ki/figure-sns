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
  deletePost as deletePostRequest,
  type CreatePostInput,
} from "@/lib/posts";
import { likePost, unlikePost } from "@/lib/likes";
import { getLikedPostIds, setPostLiked } from "@/lib/likedPosts";
import { getSavedPostIds, setPostSaved } from "@/lib/savedPosts";
import { useAuth } from "@/context/AuthContext";

type PostsContextValue = {
  posts: Post[];
  loading: boolean;
  error: string | null;
  createPost: (input: CreatePostInput) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  refresh: () => Promise<void>;
  isPostLiked: (postId: string) => boolean;
  toggleLike: (postId: string) => Promise<void>;
  isPostSaved: (postId: string) => boolean;
  toggleSave: (postId: string) => void;
  incrementCommentCount: (postId: string, delta?: number) => void;
};

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const { user, username, promptLogin } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() =>
    getLikedPostIds()
  );
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(() =>
    getSavedPostIds()
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

  const createPost = useCallback(
    async (input: CreatePostInput) => {
      if (!user) throw new Error("ログインが必要です");
      const newPost = await createPostRequest(input);
      setPosts((prev) => [newPost, ...prev]);
    },
    // user?.id (not `user`): keeps this reference stable across auth events
    // that don't actually change who's logged in (e.g. token refresh), like
    // the other fixes of this kind in this session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      const snapshot = posts;
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      try {
        await deletePostRequest(postId);
      } catch (e) {
        setPosts(snapshot);
        throw e;
      }
    },
    [posts]
  );

  const isPostLiked = useCallback(
    (postId: string) => likedPostIds.has(postId),
    [likedPostIds]
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!user) {
        promptLogin();
        return;
      }
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
        if (currentlyLiked) {
          await unlikePost(postId);
        } else {
          await likePost(postId, username ?? "unknown");
        }
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
    [likedPostIds, user, username, promptLogin]
  );

  const isPostSaved = useCallback(
    (postId: string) => savedPostIds.has(postId),
    [savedPostIds]
  );

  const toggleSave = useCallback(
    (postId: string) => {
      if (!user) {
        promptLogin();
        return;
      }
      setSavedPostIds((prev) => {
        const currentlySaved = prev.has(postId);
        const next = new Set(prev);
        if (currentlySaved) next.delete(postId);
        else next.add(postId);
        setPostSaved(postId, !currentlySaved);
        return next;
      });
    },
    [user, promptLogin]
  );

  const incrementCommentCount = useCallback((postId: string, delta: number = 1) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, commentCount: Math.max(0, p.commentCount + delta) }
          : p
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
        deletePost,
        refresh,
        isPostLiked,
        toggleLike,
        isPostSaved,
        toggleSave,
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
