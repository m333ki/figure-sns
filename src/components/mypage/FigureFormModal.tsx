"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Camera, Eraser, Plus, Wand2 } from "lucide-react";
import {
  deleteShelfFigure,
  resizeFigurePhoto,
  saveShelfFigure,
  uploadShelfFigureImage,
} from "@/lib/shelfFigures";
import { removeImageBackground } from "@/lib/backgroundRemoval";
import BackgroundMaskEditorModal from "./BackgroundMaskEditorModal";
import type { ShelfItem } from "@/types";

export default function FigureFormModal({
  slotIndex,
  existing,
  autoRemoveBackground,
  onClose,
  onSaved,
  onDeleted,
}: {
  slotIndex: number;
  existing: ShelfItem | null;
  autoRemoveBackground: boolean;
  onClose: () => void;
  onSaved: (item: ShelfItem) => void;
  onDeleted: (slotIndex: number) => void;
}) {
  const [figureName, setFigureName] = useState(existing?.figureName ?? "");
  const [makerName, setMakerName] = useState(existing?.makerName ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [price, setPrice] = useState(
    existing?.price != null ? String(existing.price) : ""
  );
  // Two parallel tracks -- the newly-picked original file/its bg-removed
  // result -- kept separate (rather than overwriting one `file` state) so
  // both can be uploaded and the toggle can switch between them without
  // re-running background removal.
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [transparentFile, setTransparentFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(
    existing?.originalImageUrl ?? null
  );
  const [transparentPreviewUrl, setTransparentPreviewUrl] = useState<string | null>(
    existing?.imageUrl ?? null
  );
  const [backgroundRemoved, setBackgroundRemoved] = useState(
    existing?.backgroundRemoved ?? false
  );
  // Display-only zoom/pan within the shelf cell -- never touches the stored
  // image, so it's plain local state saved alongside the other fields
  // rather than something the mask editor needs to know about. offsetX/Y
  // are fractions of the preview box's own width/height (drag-to-reposition
  // below), not pixels, so they carry over correctly to the shelf grid's
  // differently-sized cells.
  const [displayScale, setDisplayScale] = useState(existing?.displayScale ?? 1);
  const [offsetX, setOffsetX] = useState(existing?.offsetX ?? 0);
  const [offsetY, setOffsetY] = useState(existing?.offsetY ?? 0);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
    moved: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [bgRemovalNotice, setBgRemovalNotice] = useState<string | null>(null);
  const [showMaskEditor, setShowMaskEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Only meaningful once both a transparent and an original version exist --
  // otherwise there's nothing distinct to switch to (mid-processing, bg
  // removal never run/failed, or this figure predates the toggle).
  const canToggleBackground =
    !processingImage && !!originalPreviewUrl && !!transparentPreviewUrl;
  // A freshly-picked photo with no transparent version yet -- covers both
  // "auto-remove is off, nothing has run yet" and "it ran and failed."
  const canRemoveBackground = !processingImage && !!originalFile && !transparentFile;
  const previewUrl =
    backgroundRemoved && transparentPreviewUrl
      ? transparentPreviewUrl
      : (originalPreviewUrl ?? transparentPreviewUrl);
  const canSubmit = !!(originalFile || existing) && !submitting && !processingImage;
  // Manual erase/restore works on whatever's currently loaded -- it doesn't
  // require auto-removal to have run first. The "original" layer it needs
  // is the least-processed image available; the "starting mask" is whatever
  // is currently shown, so toggling auto ON/OFF before opening it carries
  // through as the manual tool's baseline.
  const canManuallyAdjust = !processingImage && !!previewUrl;
  const maskEditorOriginalSrc = originalPreviewUrl ?? transparentPreviewUrl;
  const maskEditorInitialMaskSrc = previewUrl;

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  // Drag-to-reposition on the preview box itself, only once there's an
  // image to move. offsetX/Y are stored as fractions of the box's own
  // width/height (see the state comment above) so the drag math just needs
  // the box's current rect, not any fixed pixel size.
  const handlePreviewPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!previewUrl) return;
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startOffsetX: offsetX,
      startOffsetY: offsetY,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePreviewPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const box = previewBoxRef.current;
    if (!drag || !box) return;
    const rect = box.getBoundingClientRect();
    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(dx, dy) > 3) drag.moved = true;
    setOffsetX(clamp(drag.startOffsetX + dx / rect.width, -0.5, 0.5));
    setOffsetY(clamp(drag.startOffsetY + dy / rect.height, -0.5, 0.5));
  };

  const handlePreviewPointerUp = () => {
    dragRef.current = null;
  };

  const runBackgroundRemoval = async (source: File) => {
    setBgRemovalNotice(null);
    setProcessingImage(true);
    try {
      const transparent = await removeImageBackground(source);
      setTransparentFile(transparent);
      setTransparentPreviewUrl(URL.createObjectURL(transparent));
      setBackgroundRemoved(true);
    } catch {
      setBgRemovalNotice(
        "背景の自動透過に失敗しました。元の画像のまま保存するか、もう一度お試しください。"
      );
    } finally {
      setProcessingImage(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    e.target.value = "";

    setBgRemovalNotice(null);
    // A phone camera photo straight off the file picker can be huge (12MP+);
    // downscale it once here so every downstream step -- background removal,
    // the manual mask editor's canvases, the eventual upload -- works with a
    // manageable image instead of risking a memory crash on mobile.
    const selected = await resizeFigurePhoto(picked);
    setOriginalFile(selected);
    setTransparentFile(null);
    setOriginalPreviewUrl(URL.createObjectURL(selected));
    setTransparentPreviewUrl(null);
    setBackgroundRemoved(false);
    setOffsetX(0);
    setOffsetY(0);

    if (autoRemoveBackground) {
      await runBackgroundRemoval(selected);
    }
  };

  const handleRemoveBackgroundClick = () => {
    if (!canRemoveBackground || !originalFile) return;
    runBackgroundRemoval(originalFile);
  };

  const handleToggleBackground = () => {
    if (!canToggleBackground) return;
    setBackgroundRemoved((prev) => !prev);
  };

  const handleManualEditConfirm = ({
    transparent,
    original,
  }: {
    transparent: File;
    original: File | null;
  }) => {
    setTransparentFile(transparent);
    setTransparentPreviewUrl(URL.createObjectURL(transparent));
    // Only set when the editor cropped the image -- that changes the
    // original's dimensions too, so the two layers must be replaced
    // together to stay aligned. Otherwise the existing original (file or
    // saved URL) is still correct and is left alone.
    if (original) {
      setOriginalFile(original);
      setOriginalPreviewUrl(URL.createObjectURL(original));
    }
    setBackgroundRemoved(true);
    setShowMaskEditor(false);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      let imageUrl: string;
      let originalImageUrl: string | null;
      let finalBackgroundRemoved: boolean;

      if (originalFile) {
        if (transparentFile) {
          [imageUrl, originalImageUrl] = await Promise.all([
            uploadShelfFigureImage(transparentFile),
            uploadShelfFigureImage(originalFile),
          ]);
          finalBackgroundRemoved = backgroundRemoved;
        } else {
          // No transparent version exists (never run, or it failed) -- only
          // one image to save, and nothing has been "removed."
          imageUrl = await uploadShelfFigureImage(originalFile);
          originalImageUrl = null;
          finalBackgroundRemoved = false;
        }
      } else if (transparentFile && existing) {
        // Re-edited an existing figure's image via the manual mask editor
        // without picking a new source photo -- only the edited/transparent
        // version is new; the original pixel source (for future re-edits)
        // stays whatever it already was.
        imageUrl = await uploadShelfFigureImage(transparentFile);
        originalImageUrl = existing.originalImageUrl ?? existing.imageUrl;
        finalBackgroundRemoved = backgroundRemoved;
      } else if (existing) {
        // No new photo picked -- keep the existing image(s); only the
        // toggle or other fields may have changed.
        imageUrl = existing.imageUrl;
        originalImageUrl = existing.originalImageUrl;
        finalBackgroundRemoved = originalImageUrl ? backgroundRemoved : true;
      } else {
        throw new Error("写真を選択してください");
      }

      const saved = await saveShelfFigure({
        slotIndex,
        figureName: figureName.trim() || null,
        makerName: makerName.trim() || null,
        description: description.trim() || null,
        price: price.trim() ? Number(price) : null,
        imageUrl,
        originalImageUrl,
        backgroundRemoved: finalBackgroundRemoved,
        displayScale,
        offsetX,
        offsetY,
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "保存に失敗しました。もう一度お試しください。"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    if (!window.confirm("この棚から削除しますか？")) return;
    setDeleting(true);
    try {
      await deleteShelfFigure(existing.id);
      onDeleted(slotIndex);
      onClose();
    } catch {
      setErrorMessage("削除に失敗しました。もう一度お試しください。");
      setDeleting(false);
    }
  };

  return (
    <>
      {createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={existing ? "フィギュアを編集" : "フィギュアを追加"}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {existing ? "フィギュアを編集" : "フィギュアを追加"}
          </h2>
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
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">写真</p>
          {previewUrl ? (
            <div
              ref={previewBoxRef}
              onPointerDown={handlePreviewPointerDown}
              onPointerMove={handlePreviewPointerMove}
              onPointerUp={handlePreviewPointerUp}
              onPointerCancel={handlePreviewPointerUp}
              className="relative mb-1.5 flex aspect-[3/4] w-28 touch-none items-center justify-center overflow-hidden rounded-lg border border-gray-300 text-gray-400 dark:border-gray-700 dark:text-gray-500"
              style={{ cursor: processingImage ? "default" : "grab" }}
            >
              <Image
                src={previewUrl}
                alt="プレビュー"
                fill
                unoptimized
                draggable={false}
                className="pointer-events-none object-contain object-center"
                style={{
                  transform: `translate(${offsetX * 100}%, ${offsetY * 100}%) scale(${displayScale})`,
                  transformOrigin: "center",
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={processingImage}
                aria-label="写真を変更"
                className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 disabled:cursor-not-allowed"
              >
                <Camera size={12} />
              </button>
              {processingImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span className="text-[10px] text-white">背景を処理中...</span>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processingImage}
              className="relative mb-1.5 flex aspect-[3/4] w-28 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 text-gray-400 transition hover:border-pink-300 hover:text-pink-500 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-500"
            >
              <Plus size={20} />
            </button>
          )}
          {previewUrl && (
            <p className="mb-1.5 text-[11px] text-gray-400 dark:text-gray-500">
              ドラッグして位置を調整できます
            </p>
          )}
          <div className="mb-4">
            {bgRemovalNotice && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                {bgRemovalNotice}
              </p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {(canRemoveBackground || canManuallyAdjust) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {canRemoveBackground && (
                <button
                  type="button"
                  onClick={handleRemoveBackgroundClick}
                  className="flex items-center gap-1.5 rounded-full border border-pink-300 px-3 py-1.5 text-xs font-medium text-pink-600 transition hover:bg-pink-50 dark:border-pink-800 dark:text-pink-400 dark:hover:bg-pink-950/30"
                >
                  <Wand2 size={14} />
                  背景を透過する
                </button>
              )}
              {canManuallyAdjust && (
                <button
                  type="button"
                  onClick={() => setShowMaskEditor(true)}
                  className="flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <Eraser size={14} />
                  手動で調整
                </button>
              )}
            </div>
          )}

          {originalPreviewUrl && transparentPreviewUrl && (
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                透過済みの画像を使う
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={backgroundRemoved}
                aria-label="透過済みの画像を使う"
                onClick={handleToggleBackground}
                disabled={!canToggleBackground}
                className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  backgroundRemoved ? "bg-pink-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    backgroundRemoved ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {previewUrl && (
            <>
              <label
                className="mb-1 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400"
                htmlFor="shelf-fig-scale"
              >
                <span>表示サイズ（棚での大きさ）</span>
                <span>{Math.round(displayScale * 100)}%</span>
              </label>
              <input
                id="shelf-fig-scale"
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={displayScale}
                onChange={(e) => setDisplayScale(Number(e.target.value))}
                className="mb-4 w-full accent-pink-600"
              />
            </>
          )}

          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400" htmlFor="shelf-fig-name">
            フィギュア名（任意）
          </label>
          <input
            id="shelf-fig-name"
            type="text"
            value={figureName}
            onChange={(e) => setFigureName(e.target.value)}
            maxLength={100}
            placeholder="例: 初音ミク Birthday 2023 Ver."
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 dark:border-gray-700 dark:text-gray-100"
          />

          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400" htmlFor="shelf-fig-maker">
            メーカー名（任意）
          </label>
          <input
            id="shelf-fig-maker"
            type="text"
            value={makerName}
            onChange={(e) => setMakerName(e.target.value)}
            maxLength={100}
            placeholder="例: グッドスマイルカンパニー"
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 dark:border-gray-700 dark:text-gray-100"
          />

          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400" htmlFor="shelf-fig-price">
            金額（任意）
          </label>
          <input
            id="shelf-fig-price"
            type="number"
            inputMode="numeric"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="例: 16800"
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 dark:border-gray-700 dark:text-gray-100"
          />

          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400" htmlFor="shelf-fig-desc">
            説明（任意）
          </label>
          <textarea
            id="shelf-fig-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="購入の思い出やこだわりなど"
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 dark:border-gray-700 dark:text-gray-100"
          />

          {errorMessage && (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
          )}
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          {existing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              {deleting ? "削除中..." : "削除"}
            </button>
          )}
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
            {processingImage ? "画像を処理中..." : submitting ? "保存中..." : "保存する"}
          </button>
        </div>
      </div>
        </div>,
        document.body
      )}
      {showMaskEditor && maskEditorOriginalSrc && maskEditorInitialMaskSrc && (
        <BackgroundMaskEditorModal
          originalSrc={maskEditorOriginalSrc}
          initialMaskSrc={maskEditorInitialMaskSrc}
          onCancel={() => setShowMaskEditor(false)}
          onConfirm={handleManualEditConfirm}
        />
      )}
    </>
  );
}
