"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { createReport } from "@/lib/reports";

export default function PostReportMenu({
  postId,
  className = "",
  buttonClassName = "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300",
}: {
  postId: string;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle");

  const handleReport = async () => {
    setOpen(false);
    if (!window.confirm("この投稿を報告しますか？")) return;
    setState("submitting");
    try {
      await createReport({ postId });
      setState("done");
    } catch {
      setState("idle");
      window.alert("報告に失敗しました。もう一度お試しください。");
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="投稿メニュー"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition ${buttonClassName}`}
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleReport}
              disabled={state !== "idle"}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-gray-700"
            >
              {state === "done" ? "報告しました" : "投稿を報告する"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
