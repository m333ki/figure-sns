"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { ShelfItem } from "@/types";
import FigurePickerModal from "@/components/mypage/FigurePickerModal";

const SLOTS_PER_ROW = 3;
const ROWS = 3;
const TOTAL_SLOTS = ROWS * SLOTS_PER_ROW;

type Lighting = "warm" | "cool" | "pink" | "off";

const LIGHTING_OPTIONS: { id: Lighting; label: string; swatchClass: string }[] = [
  { id: "warm", label: "Warm", swatchClass: "bg-amber-400" },
  { id: "cool", label: "Cool", swatchClass: "bg-sky-400" },
  { id: "pink", label: "Pink", swatchClass: "bg-pink-400" },
  { id: "off", label: "Off", swatchClass: "bg-gray-500" },
];

const LIGHTING_STYLES: Record<
  Lighting,
  { glow: CSSProperties; caseShadow: CSSProperties }
> = {
  warm: {
    glow: {
      background:
        "radial-gradient(ellipse at top, rgba(251,191,36,0.35), transparent 70%)",
    },
    caseShadow: { boxShadow: "0 0 40px 10px rgba(251,191,36,0.15)" },
  },
  cool: {
    glow: {
      background:
        "radial-gradient(ellipse at top, rgba(56,189,248,0.35), transparent 70%)",
    },
    caseShadow: { boxShadow: "0 0 40px 10px rgba(56,189,248,0.15)" },
  },
  pink: {
    glow: {
      background:
        "radial-gradient(ellipse at top, rgba(244,114,182,0.35), transparent 70%)",
    },
    caseShadow: { boxShadow: "0 0 40px 10px rgba(244,114,182,0.15)" },
  },
  off: {
    glow: { background: "transparent" },
    caseShadow: { boxShadow: "none" },
  },
};

export default function DisplayShelf({
  initialSlots,
  catalog,
}: {
  initialSlots: (ShelfItem | null)[];
  catalog: ShelfItem[];
}) {
  const [lighting, setLighting] = useState<Lighting>("warm");
  const [slots, setSlots] = useState<(ShelfItem | null)[]>(initialSlots);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  const placedIds = new Set(slots.filter((f) => f !== null).map((f) => f.id));
  const availableFigures = catalog.filter((f) => !placedIds.has(f.id));

  const filledCount = slots.filter((f) => f !== null).length;
  const totalValue = slots.reduce((sum, f) => sum + (f?.price ?? 0), 0);

  const handleSelect = (figure: ShelfItem) => {
    if (activeSlotIndex === null) return;
    setSlots((prev) =>
      prev.map((s, i) => (i === activeSlotIndex ? figure : s))
    );
    setActiveSlotIndex(null);
  };

  const rows = Array.from({ length: ROWS }, (_, rowIndex) =>
    slots.slice(rowIndex * SLOTS_PER_ROW, rowIndex * SLOTS_PER_ROW + SLOTS_PER_ROW)
  );

  return (
    <div>
      <div className="rounded-2xl bg-gradient-to-br from-white/40 via-sky-200/20 to-white/10 p-[1.5px] shadow-lg">
        <div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-4 transition-shadow duration-500 sm:p-6"
          style={LIGHTING_STYLES[lighting].caseShadow}
        >
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-500"
            style={LIGHTING_STYLES[lighting].glow}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.12)_0%,transparent_30%)]" />

          <div className="relative">
            <div className="flex justify-end">
              <div className="flex items-center gap-1.5 rounded-full bg-black/30 p-1 ring-1 ring-white/10">
                {LIGHTING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    title={`LED: ${opt.label}`}
                    aria-label={`LEDライティングを${opt.label}にする`}
                    aria-pressed={lighting === opt.id}
                    onClick={() => setLighting(opt.id)}
                    className={`h-6 w-6 rounded-full ${opt.swatchClass} ring-offset-2 ring-offset-slate-900 transition ${
                      lighting === opt.id
                        ? "scale-110 ring-2 ring-white"
                        : "opacity-50 hover:opacity-80"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {rows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="rounded-xl bg-gradient-to-r from-white/25 via-sky-200/15 to-white/20 p-px"
                >
                  <div className="rounded-xl bg-slate-900/40 p-2.5 backdrop-blur-sm sm:p-3">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {row.map((figure, colIndex) => {
                        const slotIndex = rowIndex * SLOTS_PER_ROW + colIndex;
                        return (
                          <ShelfSlot
                            key={slotIndex}
                            figure={figure}
                            onClickEmpty={() => setActiveSlotIndex(slotIndex)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex divide-x divide-white/10 rounded-xl bg-black/30 ring-1 ring-white/10">
              <div className="flex-1 px-4 py-3 text-center">
                <p className="text-lg font-bold text-white">
                  {filledCount}
                  <span className="text-xs font-normal text-white/50">
                    {" "}
                    / {TOTAL_SLOTS}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-white/50">
                  棚のフィギュア数
                </p>
              </div>
              <div className="flex-1 px-4 py-3 text-center">
                <p className="text-lg font-bold text-white">
                  ¥{totalValue.toLocaleString()}
                </p>
                <p className="mt-0.5 text-[11px] text-white/50">推定総額</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FigurePickerModal
        open={activeSlotIndex !== null}
        figures={availableFigures}
        onSelect={handleSelect}
        onClose={() => setActiveSlotIndex(null)}
      />
    </div>
  );
}

function ShelfSlot({
  figure,
  onClickEmpty,
}: {
  figure: ShelfItem | null;
  onClickEmpty: () => void;
}) {
  if (!figure) {
    return (
      <button
        type="button"
        onClick={onClickEmpty}
        aria-label="フィギュアを追加"
        className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/25 text-white/40 transition hover:border-white/50 hover:bg-white/5 hover:text-white/70"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span className="text-[10px]">追加</span>
      </button>
    );
  }

  return (
    <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-slate-900 ring-1 ring-white/20">
      <Image
        src={figure.imageUrl}
        alt={figure.figureName}
        fill
        sizes="(max-width: 640px) 33vw, 160px"
        className="object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 pt-4">
        <p className="truncate text-[10px] font-medium text-white">
          {figure.figureName}
        </p>
      </div>
    </div>
  );
}
