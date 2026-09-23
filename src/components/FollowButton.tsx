"use client";

import { useState } from "react";
import { followUser, unfollowUser } from "@/lib/follows";
import { useAuth } from "@/context/AuthContext";

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  onChange,
}: {
  targetUserId: string;
  initialIsFollowing: boolean;
  onChange?: (nowFollowing: boolean) => void;
}) {
  const { user, promptLogin } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    if (!user) {
      promptLogin();
      return;
    }
    const next = !isFollowing;
    setIsFollowing(next);
    onChange?.(next);
    setPending(true);
    try {
      if (next) {
        await followUser(targetUserId);
      } else {
        await unfollowUser(targetUserId);
      }
    } catch (e) {
      setIsFollowing(!next);
      onChange?.(!next);
      console.error(e);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={isFollowing}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
        isFollowing
          ? "border border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          : "bg-pink-600 text-white hover:bg-pink-700"
      }`}
    >
      {isFollowing ? "フォロー中" : "フォローする"}
    </button>
  );
}
