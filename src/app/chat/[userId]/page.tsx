"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ImagePlus, Send, X } from "lucide-react";
import { ChatMessage } from "@/types";
import { fetchThread, sendMessage, markThreadRead, subscribeToThread } from "@/lib/messages";
import {
  MAX_CHAT_IMAGES,
  compressChatImage,
  uploadChatImage,
  validateChatImageFile,
  type CompressedChatImage,
} from "@/lib/chatImages";
import Linkify from "@/components/Linkify";
import EmojiPickerButton from "@/components/EmojiPickerButton";
import ChatImageLightbox from "@/components/ChatImageLightbox";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";

// How long to wait after a message first becomes visible before actually
// calling markThreadRead -- lets several messages that appear near-
// simultaneously (initial load, or a burst of incoming ones) collapse into
// one API call instead of one per message.
const MARK_READ_DEBOUNCE_MS = 400;
// Fraction of a message bubble that must be on screen to count as "seen".
const VISIBILITY_THRESHOLD = 0.6;

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function formatDateHeader(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const weekday = WEEKDAYS[d.getDay()];
  const prefix =
    d.getFullYear() === now.getFullYear() ? "" : `${d.getFullYear()}年`;
  return `${prefix}${d.getMonth() + 1}月${d.getDate()}日(${weekday})`;
}

