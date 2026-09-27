"use client";

import { useState } from "react";
import { Profile } from "@/lib/profiles";
import UserAvatar from "@/components/UserAvatar";
import FollowButton from "@/components/FollowButton";
import FollowListModal from "@/components/mypage/FollowListModal";

export default function PublicProfileHeader({
  profile,
  postCount,
  followerCount,
  followingCount,
  isFollowing,
  onFollowChange,
}: {
  profile: Profile;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  onFollowChange?: (nowFollowing: boolean) => void;
}) {
  const [followList, setFollowList] = useState<"followers" | "following" | null>(null);

  return (
    <section className="border-b border-border bg-card px-4 py-6">
      <div className="mx-auto flex max-w-4xl items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-200 ring-2 ring-accent/20 sm:h-24 sm:w-24 dark:bg-gray-700">
          <UserAvatar src={profile.avatarUrl} alt={profile.displayName} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">
              {profile.displayName}
            </h1>
            <span className="text-sm text-muted">@{profile.username}</span>
          </div>

          {profile.bio && (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted">{profile.bio}</p>
          )}

          <dl className="mt-3 flex gap-5 text-sm">
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <dd className="font-semibold text-foreground">{postCount}</dd>
              <dt className="text-muted">投稿</dt>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setFollowList("followers")}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                setFollowList("followers");
              }}
              className="flex cursor-pointer items-baseline gap-1 whitespace-nowrap hover:underline"
            >
              <dd className="font-semibold text-foreground">{followerCount}</dd>
              <dt className="text-muted">フォロワー</dt>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setFollowList("following")}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                setFollowList("following");
              }}
              className="flex cursor-pointer items-baseline gap-1 whitespace-nowrap hover:underline"
            >
              <dd className="font-semibold text-foreground">{followingCount}</dd>
              <dt className="text-muted">フォロー中</dt>
            </div>
          </dl>
        </div>

        <FollowButton
          targetUserId={profile.userId}
          initialIsFollowing={isFollowing}
          onChange={onFollowChange}
        />
      </div>

      {followList && (
        <FollowListModal
          userId={profile.userId}
          mode={followList}
          onClose={() => setFollowList(null)}
        />
      )}
    </section>
  );
}
