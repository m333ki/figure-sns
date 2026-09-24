"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { UserProfile } from "@/types";
import { Profile } from "@/lib/profiles";
import EditProfileModal from "@/components/mypage/EditProfileModal";
import UserAvatar from "@/components/UserAvatar";

export default function ProfileHeader({
  profile,
  onSaved,
}: {
  profile: UserProfile;
  onSaved: (profile: Profile) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <section className="border-b border-gray-200 bg-white px-4 py-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-4xl items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-200 ring-2 ring-pink-100 sm:h-24 sm:w-24 dark:bg-gray-700 dark:ring-pink-900/40">
          <UserAvatar src={profile.avatarUrl} alt={profile.username} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {profile.displayName}
            </h1>
            <span className="text-sm text-gray-400 dark:text-gray-500">@{profile.username}</span>
          </div>

          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{profile.bio}</p>

          <dl className="mt-3 flex gap-5 text-sm">
            <div className="flex items-baseline gap-1">
              <dd className="font-semibold text-gray-900 dark:text-gray-100">
                {profile.postCount}
              </dd>
              <dt className="text-gray-500 dark:text-gray-400">投稿</dt>
            </div>
            <div className="flex items-baseline gap-1">
              <dd className="font-semibold text-gray-900 dark:text-gray-100">
                {profile.followerCount}
              </dd>
              <dt className="text-gray-500 dark:text-gray-400">フォロワー</dt>
            </div>
            <div className="flex items-baseline gap-1">
              <dd className="font-semibold text-gray-900 dark:text-gray-100">
                {profile.followingCount}
              </dd>
              <dt className="text-gray-500 dark:text-gray-400">フォロー中</dt>
            </div>
          </dl>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            編集
          </button>
          <Link
            href="/settings"
            aria-label="設定"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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
    </section>
  );
}
