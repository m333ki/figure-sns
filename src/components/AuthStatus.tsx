"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AuthStatus({ compact = false }: { compact?: boolean }) {
  const { user, username, promptLogin, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <button
        type="button"
        onClick={promptLogin}
        className={
          compact
            ? "rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            : "mb-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-gray-300 py-2.5 text-[15px] font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        }
      >
        ログイン / 登録
      </button>
    );
  }

  return (
    <div className={compact ? "relative" : "relative mb-3"}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="アカウントメニュー"
        className={
          compact
            ? "flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 text-sm font-semibold text-pink-700 transition hover:bg-pink-200 dark:bg-pink-900/40 dark:text-pink-300"
            : "flex w-full items-center gap-2.5 rounded-full px-3 py-2 text-left transition hover:bg-gray-100 dark:hover:bg-gray-800"
        }
      >
        {compact ? (
          username?.[0]?.toUpperCase() ?? <UserIcon size={16} />
        ) : (
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-semibold text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
              {username?.[0]?.toUpperCase() ?? <UserIcon size={14} />}
            </span>
            <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {username}
            </span>
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className={`absolute z-20 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800 ${
              compact ? "right-0 top-full" : "bottom-full left-0 mb-1"
            }`}
          >
            <div className="truncate border-b border-gray-100 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {username}
            </div>
            <Link
              href="/mypage"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              プロフィール
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-gray-50 dark:text-red-400 dark:hover:bg-gray-700"
            >
              <LogOut size={14} />
              ログアウト
            </button>
          </div>
        </>
      )}
    </div>
  );
}
