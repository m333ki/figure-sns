"use client";

import { useEffect, useRef, useState } from "react";
import { UserProfile } from "@/types";
import { Profile, updateMyProfile, uploadAvatarImage } from "@/lib/profiles";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/UserAvatar";

export default function EditProfileModal({
  profile,
  onSaved,
  onClose,
}: {
  profile: UserProfile;
  onSaved: (profile: Profile) => void;
  onClose: () => void;
}) {
  const { user, username } = useAuth();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl);
  // Separate from avatarPreview (a display-only blob: URL once a new file is
  // picked) because the preview string itself can't be re-uploaded — the
  // actual File has to be kept around until save.
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const canSave = displayName.trim().length > 0 && !saving;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSave = async () => {
    if (!canSave || !user) return;
    setSaving(true);
    setError(null);
    try {
      const avatarUrl = avatarFile ? await uploadAvatarImage(avatarFile) : avatarPreview;
      const saved = await updateMyProfile(user.id, username ?? "unknown", {
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl,
      });
      onSaved(saved);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={saving ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="プロフィールを編集"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            プロフィールを編集
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="閉じる"
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}

          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">アイコン</p>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <UserAvatar src={avatarPreview} alt={displayName} />
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                画像を選択
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={saving}
                  className="text-xs text-gray-400 underline-offset-2 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  画像を削除
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <label
            className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
            htmlFor="edit-display-name"
          >
            表示名
          </label>
          <input
            id="edit-display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={30}
            disabled={saving}
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 disabled:opacity-60 dark:border-gray-700 dark:text-gray-100"
          />

          <label
            className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
            htmlFor="edit-bio"
          >
            自己紹介
          </label>
          <textarea
            id="edit-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            disabled={saving}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 disabled:opacity-60 dark:border-gray-700 dark:text-gray-100"
          />
          <p className="mt-1 text-right text-[11px] text-gray-400 dark:text-gray-500">
            {bio.length}/160
          </p>
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-full border border-gray-300 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 rounded-full bg-pink-600 py-2 text-sm font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
