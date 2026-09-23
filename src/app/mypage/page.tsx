"use client";

import { useEffect, useState } from "react";
import ProfileHeader from "@/components/mypage/ProfileHeader";
import ProfileTabs from "@/components/mypage/ProfileTabs";
import { fetchProfile, Profile } from "@/lib/profiles";
import { fetchFollowCounts } from "@/lib/follows";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostsContext";
import { UserProfile } from "@/types";

export default function MyPage() {
  const { user, username, loading: authLoading } = useAuth();
  const { posts } = usePosts();

  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [profileResult, counts] = await Promise.all([
          fetchProfile(user.id),
          fetchFollowCounts(user.id),
        ]);
        if (cancelled) return;
        setProfileData(profileResult);
        setFollowerCount(counts.followerCount);
        setFollowingCount(counts.followingCount);
      } catch (e) {
        console.error("プロフィールの取得に失敗しました", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
    // user?.id (not `user`): supabase-js gives AuthContext a new session/
    // user object on every auth event, including background token
    // refreshes -- depending on the object itself re-ran this (flashing
    // the whole page back to "読み込み中...") whenever one of those fired
    // while already on this page, not just on actual login/logout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!authLoading && !user) {
    return (
      <p className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">
        ログインが必要です
      </p>
    );
  }

  if (authLoading || loading || !user) {
    return (
      <p className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">
        読み込み中...
      </p>
    );
  }

  const postCount = posts.filter((p) => p.userId === user.id).length;
  const resolvedUsername = username ?? "unknown";

  const profile: UserProfile = {
    username: resolvedUsername,
    displayName: profileData?.displayName ?? resolvedUsername,
    bio: profileData?.bio ?? "",
    avatarUrl: profileData?.avatarUrl ?? null,
    postCount,
    followerCount,
    followingCount,
  };

  return (
    <div>
      <ProfileHeader profile={profile} onSaved={setProfileData} />
      <ProfileTabs />
    </div>
  );
}
