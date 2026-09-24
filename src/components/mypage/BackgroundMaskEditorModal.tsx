"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Crop, Eraser, Paintbrush, Undo2, Redo2, RotateCcw, X } from "lucide-react";

const MIN_BRUSH = 5;
const MAX_BRUSH = 100;
const DEFAULT_BRUSH = 25;
// Ignore near-invisible alpha noise (antialiased stroke edges) when finding
// the content box, and leave a little breathing room around it so the crop
// doesn't clip right at the subject's silhouette.
const CROP_ALPHA_THRESHOLD = 10;
const CROP_PADDING_RATIO = 0.04;

type Tool = "erase" | "restore";
type Point = { x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };

async function loadImageBitmap(src: string): Promise<ImageBitmap> {
  const res = await fetch(src);
  const blob = await res.blob();
  return createImageBitmap(blob);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

// The canvas is displayed with `object-fit: contain`, so its CSS box
// (`rect`) and its actually-rendered content aren't always the same size --
// a portrait image's box can get its height capped by the modal's
// max-h-[45vh] while the width stays full, leaving the box proportionally
// wider than the image, which `contain` resolves by centering the content
// with empty margins on the sides (and the reverse can happen for very
// wide images). Scaling by canvas.width/rect.width alone ignores those
// margins and shifts every mapped point by however wide they are --
// content this function accounts for explicitly.
function getContentRect(canvas: HTMLCanvasElement, rect: DOMRect) {
  const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
  return {
    scale,
    offsetX: (rect.width - canvas.width * scale) / 2,
    offsetY: (rect.height - canvas.height * scale) / 2,
  };
}

function toCanvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number): Point {
  const rect = canvas.getBoundingClientRect();
  const { scale, offsetX, offsetY } = getContentRect(canvas, rect);
  return {
    x: (clientX - rect.left - offsetX) / scale,
    y: (clientY - rect.top - offsetY) / scale,
  };
}

