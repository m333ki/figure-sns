"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import ReportModal from "@/components/ReportModal";

export default function PostOptionsMenu({
  postId,
  canDelete = false,
  onDelete,
  className = "",
  buttonClassName = "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300",
}: {
  postId: string;
  canDelete?: boolean;
  onDelete?: () => Promise<void> | void;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setOpen(false);
    if (!onDelete) return;
    if (!window.confirm("この投稿を削除しますか？この操作は取り消せません。")) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch {
      window.alert("削除に失敗しました。もう一度お試しください。");
    } finally {
      setDeleting(false);
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
            className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {canDelete && (
              <button
                type="button"
                role="menuitem"
                onClick={handleDelete}
                disabled={deleting}
                className="block w-full px-3 py-2 text-left text-sm text-muted transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700"
              >
                {deleting ? "削除中..." : "投稿を削除する"}
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setReportOpen(true);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 transition hover:bg-gray-50 dark:text-red-400 dark:hover:bg-gray-700"
            >
              投稿を報告する
            </button>
          </div>
        </>
      )}

      {reportOpen && (
        <ReportModal targetType="post" targetId={postId} onClose={() => setReportOpen(false)} />
      )}
    </div>
  );
}
