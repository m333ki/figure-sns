"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { UserProfile } from "@/types";
import { Profile } from "@/lib/profiles";
import { useAuth } from "@/context/AuthContext";
import EditProfileModal from "@/components/mypage/EditProfileModal";
import FollowListModal from "@/components/mypage/FollowListModal";
import UserAvatar from "@/components/UserAvatar";

export default function ProfileHeader({
  profile,
  onSaved,
}: {
  profile: UserProfile;
  onSaved: (profile: Profile) => void;
}) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [followList, setFollowList] = useState<"followers" | "following" | null>(null);

  return (
    <section className="border-b border-border bg-card px-4 py-6">
      <div className="mx-auto flex max-w-4xl items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-200 ring-2 ring-accent/20 sm:h-24 sm:w-24 dark:bg-gray-700">
          <UserAvatar src={profile.avatarUrl} alt={profile.username} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">
              {profile.displayName}
            </h1>
            <span className="text-sm text-muted">@{profile.username}</span>
          </div>

          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted">{profile.bio}</p>

          <dl className="mt-3 flex gap-5 text-sm">
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <dd className="font-semibold text-foreground">
                {profile.postCount}
              </dd>
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
              <dd className="font-semibold text-foreground">
                {profile.followerCount}
              </dd>
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
              <dd className="font-semibold text-foreground">
                {profile.followingCount}
              </dd>
              <dt className="text-muted">フォロー中</dt>
            </div>
          </dl>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-muted transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            編集
          </button>
          <Link
            href="/settings"
            aria-label="設定"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-muted transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <Settings size={16} />
          </Link>
        </div>
      </div>

      {editing && (
        <EditProfileModal
          profile={profile}
          onSaved={onSaved}
          onClose={() => setEditing(false)}
        />
      )}

      {followList && user && (
        <FollowListModal
          userId={user.id}
          mode={followList}
          onClose={() => setFollowList(null)}
        />
      )}
    </section>
  );
}
