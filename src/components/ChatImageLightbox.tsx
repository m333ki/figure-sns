"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// Minimum horizontal drag distance (px) before a touch gesture counts as a
// swipe rather than a tap.
const SWIPE_THRESHOLD_PX = 40;

// Unlike PostImageCarousel (used in the feed, where every slide shares one
// pre-sized box so swiping between them feels like a single fixed strip),
// this lightbox shows one image at a time and lets the box itself resize to
// that image's own aspect ratio -- so a square image and a tall portrait
// image in the same message both render as large as they can, instead of
// both being squeezed into whichever box a "shared frame" model would pick.
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
  const dragStartXRef = useRef<number | null>(null);
  const multi = urls.length > 1;

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(urls.length - 1, i + 1));

  // Pointer Events (not Touch Events) so this responds to an actual
  // touchscreen swipe AND a desktop mouse-drag / trackpad-emulated-mouse
  // drag alike -- Touch Events alone never fire for mouse input, which is
  // how swiping silently stopped working after the previous rewrite.
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartXRef.current = e.clientX;
    // Keeps receiving move/up events for this pointer even if it drifts
    // outside the box mid-drag (a fast swipe easily does, since the box is
    // only as big as the image itself, not the full screen).
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartXRef.current === null) return;
    const dx = e.clientX - dragStartXRef.current;
    dragStartXRef.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    if (dx < 0) goNext();
    else goPrev();
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
        className="relative flex items-center justify-center"
        style={{ maxWidth: "85vw", maxHeight: "85vh", touchAction: "pan-y" }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- each
            image's own intrinsic size drives the box (width/height:auto),
            which next/image's fill-a-known-container model can't express. */}
        <img
          src={urls[index]}
          alt=""
          draggable={false}
          style={{
            width: "auto",
            height: "auto",
            maxWidth: "100%",
            maxHeight: "85vh",
            objectFit: "contain",
            userSelect: "none",
          }}
          className="rounded-lg"
        />

        {multi && (
          <>
            {index > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
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
                  goNext();
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
