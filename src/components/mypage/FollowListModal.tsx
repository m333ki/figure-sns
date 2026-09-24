"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { fetchFollowers, fetchFollowing } from "@/lib/follows";
import { Profile } from "@/lib/profiles";
import UserAvatar from "@/components/UserAvatar";

export default function FollowListModal({
  userId,
  mode,
  onClose,
}: {
  userId: string;
  mode: "followers" | "following";
  onClose: () => void;
}) {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    const fetcher = mode === "followers" ? fetchFollowers : fetchFollowing;
    fetcher(userId)
      .then((result) => {
        if (!cancelled) setProfiles(result);
      })
      .catch(() => {
        if (!cancelled) setError("読み込みに失敗しました");
      });
    return () => {
      cancelled = true;
    };
  }, [userId, mode]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "followers" ? "フォロワー" : "フォロー中"}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[75vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {mode === "followers" ? "フォロワー" : "フォロー中"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {error ? (
            <p className="px-4 py-8 text-center text-sm text-red-500 dark:text-red-400">
              {error}
            </p>
          ) : profiles === null ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              読み込み中...
            </p>
          ) : profiles.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              {mode === "followers" ? "フォロワーはまだいません" : "誰もフォローしていません"}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {profiles.map((profile) => (
                <li key={profile.userId}>
                  <Link
                    href={`/u/${profile.userId}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <UserAvatar src={profile.avatarUrl} alt={profile.username} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {profile.displayName}
                      </p>
                      <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                        @{profile.username}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
