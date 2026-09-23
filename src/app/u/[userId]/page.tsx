"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PublicProfileHeader from "@/components/mypage/PublicProfileHeader";
import PostCard from "@/components/PostCard";
import PostDetailModal from "@/components/PostDetailModal";
import { fetchProfile, Profile } from "@/lib/profiles";
import { fetchFollowCounts, fetchIsFollowing } from "@/lib/follows";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostsContext";

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { posts, isPostLiked, toggleLike, isPostSaved, toggleSave } = usePosts();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailPostId, setDetailPostId] = useState<string | null>(null);

  const isSelf = !!user && user.id === userId;

  useEffect(() => {
    if (isSelf) {
      router.replace("/mypage");
    }
  }, [isSelf, router]);

  useEffect(() => {
    if (isSelf) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileData, counts, following] = await Promise.all([
          fetchProfile(userId),
          fetchFollowCounts(userId),
          fetchIsFollowing(userId),
        ]);
        if (cancelled) return;
        if (!profileData) {
          setError("ユーザーが見つかりませんでした");
          return;
        }
        setProfile(profileData);
        setFollowerCount(counts.followerCount);
        setFollowingCount(counts.followingCount);
        setIsFollowing(following);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "プロフィールの取得に失敗しました");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [userId, isSelf]);

  const userPosts = posts.filter((p) => p.userId === userId);
  const detailPost = posts.find((p) => p.id === detailPostId) ?? null;

  if (isSelf || authLoading || loading) {
    return (
      <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">読み込み中...</p>
    );
  }

  if (error || !profile) {
    return (
      <p className="py-12 text-center text-sm text-red-500 dark:text-red-400">
        {error ?? "ユーザーが見つかりませんでした"}
      </p>
    );
  }

  return (
    <div>
      <PublicProfileHeader
        profile={profile}
        postCount={userPosts.length}
        followerCount={followerCount}
        followingCount={followingCount}
        isFollowing={isFollowing}
        onFollowChange={(next) =>
          setFollowerCount((prev) => Math.max(0, prev + (next ? 1 : -1)))
        }
      />

      <div className="mx-auto max-w-4xl px-4 py-4">
        {userPosts.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
            まだ投稿がありません
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {userPosts.map((post) => (
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
