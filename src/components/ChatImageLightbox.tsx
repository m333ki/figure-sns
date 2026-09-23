"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// Native scroll-snap (same mechanism as PostImageCarousel) instead of a
// hand-rolled pointerdown/pointerup drag tracker: the previous version
// called setPointerCapture() on a wrapper that also contained the arrow
// buttons, which per the Pointer Events spec retargets the mouse-compat
// click event to the capturing element while capture is active -- so the
// arrow buttons' onClick silently never fired. Native scrolling sidesteps
// that whole class of bug and gives a real touch swipe for free.
export default function ChatImageLightbox({
  urls,
  initialIndex,
  onClose,
}: {
  urls: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startScrollLeft: number } | null>(null);
  const multi = urls.length > 1;

  // Jumps to the requested starting slide once the scroller has a real
  // width to compute an offset against -- can't scroll a 0-width element.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !initialIndex || el.clientWidth === 0) return;
    el.scrollTo({ left: initialIndex * el.clientWidth });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToIndex = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(urls.length - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIndex((prev) => (prev === i ? prev : i));
  };

  // Plain mouse events (not Pointer Events + setPointerCapture) so a
  // click-and-drag scrolls the strip like a touch swipe would, without
  // risking the button-click-swallowing bug that motivated this rewrite.
  // Bailing out when the press starts on a button lets those keep working
  // as ordinary clicks.
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const el = scrollerRef.current;
    if (!el) return;
    // scroll-smooth (CSS scroll-behavior: smooth) animates every scrollLeft
    // write, including plain property assignment -- with it left on, each
    // mousemove's assignment interrupts the previous one's in-flight
    // animation before it gets anywhere, so the strip barely moves. Turn
    // it off for the duration of the drag; scrollToIndex() re-enables it
    // for the button/snap-settle case, where one discrete jump is wanted.
    el.style.scrollBehavior = "auto";
    dragRef.current = { startX: e.clientX, startScrollLeft: el.scrollLeft };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = dragRef.current.startScrollLeft - (e.clientX - dragRef.current.startX);
  };
  const endDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    el.style.scrollBehavior = "";
    scrollToIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="閉じる"
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <X size={20} />
      </button>

      <div
        className="relative"
        style={{ width: "85vw", height: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={scrollerRef}
          onScroll={multi ? handleScroll : undefined}
          onMouseDown={multi ? handleMouseDown : undefined}
          onMouseMove={multi ? handleMouseMove : undefined}
          onMouseUp={multi ? endDrag : undefined}
          onMouseLeave={multi ? endDrag : undefined}
          className="flex h-full w-full cursor-grab snap-x snap-mandatory overflow-x-auto scroll-smooth active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {urls.map((url, i) => (
            <div
              key={url + i}
              className="flex h-full w-full shrink-0 snap-start items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- each
                  image's own intrinsic size drives how large it renders
                  (width/height:auto), which next/image's fill-a-known-
                  container model can't express. */}
              <img
                src={url}
                alt=""
                draggable={false}
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  userSelect: "none",
                }}
                className="rounded-lg"
              />
            </div>
          ))}
        </div>

        {multi && (
          <>
            {index > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToIndex(index - 1);
                }}
                aria-label="前の画像"
                className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {index < urls.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToIndex(index + 1);
                }}
                aria-label="次の画像"
                className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
              >
                <ChevronRight size={18} />
              </button>
            )}

            <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white">
              {index + 1}/{urls.length}
            </div>

            <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {urls.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition ${
                    i === index ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
