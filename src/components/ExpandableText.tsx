"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export default function ExpandableText({
  text,
  className = "",
  wrapperClassName = "",
  buttonClassName = "mt-0.5 text-xs font-medium text-gray-400 transition hover:text-pink-500 dark:text-gray-500",
  lines = 3,
}: {
  text: ReactNode;
  className?: string;
  wrapperClassName?: string;
  buttonClassName?: string;
  lines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    // Skip while expanded: the clamp is removed, so the element is its own
    // full height and would wrongly measure as "not overflowing" — leaving
    // `overflowing` at its last (collapsed) value keeps the toggle button
    // visible after expanding.
    if (!el || expanded) return;

    const measure = () => setOverflowing(el.scrollHeight - el.clientHeight > 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, lines, expanded]);

  return (
    <div className={wrapperClassName}>
      <p
        ref={ref}
        className={className}
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: lines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {text}
      </p>
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={buttonClassName}
        >
          {expanded ? "閉じる" : "続きを読む"}
        </button>
      )}
    </div>
  );
}
