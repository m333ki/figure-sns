"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ImagePlus, MoreHorizontal, Send, X } from "lucide-react";
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
import ReportModal from "@/components/ReportModal";
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
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingReadIdsRef = useRef<Set<string>>(new Set());
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

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
  // sending. Re-asserted one frame later too: on a slow connection the
  // initial load's images can still be settling their layout right as this
  // runs, which on a real device (unlike a fast local reload) leaves enough
  // of a gap between "committed" and "actually laid out" for the first
  // scrollHeight read to undershoot. Also re-runs when the footer's own
  // height changes (attaching an image grows it) -- otherwise the newly
  // taller footer covers the last message instead of the view shifting up
  // to keep it clear.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    const raf = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(raf);
  }, [messages.length, footerHeight]);

  // The footer (attachments strip + input bar) is pinned with `fixed` on
  // mobile -- see the JSX below -- so it no longer takes up space in the
  // flex column and the scrollable message list needs matching bottom
  // padding or the last messages end up hidden behind it. Measured rather
  // than a fixed guess because the footer's own height changes (attachment
  // previews, a validation error line).
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setFooterHeight(entries[0].contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Re-settles the message list against the bottom whenever the keyboard
  // opens or closes, so the latest message doesn't end up hidden behind it
  // -- the instant scrollTop effect above only reacts to new messages/
  // footer content changes, not to the keyboard's own resize (padding-only
  // changes don't affect the footer's content box). Instant, not smooth:
  // the keyboard's own slide animation keeps resizing the visual viewport
  // for a couple hundred ms after the first signal fires, so a scrollTo
  // animation targeting a scrollHeight read at that instant can undershoot
  // -- reasserted once more after a delay to catch the settled state.
  const keepScrolledToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setTimeout(() => {
      const el2 = scrollContainerRef.current;
      if (el2) el2.scrollTop = el2.scrollHeight;
    }, 300);
  }, []);

  // iOS can fire the textarea's blur slightly before the keyboard's close
  // animation actually finishes, so isFocused is corrected against the real
  // visual viewport height rather than trusting focus/blur alone -- that's
  // what actually drives whether the input bar's bottom padding needs to
  // clear the keyboard.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleResize = () => {
      setIsFocused(window.innerHeight - vv.height > 100);
      keepScrolledToBottom();
    };
    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, [keepScrolledToBottom]);

  // Revoke every still-live preview URL on unmount only -- individual
  // removals revoke their own URL immediately (see handleRemovePendingImage).
  useEffect(() => {
    return () => {
      pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Grows the textarea with its content (capped, then scrolls internally --
  // see the max-h-[120px] overflow-y-auto classes below). Driven by `body`
  // rather than called from the change handler directly so it also re-runs
  // when a send clears the text back to empty, shrinking the box back down.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = MAX_CHAT_IMAGES - pendingImages.length;
    if (room <= 0) {
      setAttachError(`一度に送信できる画像は最大${MAX_CHAT_IMAGES}枚までです`);
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

    // Compressed one at a time rather than fired all at once -- running
    // several createImageBitmap/canvas decodes concurrently is what was
    // exhausting mobile browsers' canvas memory when attaching several
    // full-size camera photos together, silently producing a corrupt (but
    // still "successfully" uploadable) image for one of them instead of
    // throwing -- hence a broken-image icon with no visible send error.
    (async () => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const compressed = await compressChatImage(accepted[i]);
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
      }
    })();
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
        <p className="text-sm text-muted">
          チャットを利用するにはログインが必要です
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={() => router.push("/chat")}
          aria-label="戻る"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="truncate text-sm font-semibold text-foreground">
          {otherUsername || "..."}
        </h1>
      </div>

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-[var(--footer-h)] lg:pb-4"
        style={{ "--footer-h": `${footerHeight}px` } as React.CSSProperties}
      >
        {loading ? (
          <p className="py-12 text-center text-sm text-muted">
            読み込み中...
          </p>
        ) : error ? (
          <p className="py-12 text-center text-sm text-red-500 dark:text-red-400">{error}</p>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">
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
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-muted dark:bg-gray-800">
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
                      <div className="flex shrink-0 flex-col items-center gap-0.5 text-[10px] whitespace-nowrap text-muted">
                        {m.isRead && <span>既読</span>}
                        <span>{formatMessageTime(m.createdAt)}</span>
                      </div>
                    )}
                    <div
                      className={`flex max-w-[75%] flex-col gap-1 ${mine ? "items-end" : "items-start"}`}
                    >
                      {hasImages &&
                        (m.imageUrls.length === 1 ? (
                          <button
                            type="button"
                            onClick={() => setLightbox({ urls: m.imageUrls, index: 0 })}
                            className="relative aspect-square w-36 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800"
                          >
                            <Image src={m.imageUrls[0]} alt="" fill sizes="144px" className="object-cover" />
                          </button>
                        ) : (
                          // Explicit 6rem (=96px) tracks, smaller than a
                          // single image's 9rem -- the message column's own
                          // max-w-75% cap plus the timestamp column leaves
                          // less than 2x9rem (or even 2x7rem) of room on a
                          // narrow phone, and a w-fit grid doesn't shrink to
                          // respect its parent's max-width the way ordinary
                          // text does, so it would overflow past it and
                          // under the timestamp instead of wrapping. 6rem
                          // stays clear of that even at a 320px viewport.
                          // w-fit + explicit lengths (not grid-cols-2's 1fr)
                          // because 1fr tracks don't contribute their content
                          // size to a w-fit container's own intrinsic sizing,
                          // leaving the grid measuring narrower than its
                          // thumbnails and making them overlap.
                          <div className="grid w-fit grid-cols-[repeat(2,6rem)] gap-1.5">
                            {m.imageUrls.map((url, imgIndex) => (
                              <button
                                key={imgIndex}
                                type="button"
                                onClick={() => setLightbox({ urls: m.imageUrls, index: imgIndex })}
                                className="relative aspect-square w-24 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800"
                              >
                                <Image src={url} alt="" fill sizes="96px" className="object-cover" />
                              </button>
                            ))}
                          </div>
                        ))}
                      {!!m.body && (
                        <div
                          className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                            mine
                              ? "bg-accent text-accent-foreground"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }`}
                        >
                          <Linkify text={m.body} isMine={mine} />
                        </div>
                      )}
                    </div>
                    {!mine && (
                      <div className="flex shrink-0 flex-col items-center gap-0.5 text-[10px] whitespace-nowrap text-muted">
                        <span>{formatMessageTime(m.createdAt)}</span>
                        <button
                          type="button"
                          onClick={() => setReportMessageId(m.id)}
                          aria-label="このメッセージを報告"
                          className="flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <MoreHorizontal size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed to the viewport (not just this column) on mobile so it can
          never end up left behind mid-scroll the way a plain flex/shrink-0
          footer could if the browser's own chrome (address bar) resizes the
          visual viewport out from under a layout-flow element while a swipe
          is in progress. Back to a normal flow element at desktop, where
          that class of bug doesn't apply and fixed positioning would need
          to account for the sidebar/right-rail columns instead. */}
      <div
        ref={footerRef}
        className={`fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-2xl border-t border-border bg-background lg:static lg:inset-auto lg:mx-0 lg:w-auto lg:pb-0 ${
          // The 12px floor only applies once the keyboard is open, to clear
          // the space the keyboard/URL-bar push-up needs. At rest,
          // viewport-fit=cover means env(safe-area-inset-bottom) alone
          // already reserves the real home-indicator inset on notched
          // devices, without an artificial gap on devices that don't need one.
          isFocused ? "pb-[max(12px,env(safe-area-inset-bottom))]" : "pb-[env(safe-area-inset-bottom)]"
        }`}
      >
      {pendingImages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-3">
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
        <p className="px-4 pt-2 text-xs text-red-500 dark:text-red-400">{attachError}</p>
      )}

      <div className="px-4 py-3">
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-accent dark:hover:bg-gray-800"
          >
            <ImagePlus size={20} />
          </button>
          <EmojiPickerButton onSelect={(emoji) => setBody((prev) => prev + emoji)} />
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onFocus={() => {
              setIsFocused(true);
              keepScrolledToBottom();
            }}
            onBlur={() => {
              setIsFocused(false);
              keepScrolledToBottom();
            }}
            maxLength={1000}
            rows={1}
            placeholder="メッセージを入力..."
            className="max-h-[120px] flex-1 resize-none overflow-y-auto rounded-2xl border border-gray-300 px-4 py-2 text-sm text-foreground outline-none focus:border-accent dark:border-gray-700"
          />
          <button
            type="button"
            onClick={handleSend}
            onPointerDown={(e) => e.preventDefault()}
            disabled={
              (!body.trim() && pendingImages.length === 0) ||
              sending ||
              pendingImages.some((p) => p.compressing)
            }
            aria-label="送信"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
      </div>

      {lightbox && (
        <ChatImageLightbox
          urls={lightbox.urls}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {reportMessageId && (
        <ReportModal
          targetType="message"
          targetId={reportMessageId}
          onClose={() => setReportMessageId(null)}
        />
      )}
    </div>
  );
}
