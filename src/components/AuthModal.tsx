"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const { authModalOpen, closeAuthModal, signUp, signIn } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const resetAndClose = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setErrorMessage(null);
    setConfirmationSent(false);
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

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={resetAndClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "login" ? "ログイン" : "新規登録"}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {mode === "login" ? "ログイン" : "新規登録"}
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="閉じる"
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {confirmationSent ? (
          <div className="p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              確認メールを送信しました。メール内のリンクをクリックすると登録が完了します。
            </p>
            <button
              type="button"
              onClick={resetAndClose}
              className="mt-4 w-full rounded-full bg-pink-600 py-2 text-sm font-medium text-white transition hover:bg-pink-700"
            >
              閉じる
            </button>
          </div>
        ) : (
          <>
            <div className="p-4">
              {mode === "signup" && (
                <>
                  <label
                    className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
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
                    className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 dark:border-gray-700 dark:text-gray-100"
                  />
                </>
              )}

              <label
                className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
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
                className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 dark:border-gray-700 dark:text-gray-100"
              />

              <label
                className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
                htmlFor="auth-password"
              >
                パスワード
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                placeholder="6文字以上"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 dark:border-gray-700 dark:text-gray-100"
              />

              {errorMessage && (
                <p className="mt-3 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
              )}

              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="mt-3 text-xs font-medium text-pink-600 transition hover:underline dark:text-pink-400"
              >
                {mode === "login"
                  ? "アカウントをお持ちでない方はこちら"
                  : "既にアカウントをお持ちの方はこちら"}
              </button>
            </div>

            <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full rounded-full bg-pink-600 py-2 text-sm font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "処理中..." : mode === "login" ? "ログイン" : "登録する"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
