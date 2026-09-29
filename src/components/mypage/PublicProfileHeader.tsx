"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Profile } from "@/lib/profiles";
import UserAvatar from "@/components/UserAvatar";
import FollowButton from "@/components/FollowButton";
import FollowListModal from "@/components/mypage/FollowListModal";
import ReportModal from "@/components/ReportModal";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

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

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="プロフィールメニュー"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                role="menu"
                className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-red-600 transition hover:bg-gray-50 dark:text-red-400 dark:hover:bg-gray-700"
                >
                  このユーザーを報告する
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {followList && (
        <FollowListModal
          userId={profile.userId}
          mode={followList}
          onClose={() => setFollowList(null)}
        />
      )}

      {reportOpen && (
        <ReportModal targetType="user" targetId={profile.userId} onClose={() => setReportOpen(false)} />
      )}
    </section>
  );
}
