"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { CONTACT_CATEGORIES, createContactMessage, type ContactCategory } from "@/lib/contact";
import { useToast } from "@/context/ToastContext";

export default function ContactPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [category, setCategory] = useState<ContactCategory>(CONTACT_CATEGORIES[0]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await createContactMessage({ category, email: email.trim() || undefined, message });
      showToast("お問い合わせを受け付けました。ご連絡ありがとうございます");
      setCategory(CONTACT_CATEGORIES[0]);
      setEmail("");
      setMessage("");
    } catch {
      setError("送信に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center gap-1">
        <button
          type="button"
          onClick={handleBack}
          aria-label="戻る"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-foreground">カスタマーサポート / お問い合わせ</h1>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="contact-category">
            お問い合わせ種別
          </label>
          <select
            id="contact-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ContactCategory)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            {CONTACT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="contact-email">
            メールアドレス（返信をご希望の場合）
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="contact-message">
            内容
          </label>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            maxLength={2000}
            placeholder="お問い合わせ内容をご記入ください"
            className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !message.trim()}
          className="w-full rounded-full bg-accent py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "送信中..." : "送信する"}
        </button>
      </div>
    </div>
  );
}
