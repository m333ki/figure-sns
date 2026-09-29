"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { createReport, REPORT_REASONS, type ReportReason, type ReportTargetType } from "@/lib/reports";
import { useToast } from "@/context/ToastContext";

export default function ReportModal({
  targetType,
  targetId,
  onClose,
}: {
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createReport({ targetType, targetId, reason, detail });
      showToast("ご報告ありがとうございました。運営にて確認いたします");
      onClose();
    } catch {
      setError("送信に失敗しました。もう一度お試しください。");
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="報告する"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">報告する</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <p className="mb-1.5 text-xs font-medium text-muted">理由</p>
          <div role="radiogroup" aria-label="通報理由" className="mb-4 flex flex-col gap-2">
            {REPORT_REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="report-reason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-accent"
                />
                {r}
              </label>
            ))}
          </div>

          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="report-detail">
            詳細（任意）
          </label>
          <textarea
            id="report-detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="詳しい状況があればご記入ください"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />

          {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-full bg-accent py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "送信中..." : "送信する"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
