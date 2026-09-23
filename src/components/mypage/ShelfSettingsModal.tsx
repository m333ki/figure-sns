"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CASE_COLOR_OPTIONS,
  LIGHTING_OPTIONS,
  type CaseColor,
  type Lighting,
} from "@/lib/shelfDisplay";

export default function ShelfSettingsModal({
  onClose,
  caseColor,
  onChangeCaseColor,
  rowTitles,
  rowLighting,
  onChangeRowLighting,
  autoRemoveBackground,
  onChangeAutoRemoveBackground,
}: {
  onClose: () => void;
  caseColor: CaseColor;
  onChangeCaseColor: (next: CaseColor) => void;
  rowTitles: (string | null)[];
  rowLighting: Lighting[];
  onChangeRowLighting: (rowIndex: number, next: Lighting) => void;
  autoRemoveBackground: boolean;
  onChangeAutoRemoveBackground: (next: boolean) => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="表示設定"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            表示設定
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
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">棚の色</p>
          <div className="mb-5 flex gap-2">
            {CASE_COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeCaseColor(opt.id)}
                aria-pressed={caseColor === opt.id}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  caseColor === opt.id
                    ? "border-pink-400 bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"
                }`}
              >
                <span className={`h-4 w-4 rounded-full ${opt.swatchClass}`} />
                {opt.label}
              </button>
            ))}
          </div>

          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">段ごとの照明</p>
          <div className="space-y-2">
            {rowLighting.map((value, rowIndex) => (
              <div
                key={rowIndex}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
              >
                <span className="min-w-0 truncate text-xs text-gray-600 dark:text-gray-400">
                  {rowIndex + 1}段目
                  {rowTitles[rowIndex] && `：${rowTitles[rowIndex]}`}
                </span>
                <div className="flex shrink-0 gap-1.5">
                  {LIGHTING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      title={opt.label}
                      aria-label={`${rowIndex + 1}段目のLEDを${opt.label}にする`}
                      aria-pressed={value === opt.id}
                      onClick={() => onChangeRowLighting(rowIndex, opt.id)}
                      className={`h-5 w-5 rounded-full ${opt.swatchClass} transition ${
                        value === opt.id
                          ? "scale-110 ring-2 ring-pink-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-900"
                          : "opacity-50 hover:opacity-80"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mb-2 mt-5 text-xs font-medium text-gray-500 dark:text-gray-400">
            フィギュアの写真
          </p>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              アップロード時に自動で背景透過する
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={autoRemoveBackground}
              aria-label="アップロード時に自動で背景透過する"
              onClick={() => onChangeAutoRemoveBackground(!autoRemoveBackground)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                autoRemoveBackground ? "bg-pink-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  autoRemoveBackground ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
