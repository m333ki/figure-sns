"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ShelfItem } from "@/types";

export default function FigurePickerModal({
  open,
  figures,
  onSelect,
  onClose,
}: {
  open: boolean;
  figures: ShelfItem[];
  onSelect: (figure: ShelfItem) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="フィギュアを選ぶ"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            フィギュアを選ぶ
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
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
          {figures.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
              追加できるフィギュアがありません
              <br />
              （すべて棚に配置済みです）
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {figures.map((figure) => (
                <button
                  key={figure.id}
                  type="button"
                  onClick={() => onSelect(figure)}
                  className="flex flex-col overflow-hidden rounded-xl border border-gray-100 text-left transition hover:border-pink-300 hover:shadow-sm dark:border-gray-800"
                >
                  <div className="relative aspect-[3/4] w-full bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={figure.imageUrl}
                      alt={figure.figureName}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {figure.figureName}
                    </p>
                    <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                      {figure.makerName}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-pink-600 dark:text-pink-400">
                      ¥{figure.price.toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
