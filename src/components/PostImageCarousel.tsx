"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PostImageCarousel({
  images,
  alt,
  sizes,
  maxHeight = 640,
  aspectMode = "auto",
  className = "",
  onImageClick,
  initialIndex = 0,
}: {
  images: string[];
  alt: string;
  sizes: string;
  /** Only used when aspectMode is "auto". */
  maxHeight?: number;
  /**
   * "auto": the container measures the first image's natural ratio and
   * sizes itself to it (feed card, unknown parent height).
   * "fill": the container takes 100% of an already-sized parent (detail
   * modal's fixed-height panel).
   */
  aspectMode?: "auto" | "fill";
  className?: string;
  onImageClick?: () => void;
  /** Which image to open on, e.g. when the caller already knows which
   * thumbnail was tapped. Applied once on mount, not re-applied on change. */
  initialIndex?: number;
}) {
  const [ratio, setRatio] = useState<number | null>(null);
  const [index, setIndex] = useState(initialIndex);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const multi = images.length > 1;

  // Jumps to the requested starting slide once the scroller has a real
  // width to compute an offset against -- can't scroll a 0-width element.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !initialIndex || el.clientWidth === 0) return;
    el.scrollTo({ left: initialIndex * el.clientWidth });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFirstLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    if (aspectMode !== "auto") return;
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setRatio(img.naturalWidth / img.naturalHeight);
    }
  };

  const scrollToIndex = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(images.length - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIndex((prev) => (prev === i ? prev : i));
  };

  return (
    <div
      className={`relative w-full overflow-hidden ${
        aspectMode === "auto" ? "bg-gray-100 dark:bg-gray-800" : ""
      } ${className}`}
      style={
        aspectMode === "auto"
          ? { aspectRatio: ratio ?? 3 / 4, maxHeight }
          : { height: "100%" }
      }
    >
      <div
        ref={scrollerRef}
        onScroll={multi ? handleScroll : undefined}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => {
          const slideContent = (
            <Image
              src={src}
              alt={images.length > 1 ? `${alt} (${i + 1}/${images.length})` : alt}
              fill
              sizes={sizes}
              className="object-contain"
              onLoad={i === 0 ? handleFirstLoad : undefined}
              priority={i === 0}
            />
          );

          return onImageClick ? (
            <button
              key={src + i}
              type="button"
              onClick={onImageClick}
              aria-label="投稿を拡大表示"
              className="relative h-full w-full shrink-0 snap-start"
            >
              {slideContent}
            </button>
          ) : (
            <div key={src + i} className="relative h-full w-full shrink-0 snap-start">
              {slideContent}
            </div>
          );
        })}
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
          {index < images.length - 1 && (
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
            {index + 1}/{images.length}
          </div>

          <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
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
  );
}
