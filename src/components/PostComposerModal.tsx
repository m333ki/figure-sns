"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { usePosts } from "@/context/PostsContext";
import { MAX_POST_IMAGES } from "@/lib/posts";

type PickedImage = { id: string; file: File; previewUrl: string };

export default function PostComposerModal({ onClose }: { onClose: () => void }) {
  const { createPost } = usePosts();
  const [images, setImages] = useState<PickedImage[]>([]);
  const [figureName, setFigureName] = useState("");
  const [makerName, setMakerName] = useState("");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    // Revoke every still-live preview URL on unmount only — individual
    // removals revoke their own URL immediately (see handleRemoveImage).
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = images.length > 0 && !submitting;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selected.length === 0) return;

    setImages((prev) => {
      const room = MAX_POST_IMAGES - prev.length;
      const accepted = selected.slice(0, Math.max(0, room));
      const next = accepted.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...next];
    });
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleMoveImage = (index: number, direction: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const swapWith = index + direction;
      if (swapWith < 0 || swapWith >= next.length) return prev;
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await createPost({
        figureName: figureName.trim() || null,
        makerName: makerName.trim() || null,
        caption: caption.trim() || null,
        files: images.map((img) => img.file),
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "投稿に失敗しました。もう一度お試しください。"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="投稿する"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">投稿する</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              画像（最大{MAX_POST_IMAGES}枚）
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {images.length}/{MAX_POST_IMAGES}
            </p>
          </div>
          <div className="mb-4">
            {images.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-56 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-gray-400 transition hover:border-pink-300 hover:text-pink-500 dark:border-gray-700 dark:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-xs">画像を選択</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, i) => (
                  <div
                    key={img.id}
                    className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                  >
                    <Image
                      src={img.previewUrl}
                      alt={`選択した画像 ${i + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        メイン
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      aria-label="画像を削除"
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 flex justify-between p-1">
                      <button
                        type="button"
                        onClick={() => handleMoveImage(i, -1)}
                        disabled={i === 0}
                        aria-label="左に移動"
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 disabled:invisible"
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveImage(i, 1)}
                        disabled={i === images.length - 1}
                        aria-label="右に移動"
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 disabled:invisible"
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {images.length < MAX_POST_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="画像を追加"
                    className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400 transition hover:border-pink-300 hover:text-pink-500 dark:border-gray-700 dark:text-gray-500"
                  >
                    <Plus size={22} />
                  </button>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="mt-2 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
              ※自分で撮影した写真のみ投稿してください（公式画像の無断転載禁止）
            </p>
          </div>

          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400" htmlFor="post-figure-name">
            フィギュア名（任意）
          </label>
          <input
            id="post-figure-name"
            type="text"
            value={figureName}
            onChange={(e) => setFigureName(e.target.value)}
            maxLength={100}
            placeholder="例: 初音ミク Birthday 2023 Ver."
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 dark:border-gray-700 dark:text-gray-100"
          />

          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400" htmlFor="post-maker-name">
            メーカー名（任意）
          </label>
          <input
            id="post-maker-name"
            type="text"
            value={makerName}
            onChange={(e) => setMakerName(e.target.value)}
            maxLength={100}
            placeholder="例: グッドスマイルカンパニー"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 dark:border-gray-700 dark:text-gray-100"
          />

          <label className="mb-1 mt-4 block text-xs font-medium text-gray-500 dark:text-gray-400" htmlFor="post-caption">
            キャプション（任意）
          </label>
          <textarea
            id="post-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="コメントを添えて投稿しよう"
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 dark:border-gray-700 dark:text-gray-100"
          />
          <p className="mt-1 text-right text-[11px] text-gray-400 dark:text-gray-500">{caption.length}/200</p>

          {errorMessage && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>}
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-gray-300 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 rounded-full bg-pink-600 py-2 text-sm font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "投稿中..." : "投稿する"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
