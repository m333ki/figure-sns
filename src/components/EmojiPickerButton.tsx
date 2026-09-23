"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";

const EMOJIS = [
  "😀", "😂", "🥰", "😍", "😊", "👍", "👎", "❤️", "🔥", "🎉",
  "😢", "😮", "😡", "🙏", "💯", "✨", "🥳", "😭", "😘", "🤔",
  "👏", "🙌", "💦", "😅", "🤣", "💕", "⭐", "🎊", "🍀", "👀",
];

export default function EmojiPickerButton({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="絵文字を追加"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      >
        <Smile size={20} />
      </button>
      {open && (
        <div className="absolute bottom-11 left-0 z-10 grid w-64 grid-cols-6 gap-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelect(emoji)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-lg transition hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
