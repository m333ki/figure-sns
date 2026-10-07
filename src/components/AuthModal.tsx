"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "signup";

function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "メールアドレスまたはパスワードが違います。";
  }
  if (message.includes("User already registered")) {
    return "このメールアドレスは既に登録されています。";
  }
  if (message.includes("Password should be at least")) {
    return "パスワードは6文字以上で入力してください。";
  }
  if (message.includes("Unable to validate email address")) {
    return "メールアドレスの形式が正しくありません。";
  }
  if (message.includes("Email not confirmed")) {
    return "メールアドレスが未確認です。届いたメール内のリンクから確認を完了してください。";
  }
  return message;
}

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, signUp, signIn, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetAndClose = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setErrorMessage(null);
    setConfirmationSent(false);
    setShowPassword(false);
    setMode("login");
    closeAuthModal();
  };

  useEffect(() => {
    if (!authModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") resetAndClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrorMessage(null);
  };

  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    (mode === "login" || username.trim().length > 0) &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
      } else {
        const { needsEmailConfirmation } = await signUp(
          email.trim(),
          password,
          username.trim()
        );
        if (needsEmailConfirmation) {
          setConfirmationSent(true);
          setSubmitting(false);
          return;
        }
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? translateAuthError(err.message)
          : "エラーが発生しました。もう一度お試しください。"
      );
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleSubmitting(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      // No further state update here -- a successful call navigates the
      // whole page away to Google, so this component is about to unmount.
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? translateAuthError(err.message)
          : "エラーが発生しました。もう一度お試しください。"
      );
      setGoogleSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "login" ? "ログイン" : "新規登録"}
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            {mode === "login" ? "ログイン" : "新規登録"}
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="閉じる"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {confirmationSent ? (
          <div className="p-4">
            <p className="text-sm text-muted">
              確認メールを送信しました。メール内のリンクをクリックすると登録が完了します。
            </p>
            <button
              type="button"
              onClick={resetAndClose}
              className="mt-4 w-full rounded-full bg-accent py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90"
            >
              閉じる
            </button>
          </div>
        ) : (
          <>
            <div className="p-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleSubmitting || submitting}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 py-2 text-sm font-medium text-foreground transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <GoogleIcon />
                {googleSubmitting ? "処理中..." : "Googleでログイン"}
              </button>

              <div className="mb-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted">または</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {mode === "signup" && (
                <>
                  <label
                    className="mb-1 block text-xs font-medium text-muted"
                    htmlFor="auth-username"
                  >
                    ユーザー名
                  </label>
                  <input
                    id="auth-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={30}
                    placeholder="例: figure_taro"
                    className="mb-4 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                  />
                </>
              )}

              <label
                className="mb-1 block text-xs font-medium text-muted"
                htmlFor="auth-email"
              >
                メールアドレス
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mb-4 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />

              <label
                className="mb-1 block text-xs font-medium text-muted"
                htmlFor="auth-password"
              >
                パスワード
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  placeholder="6文字以上"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  className="w-full rounded-lg border border-border px-3 py-2 pr-10 text-sm text-foreground outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "パスワードを非表示にする" : "パスワードを表示する"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted transition hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {errorMessage && (
                <p className="mt-3 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
              )}

              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="mt-3 text-xs font-medium text-accent transition hover:underline"
              >
                {mode === "login"
                  ? "アカウントをお持ちでない方はこちら"
                  : "既にアカウントをお持ちの方はこちら"}
              </button>
            </div>

            <div className="border-t border-border px-4 py-3">
              {mode === "signup" && (
                <p className="mb-2 text-center text-[11px] text-muted">
                  🔒 パスワードは暗号化して安全に保管されます
                </p>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full rounded-full bg-accent py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "処理中..." : mode === "login" ? "ログイン" : "登録する"}
              </button>
              {mode === "signup" && (
                <p className="mt-2 text-center text-[11px] text-muted">
                  登録することで、プライバシーポリシーに同意したものとみなされます。
                  <br />
                  <Link href="/privacy" target="_blank" className="text-accent hover:underline">
                    プライバシーポリシー（/privacy）
                  </Link>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.3c-2 1.4-4.6 2.3-7.5 2.3-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.3C41.5 35.6 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