// Bounding box of pixels whose alpha exceeds the threshold -- null if the
// mask is (essentially) fully transparent, i.e. nothing left to crop to.
function findContentBox(imageData: ImageData): Box | null {
  const { data, width, height } = imageData;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (data[rowStart + x * 4 + 3] > CROP_ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

// The two-layer model: `originalCanvas` holds the pristine source pixels
// (background included) and is never modified. `maskCanvas` holds only an
// alpha channel -- its own RGB is discarded, it's just painted onto and
// then used as the alpha source when compositing. This lets "restore"
// bring back pixels that were erased by the *automatic* removal too, since
// it always reads from the untouched original, not from whatever the mask
// canvas remembers.
export default function BackgroundMaskEditorModal({
  originalSrc,
  initialMaskSrc,
  onCancel,
  onConfirm,
}: {
  originalSrc: string;
  initialMaskSrc: string;
  onCancel: () => void;
  onConfirm: (result: { transparent: File; original: File | null }) => void;
}) {
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef(-1);

  const [tool, setTool] = useState<Tool>("erase");
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasEdits, setHasEdits] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  const [saving, setSaving] = useState(false);
  const [hasCropped, setHasCropped] = useState(false);
  const [cropNotice, setCropNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // Belt-and-suspenders alongside the `touch-none` CSS on this box: some
  // mobile browsers still start their own pull-to-refresh/navigation
  // gesture from a touch that begins here, even with touch-action set,
  // especially once the drag has left the box's own bounds mid-stroke. A
  // non-passive touchmove listener that unconditionally preventDefaults is
  // the only thing that reliably stops that everywhere.
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const handleTouchMove = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", handleTouchMove);
  }, []);

  function recomposite() {
    const display = displayCanvasRef.current;
    const original = originalCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!display || !original || !mask) return;
    const ctx = display.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, display.width, display.height);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(original, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [originalBitmap, maskBitmap] = await Promise.all([
          loadImageBitmap(originalSrc),
          loadImageBitmap(initialMaskSrc),
        ]);
        if (cancelled) return;

        const width = originalBitmap.width;
        const height = originalBitmap.height;
        const originalCanvas = originalCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        if (!originalCanvas || !maskCanvas) return;

        originalCanvas.width = width;
        originalCanvas.height = height;
        maskCanvas.width = width;
        maskCanvas.height = height;

        const originalCtx = originalCanvas.getContext("2d");
        const maskCtx = maskCanvas.getContext("2d");
        if (!originalCtx || !maskCtx) return;

        originalCtx.drawImage(originalBitmap, 0, 0);
        // Scaled to the original's size in case the source that seeded the
        // mask (e.g. the AI-removed result) isn't pixel-identical in size.
        maskCtx.drawImage(maskBitmap, 0, 0, width, height);
        originalBitmap.close();
        maskBitmap.close();

        const displayCanvas = displayCanvasRef.current;
        if (displayCanvas) {
          displayCanvas.width = width;
          displayCanvas.height = height;
        }

        historyRef.current = [maskCtx.getImageData(0, 0, width, height)];
        historyIndexRef.current = 0;
        setCanUndo(false);
        setCanRedo(false);
        setHasEdits(false);
        setHasCropped(false);
        setCropNotice(null);
        setDimensions({ width, height });
        setReady(true);
        recomposite();
      } catch {
        if (!cancelled) setLoadError("画像の読み込みに失敗しました。");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [originalSrc, initialMaskSrc]);

  function paintSegment(from: Point | null, to: Point, currentTool: Tool, radius: number) {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = radius * 2;
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.globalCompositeOperation = currentTool === "erase" ? "destination-out" : "source-over";
    if (from) {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(to.x, to.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function pushHistory() {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext("2d");
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, mask.width, mask.height);
    const truncated = historyRef.current.slice(0, historyIndexRef.current + 1);
    truncated.push(snapshot);
    historyRef.current = truncated;
    historyIndexRef.current = truncated.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
    setHasEdits(historyIndexRef.current > 0);
  }

  function restoreFromHistory(index: number) {
    const mask = maskCanvasRef.current;
    const snapshot = historyRef.current[index];
    if (!mask || !snapshot) return;
    const ctx = mask.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(snapshot, 0, 0);
    historyIndexRef.current = index;
    setCanUndo(index > 0);
    setCanRedo(index < historyRef.current.length - 1);
    setHasEdits(index > 0);
    recomposite();
  }

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    restoreFromHistory(historyIndexRef.current - 1);
  };
  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    restoreFromHistory(historyIndexRef.current + 1);
  };
  const handleReset = () => restoreFromHistory(0);

  // Crops both layers down to the remaining (opaque) content, so the
  // subject fills the frame instead of sitting in a sea of transparent
  // margin once the unwanted surroundings are erased. This changes the
  // canvases' actual dimensions, which the per-stroke undo history (plain
  // same-size ImageData snapshots) can't represent -- so a crop starts a
  // fresh baseline rather than becoming an undoable step. Canceling the
  // whole editor is still the way back if the crop wasn't wanted.
  const handleAutoCrop = () => {
    const original = originalCanvasRef.current;
    const mask = maskCanvasRef.current;
    const display = displayCanvasRef.current;
    if (!original || !mask || !display) return;
    const originalCtx = original.getContext("2d");
    const maskCtx = mask.getContext("2d");
    if (!originalCtx || !maskCtx) return;

    const maskData = maskCtx.getImageData(0, 0, mask.width, mask.height);
    const box = findContentBox(maskData);
    if (!box) {
      setCropNotice("トリミングできる範囲が見つかりませんでした。");
      return;
    }

    const pad = Math.round(Math.max(box.w, box.h) * CROP_PADDING_RATIO);
    const x = Math.max(0, box.x - pad);
    const y = Math.max(0, box.y - pad);
    const maxX = Math.min(mask.width, box.x + box.w + pad);
    const maxY = Math.min(mask.height, box.y + box.h + pad);
    const w = maxX - x;
    const h = maxY - y;

    if (x === 0 && y === 0 && w === mask.width && h === mask.height) {
      setCropNotice("これ以上トリミングできる余白がありません。");
      return;
    }

    const originalCropped = originalCtx.getImageData(x, y, w, h);
    const maskCropped = maskCtx.getImageData(x, y, w, h);

    original.width = w;
    original.height = h;
    originalCtx.putImageData(originalCropped, 0, 0);

    mask.width = w;
    mask.height = h;
    maskCtx.putImageData(maskCropped, 0, 0);

    display.width = w;
    display.height = h;

    historyRef.current = [maskCtx.getImageData(0, 0, w, h)];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
    setHasEdits(false);
    setHasCropped(true);
    setCropNotice(null);
    setDimensions({ width: w, height: h });
    recomposite();
  };

  const updateCursor = (canvas: HTMLCanvasElement, rect: DOMRect, clientX: number, clientY: number) => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const { scale } = getContentRect(canvas, rect);
    const displayRadius = brushSize * scale;
    cursor.style.left = `${clientX - rect.left}px`;
    cursor.style.top = `${clientY - rect.top}px`;
    cursor.style.width = `${displayRadius * 2}px`;
    cursor.style.height = `${displayRadius * 2}px`;
    cursor.style.opacity = "1";
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ready) return;
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const pt = toCanvasPoint(canvas, e.clientX, e.clientY);
    lastPointRef.current = pt;
    paintSegment(null, pt, tool, brushSize);
    recomposite();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ready) return;
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    updateCursor(canvas, rect, e.clientX, e.clientY);

    if (!drawingRef.current) return;
    const pt = toCanvasPoint(canvas, e.clientX, e.clientY);
    paintSegment(lastPointRef.current, pt, tool, brushSize);
    lastPointRef.current = pt;
    recomposite();
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    pushHistory();
  };

  const handlePointerLeave = () => {
    if (cursorRef.current) cursorRef.current.style.opacity = "0";
  };

  const handleConfirm = async () => {
    const display = displayCanvasRef.current;
    const original = originalCanvasRef.current;
    if (!display || !original) return;
    setSaving(true);
    try {
      const transparentBlob = await canvasToBlob(display);
      if (!transparentBlob) return;
      const transparent = new File([transparentBlob], "manual-edit.png", { type: "image/png" });

      if (!hasCropped) {
        onConfirm({ transparent, original: null });
        return;
      }
      // A crop changed the original's dimensions too -- the saved
      // "original" must be replaced with this cropped version so a future
      // re-edit loads two layers that still line up.
      const originalBlob = await canvasToBlob(original);
      onConfirm({
        transparent,
        original: originalBlob
          ? new File([originalBlob], "manual-edit-original.png", { type: "image/png" })
          : null,
      });
    } finally {
      setSaving(false);
    }
  };

  const toolButtonClass = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
      active
        ? "border-pink-400 bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300"
        : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"
    }`;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overscroll-contain bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="手動で調整"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">手動で調整</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="閉じる"
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {loadError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
          ) : (
            <>
              <div
                ref={canvasWrapRef}
                className="relative mx-auto mb-3 max-h-[45vh] w-full touch-none overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #d1d5db 25%, transparent 25%), linear-gradient(-45deg, #d1d5db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d1d5db 75%), linear-gradient(-45deg, transparent 75%, #d1d5db 75%)",
                    backgroundSize: "16px 16px",
                    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                    backgroundColor: "#f3f4f6",
                  }}
                />
                {tool === "restore" && (
                  <Image
                    src={originalSrc}
                    alt=""
                    fill
                    unoptimized
                    className="object-contain opacity-30"
                  />
                )}
                <canvas ref={originalCanvasRef} className="hidden" />
                <canvas ref={maskCanvasRef} className="hidden" />
                <canvas
                  ref={displayCanvasRef}
                  className="absolute inset-0 h-full w-full touch-none object-contain"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onPointerLeave={handlePointerLeave}
                />
                <div
                  ref={cursorRef}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pink-500 opacity-0"
                  style={{ transition: "opacity 100ms" }}
                />
                {!ready && !loadError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  </div>
                )}
              </div>

              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setTool("erase")}
                  aria-pressed={tool === "erase"}
                  className={toolButtonClass(tool === "erase")}
                >
                  <Eraser size={14} />
                  消去
                </button>
                <button
                  type="button"
                  onClick={() => setTool("restore")}
                  aria-pressed={tool === "restore"}
                  className={toolButtonClass(tool === "restore")}
                >
                  <Paintbrush size={14} />
                  復元
                </button>
              </div>

              <label
                className="mb-1 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400"
                htmlFor="mask-brush-size"
              >
                <span>ブラシサイズ</span>
                <span>{brushSize}</span>
              </label>
              <input
                id="mask-brush-size"
                type="range"
                min={MIN_BRUSH}
                max={MAX_BRUSH}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="mb-3 w-full accent-pink-600"
              />

              <button
                type="button"
                onClick={handleAutoCrop}
                disabled={!ready}
                className="mb-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <Crop size={14} />
                余白をトリミングして大きく表示
              </button>
              <div className="mb-3">
                {cropNotice && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">{cropNotice}</p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    aria-label="1つ戻す"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
                  >
                    <Undo2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={!canRedo}
                    aria-label="やり直す"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
                  >
                    <Redo2 size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasEdits}
                  className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
                >
                  <RotateCcw size={12} />
                  すべての手動消去をリセット
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-gray-300 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!ready || saving}
            className="flex-1 rounded-full bg-pink-600 py-2 text-sm font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "適用中..." : "この内容を適用"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
