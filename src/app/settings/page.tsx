"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const router = useRouter();
  const { user, username, loading, signOut } = useAuth();

  if (!loading && !user) {
    return (
      <p className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">
        ログインが必要です
      </p>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <button
          type="button"
          onClick={() => router.push("/mypage")}
          aria-label="戻る"
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">設定</h1>
      </div>

      <div className="px-4 py-6">
        <p className="mb-2 px-1 text-xs font-medium text-gray-400 dark:text-gray-500">
          アカウント
        </p>
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="border-b border-gray-100 px-4 py-3 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            ログイン中: <span className="text-gray-900 dark:text-gray-100">{username}</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-gray-50 dark:text-red-400 dark:hover:bg-gray-900"
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