function isSameDay(isoA: string, isoB: string): boolean {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type PendingChatImage = {
  id: string;
  previewUrl: string;
  compressed: CompressedChatImage;
  compressing: boolean;
};

export default function ChatThreadPage() {
  const { userId } = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { refresh: refreshBadges } = useNotifications();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingChatImage[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingReadIdsRef = useRef<Set<string>>(new Set());
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fallbackUsername = searchParams.get("username") ?? "";
  const otherUsername =
    messages.find((m) => m.senderId === userId)?.senderUsername ??
    messages.find((m) => m.recipientId === userId)?.recipientUsername ??
    fallbackUsername;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchThread(userId);
        if (!cancelled) setMessages(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "メッセージの取得に失敗しました");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    const unsubscribe = subscribeToThread(user.id, userId, {
      onMessage: (message) => {
        setMessages((prev) => [...prev, message]);
      },
      onReadReceipt: (messageId) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m))
        );
      },
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
    // user?.id (not `user`): see the matching comment in mypage/page.tsx --
    // the object reference churns on every auth event (e.g. background
    // token refresh), which would otherwise re-subscribe/re-fetch needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userId]);

  // Marks read only once a received, unread message has actually scrolled
  // into view (rather than the moment the thread opens or a message
  // arrives), then lets several near-simultaneous ones collapse into a
  // single markThreadRead call via the debounce above.
  const scheduleMarkRead = useCallback(() => {
    if (markReadTimerRef.current) return;
    markReadTimerRef.current = setTimeout(() => {
      markReadTimerRef.current = null;
      const ids = [...pendingReadIdsRef.current];
      pendingReadIdsRef.current.clear();
      if (ids.length === 0) return;
      setMessages((prev) =>
        prev.map((m) => (ids.includes(m.id) ? { ...m, isRead: true } : m))
      );
      markThreadRead(userId).then(refreshBadges).catch((e) => {
        console.error("markThreadRead failed", e);
      });
    }, MARK_READ_DEBOUNCE_MS);
  }, [userId, refreshBadges]);

  useEffect(() => {
    return () => {
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root || !user) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let sawNewlyVisible = false;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.getAttribute("data-message-id");
          if (!id) continue;
          pendingReadIdsRef.current.add(id);
          observer.unobserve(entry.target);
          sawNewlyVisible = true;
        }
        if (sawNewlyVisible) scheduleMarkRead();
      },
      { root, threshold: VISIBILITY_THRESHOLD }
    );

    for (const m of messages) {
      if (m.recipientId !== user.id || m.isRead) continue;
      const el = messageElsRef.current.get(m.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [messages, user, scheduleMarkRead]);

  // Scrolls only this container's own scrollTop, never scrollIntoView --
  // that can walk up and nudge ancestor/document scroll position too, which
  // on mobile (with the keyboard open and the page's dvh height already in
  // flux) is what was leaving the whole thread visibly shifted after
  // sending.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Revoke every still-live preview URL on unmount only -- individual
  // removals revoke their own URL immediately (see handleRemovePendingImage).
  useEffect(() => {
    return () => {
      pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = MAX_CHAT_IMAGES - pendingImages.length;
    if (room <= 0) {
      setAttachError(`画像は最大${MAX_CHAT_IMAGES}枚までです`);
      return;
    }

    let validationError: string | null = null;
    const accepted: File[] = [];
    for (const file of files) {
      if (accepted.length >= room) break;
      const err = validateChatImageFile(file);
      if (err) {
        validationError = err;
        continue;
      }
      accepted.push(file);
    }
    setAttachError(validationError);
    if (accepted.length === 0) return;

    const entries: PendingChatImage[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      compressed: { blob: file, ext: "jpg" },
      compressing: true,
    }));
    setPendingImages((prev) => [...prev, ...entries]);

    entries.forEach((entry, i) => {
      compressChatImage(accepted[i]).then((compressed) => {
        setPendingImages((prev) =>
          prev.map((p) => {
            if (p.id !== entry.id) return p;
            URL.revokeObjectURL(p.previewUrl);
            return {
              ...p,
              compressed,
              previewUrl: URL.createObjectURL(compressed.blob),
              compressing: false,
            };
          })
        );
      });
    });
  };

  const handleRemovePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSend = async () => {
    const trimmed = body.trim();
    const hasImages = pendingImages.length > 0;
    if ((!trimmed && !hasImages) || sending || !otherUsername) return;
    if (pendingImages.some((p) => p.compressing)) return;
    setSending(true);
    try {
      const imageUrls = hasImages
        ? await Promise.all(pendingImages.map((p) => uploadChatImage(p.compressed)))
        : [];
      const sent = await sendMessage(userId, otherUsername, trimmed, imageUrls);
      setMessages((prev) => [...prev, sent]);
      setBody("");
      pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPendingImages([]);
      setAttachError(null);
    } catch (e) {
      // Logged in full regardless of shape -- a Supabase PostgrestError or
      // StorageError carries .message/.details/.hint, but whatever this
      // actually is, we want to see it verbatim in the console instead of
      // just the generic alert text.
      console.error("chat send failed:", e);
      const detail =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: unknown }).message)
            : null;
      window.alert(detail ? `送信に失敗しました: ${detail}` : "送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto w-full px-4 py-24 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          チャットを利用するにはログインが必要です
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col pb-[env(safe-area-inset-bottom)]">
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <button
          type="button"
          onClick={() => router.push("/chat")}
          aria-label="戻る"
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
          {otherUsername || "..."}
        </h1>
      </div>

      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
            読み込み中...
          </p>
        ) : error ? (
          <p className="py-12 text-center text-sm text-red-500 dark:text-red-400">{error}</p>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
            まだメッセージがありません。最初のメッセージを送ってみましょう。
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m, i) => {
              const mine = m.senderId === user?.id;
              const hasImages = m.imageUrls.length > 0;
              const showDateSeparator = i === 0 || !isSameDay(messages[i - 1].createdAt, m.createdAt);
              return (
                <div key={m.id} className="flex flex-col gap-1">
                  {showDateSeparator && (
                    <div className="flex justify-center py-1">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        {formatDateHeader(m.createdAt)}
                      </span>
                    </div>
                  )}
                  <div
                    ref={
                      mine
                        ? undefined
                        : (el) => {
                            if (el) messageElsRef.current.set(m.id, el);
                            else messageElsRef.current.delete(m.id);
                          }
                    }
                    data-message-id={mine ? undefined : m.id}
                    className={`flex items-end gap-1 ${mine ? "justify-end" : "justify-start"}`}
                  >
                    {mine && (
                      <div className="flex shrink-0 flex-col items-center gap-0.5 text-[10px] whitespace-nowrap text-gray-400 dark:text-gray-500">
                        {m.isRead && <span>既読</span>}
                        <span>{formatMessageTime(m.createdAt)}</span>
                      </div>
                    )}
                    <div
                      className={`flex max-w-[75%] flex-col gap-1 ${mine ? "items-end" : "items-start"}`}
                    >
                      {hasImages && (
                        <div className="flex flex-wrap gap-1">
                          {m.imageUrls.map((url, imgIndex) => (
                            <button
                              key={imgIndex}
                              type="button"
                              onClick={() => setLightbox({ urls: m.imageUrls, index: imgIndex })}
                              className="relative h-36 w-36 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800"
                            >
                              <Image src={url} alt="" fill sizes="144px" className="object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                      {!!m.body && (
                        <div
                          className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                            mine
                              ? "bg-pink-600 text-white"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }`}
                        >
                          <Linkify text={m.body} isMine={mine} />
                        </div>
                      )}
                    </div>
                    {!mine && (
                      <div className="flex shrink-0 flex-col items-center gap-0.5 text-[10px] whitespace-nowrap text-gray-400 dark:text-gray-500">
                        <span>{formatMessageTime(m.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pendingImages.length > 0 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-gray-100 px-4 pt-3 dark:border-gray-800">
          {pendingImages.map((p) => (
            <div
              key={p.id}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
            >
              <Image src={p.previewUrl} alt="" fill sizes="80px" className="object-cover" />
              {p.compressing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemovePendingImage(p.id)}
                aria-label="この画像を削除"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      {attachError && (
        <p className="shrink-0 px-4 pt-2 text-xs text-red-500 dark:text-red-400">{attachError}</p>
      )}

      <div className="shrink-0 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="画像を添付"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <ImagePlus size={20} />
          </button>
          <EmojiPickerButton onSelect={(emoji) => setBody((prev) => prev + emoji)} />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            maxLength={1000}
            rows={1}
            placeholder="メッセージを入力..."
            className="flex-1 resize-none rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 dark:border-gray-700 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={
              (!body.trim() && pendingImages.length === 0) ||
              sending ||
              pendingImages.some((p) => p.compressing)
            }
            aria-label="送信"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-600 text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {lightbox && (
        <ChatImageLightbox
          urls={lightbox.urls}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
