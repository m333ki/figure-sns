"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronLeft, ChevronRight, FileText, Lock, LogOut, Mail, Shield, Sun, Moon, Monitor } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchIsAdmin } from "@/lib/admin";

const THEME_OPTIONS = [
  { value: "light", label: "ライト", icon: Sun },
  { value: "dark", label: "ダーク", icon: Moon },
  { value: "system", label: "システム", icon: Monitor },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const { user, username, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchIsAdmin(user.id)
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
    // user?.id (not `user`): see the matching comment in mypage/page.tsx --
    // the object reference churns on every auth event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    // Gates rendering the active theme option until after hydration --
    // useTheme()'s `theme` is only known client-side (it reads localStorage),
    // so using it during SSR/first paint would mismatch the server markup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!loading && !user) {
    return (
      <p className="py-24 text-center text-sm text-muted">
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
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={() => router.push("/mypage")}
          aria-label="戻る"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-base font-semibold text-foreground">設定</h1>
      </div>

      <div className="px-4 py-6">
        <p className="mb-2 px-1 text-xs font-medium text-muted">
          表示
        </p>
        <div className="mb-6 overflow-hidden rounded-xl border border-border">
          <div className="px-4 py-3">
            <p className="mb-2.5 text-sm text-muted">テーマ</p>
            <div
              className="grid grid-cols-3 gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800"
              role="radiogroup"
              aria-label="テーマ"
            >
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                const active = mounted && theme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTheme(value)}
                    className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium transition ${
                      active
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mb-2 px-1 text-xs font-medium text-muted">
          アカウント
        </p>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border px-4 py-3 text-sm text-muted">
            ログイン中: <span className="text-foreground">{username}</span>
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

        <p className="mb-2 mt-6 px-1 text-xs font-medium text-muted">
          サポート
        </p>
        <div className="overflow-hidden rounded-xl border border-border">
          <Link
            href="/contact"
            className="flex items-center justify-between border-b border-border px-4 py-3 text-sm text-foreground transition hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            <span className="flex items-center gap-2">
              <Mail size={16} className="text-muted" />
              お問い合わせ・ご要望（カスタマーサポート）
            </span>
            <ChevronRight size={16} className="text-muted" />
          </Link>
          <Link
            href="/terms"
            className="flex items-center justify-between border-b border-border px-4 py-3 text-sm text-foreground transition hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            <span className="flex items-center gap-2">
              <FileText size={16} className="text-muted" />
              利用規約
            </span>
            <ChevronRight size={16} className="text-muted" />
          </Link>
          <Link
            href="/privacy"
            className="flex items-center justify-between px-4 py-3 text-sm text-foreground transition hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            <span className="flex items-center gap-2">
              <Lock size={16} className="text-muted" />
              プライバシーポリシー
            </span>
            <ChevronRight size={16} className="text-muted" />
          </Link>
        </div>

        {isAdmin && (
          <>
            <p className="mb-2 mt-6 px-1 text-xs font-medium text-muted">
              管理
            </p>
            <div className="overflow-hidden rounded-xl border border-border">
              <Link
                href="/admin"
                className="flex items-center justify-between px-4 py-3 text-sm text-foreground transition hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <span className="flex items-center gap-2">
                  <Shield size={16} className="text-muted" />
                  通報管理
                </span>
                <ChevronRight size={16} className="text-muted" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
