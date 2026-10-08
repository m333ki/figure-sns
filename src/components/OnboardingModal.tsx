"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Profile,
  isUsernameTaken,
  isValidUsernameFormat,
  updateMyProfile,
  uploadAvatarImage,
} from "@/lib/profiles";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/UserAvatar";

export default function OnboardingModal({
  userId,
  initialDisplayName,
  initialAvatarUrl,
  onComplete,
}: {
  userId: string;
  initialDisplayName: string;
  initialAvatarUrl: string | null;
  onComplete: (profile: Profile) => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarPreview, setAvatarPreview] = useState(initialAvatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSave = displayName.trim().length > 0 && username.trim().length > 0 && !saving;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!canSave || !user) return;
    const trimmedUsername = username.trim();
    if (!isValidUsernameFormat(trimmedUsername)) {
      setError("ユーザーIDは半角英数字・.・_のみ、3〜20文字で入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const taken = await isUsernameTaken(trimmedUsername, userId);
      if (taken) {
        setError("このユーザーIDは既に使われています");
        setSaving(false);
        return;
      }
      const avatarUrl = avatarFile ? await uploadAvatarImage(avatarFile) : avatarPreview;
      const saved = await updateMyProfile(userId, trimmedUsername, {
        displayName: displayName.trim(),
        bio: "",
        avatarUrl,
      });
      onComplete(saved);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="プロフィール設定"
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card shadow-xl"
      >
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            ようこそ！プロフィールを設定しましょう
          </h2>
          <p className="mt-1 text-xs text-muted">
            ユーザーIDはあとからいつでも変更できます。
          </p>
        </div>

        <div className="overflow-y-auto p-4">
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}

          <p className="mb-2 text-xs font-medium text-muted">アイコン</p>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <UserAvatar src={avatarPreview} alt={displayName} />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              画像を選択
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <label
            className="mb-1 block text-xs font-medium text-muted"
            htmlFor="onboarding-username"
          >
            ユーザーID <span className="text-red-500">*</span>
          </label>
          <div className="mb-4 flex items-center rounded-lg border border-border focus-within:border-accent">
            <span className="pl-3 text-sm text-muted">@</span>
            <input
              id="onboarding-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              disabled={saving}
              placeholder="例: figure_taro"
              className="w-full rounded-lg bg-transparent py-2 pl-1 pr-3 text-sm text-foreground outline-none disabled:opacity-60"
            />
          </div>

          <label
            className="mb-1 block text-xs font-medium text-muted"
            htmlFor="onboarding-display-name"
          >
            表示名
          </label>
          <input
            id="onboarding-display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={30}
            disabled={saving}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent disabled:opacity-60"
          />
        </div>

        <div className="border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="w-full rounded-full bg-accent py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "保存中..." : "はじめる"}
          </button>
        </div>
      </div>
    </div>
  );
}
