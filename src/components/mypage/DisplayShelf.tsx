"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { Settings } from "lucide-react";
import { ShelfItem } from "@/types";
import { fetchMyShelf, SHELF_SLOT_COUNT } from "@/lib/shelfFigures";
import { fetchMyShelfRowTitles, saveShelfRowTitle } from "@/lib/shelfRowTitles";
import { LIGHTING_STYLES, type CaseColor, type Lighting } from "@/lib/shelfDisplay";
import { getAutoRemoveBackground, setAutoRemoveBackground } from "@/lib/shelfPreferences";
import { useAuth } from "@/context/AuthContext";
import FigureFormModal from "@/components/mypage/FigureFormModal";
import ShelfSettingsModal from "@/components/mypage/ShelfSettingsModal";

const SLOTS_PER_ROW = 3;
const ROWS = SHELF_SLOT_COUNT / SLOTS_PER_ROW;

type CaseTheme = {
  interior: string;
  interiorStyle: CSSProperties;
  titleDim: string;
  titleBright: string;
  titleSeparator: string;
  titleEditIcon: string;
  titleInput: string;
  emptySlot: string;
  slotRing: string;
  captionGradient: string;
  captionText: string;
  glassHighlight: string;
  glassTint: string;
  glassShadowLine: string;
  glassShadowFade: string;
  stats: string;
  statsValue: string;
  statsLabel: string;
};

const CASE_THEMES: Record<CaseColor, CaseTheme> = {
  black: {
    interior:
      "bg-gradient-to-b from-stone-900 via-stone-950 to-black border border-black rounded-2xl",
    interiorStyle: {
      boxShadow:
        "inset 0 10px 24px -6px rgba(0,0,0,0.5), inset 0 -10px 24px -6px rgba(0,0,0,0.4), 0 20px 40px -20px rgba(0,0,0,0.6)",
    },
    titleDim: "text-white/50",
    titleBright: "text-white/90",
    titleSeparator: "text-white/30",
    titleEditIcon: "text-white/25 group-hover:text-white/60",
    titleInput:
      "border-white/20 bg-black/30 text-white placeholder:text-white/30 focus:border-pink-400",
    emptySlot:
      "border-white/25 text-white/40 hover:border-white/50 hover:bg-white/5 hover:text-white/70",
    slotRing: "ring-1 ring-white/10",
    captionGradient: "bg-gradient-to-t from-black/70 to-transparent",
    captionText: "text-white",
    glassHighlight: "bg-white/60",
    glassTint: "bg-gradient-to-b from-emerald-200/25 via-emerald-100/10 to-transparent",
    glassShadowLine: "bg-black/70",
    glassShadowFade: "bg-gradient-to-t from-black/50 to-transparent",
    stats: "bg-black/30 ring-1 ring-white/10 divide-white/10",
    statsValue: "text-white",
    statsLabel: "text-white/50",
  },
  white: {
    interior:
      "bg-gradient-to-b from-gray-100 via-gray-50 to-white border border-gray-300 rounded-2xl",
    interiorStyle: {
      boxShadow: "inset 0 0 15px rgba(0,0,0,0.08), 0 10px 30px -20px rgba(0,0,0,0.25)",
    },
    titleDim: "text-gray-500",
    titleBright: "text-gray-900",
    titleSeparator: "text-gray-400",
    titleEditIcon: "text-gray-400 group-hover:text-gray-600",
    titleInput:
      "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-pink-400",
    emptySlot:
      "border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-black/5 hover:text-gray-600",
    slotRing: "ring-1 ring-black/10",
    captionGradient: "bg-gradient-to-t from-white/85 to-transparent",
    captionText: "text-gray-900",
    glassHighlight: "bg-black/15",
    glassTint: "bg-gradient-to-b from-emerald-900/10 via-emerald-900/5 to-transparent",
    glassShadowLine: "bg-black/20",
    glassShadowFade: "bg-gradient-to-t from-black/10 to-transparent",
    stats: "bg-black/5 ring-1 ring-black/10 divide-black/10",
    statsValue: "text-gray-900",
    statsLabel: "text-gray-500",
  },
};

export default function DisplayShelf() {
  const { user, promptLogin } = useAuth();
  const [caseColor, setCaseColor] = useState<CaseColor>("black");
  const theme = CASE_THEMES[caseColor];
  const [rowLighting, setRowLighting] = useState<Lighting[]>(() =>
    Array.from({ length: ROWS }, () => "warm")
  );
  const [slots, setSlots] = useState<(ShelfItem | null)[]>(() =>
    Array.from({ length: SHELF_SLOT_COUNT }, () => null)
  );
  const [rowTitles, setRowTitles] = useState<(string | null)[]>(() =>
    Array.from({ length: ROWS }, () => null)
  );
  const [loading, setLoading] = useState(true);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Safe as a lazy initializer (rather than reading it in an effect): this
  // value only ever affects the add/edit and settings modals, both closed
  // on first render, so there's no server/client markup to mismatch.
  const [autoRemoveBackground, setAutoRemoveBackgroundState] = useState(() =>
    getAutoRemoveBackground()
  );

  const handleChangeAutoRemoveBackground = (value: boolean) => {
    setAutoRemoveBackgroundState(value);
    setAutoRemoveBackground(value);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [shelfData, titleData] = await Promise.all([
          fetchMyShelf(),
          fetchMyShelfRowTitles(),
        ]);
        if (!cancelled) {
          setSlots(shelfData);
          setRowTitles(titleData);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // user?.id (not `user`): see the matching comment in mypage/page.tsx --
    // the object reference churns on every auth event (e.g. background
    // token refresh), which flashed the whole shelf back to "読み込み中..."
    // and re-fetched even when the logged-in user hadn't actually changed.
  }, [user?.id]);

  const filledCount = slots.filter((f) => f !== null).length;
  const totalValue = slots.reduce((sum, f) => sum + (f?.price ?? 0), 0);

  const handleSlotClick = (index: number) => {
    if (!user) {
      promptLogin();
      return;
    }
    setActiveSlotIndex(index);
  };

  const handleSaveRowTitle = async (rowIndex: number, value: string) => {
    const saved = await saveShelfRowTitle(rowIndex, value);
    setRowTitles((prev) => prev.map((t, i) => (i === rowIndex ? saved : t)));
  };

  const handleSetRowLighting = (rowIndex: number, value: Lighting) => {
    setRowLighting((prev) => prev.map((l, i) => (i === rowIndex ? value : l)));
  };

  const rows = Array.from({ length: ROWS }, (_, rowIndex) =>
    slots.slice(rowIndex * SLOTS_PER_ROW, rowIndex * SLOTS_PER_ROW + SLOTS_PER_ROW)
  );

  const activeSlotItem = activeSlotIndex !== null ? slots[activeSlotIndex] : null;

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Settings size={14} />
          表示設定
        </button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          読み込み中...
        </p>
      ) : (
        <>
          <div
            className={`relative overflow-hidden transition-colors duration-500 ${theme.interior}`}
            style={theme.interiorStyle}
          >
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="relative overflow-hidden">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 transition-opacity duration-500"
                  style={LIGHTING_STYLES[rowLighting[rowIndex]].glow}
                />
                <div className="relative px-2.5 pt-2.5 sm:px-3 sm:pt-3">
                  <RowTitleLabel
                    rowIndex={rowIndex}
                    title={rowTitles[rowIndex] ?? null}
                    editable={!!user}
                    onRequestLogin={promptLogin}
                    onSave={handleSaveRowTitle}
                    theme={theme}
                  />
                  <div className="grid grid-cols-3 gap-2 pb-2.5 sm:gap-3 sm:pb-3">
                    {row.map((figure, colIndex) => {
                      const slotIndex = rowIndex * SLOTS_PER_ROW + colIndex;
                      return (
                        <ShelfSlot
                          key={slotIndex}
                          figure={figure}
                          onClick={() => handleSlotClick(slotIndex)}
                          theme={theme}
                        />
                      );
                    })}
                  </div>
                </div>
                {rowIndex < ROWS - 1 && <GlassShelf theme={theme} />}
              </div>
            ))}
          </div>

          <div
            className={`mt-5 flex divide-x rounded-xl transition-colors duration-500 ${theme.stats}`}
          >
            <div className="flex-1 px-4 py-3 text-center">
              <p className={`text-lg font-bold ${theme.statsValue}`}>
                {filledCount}
                <span className={`text-xs font-normal ${theme.statsLabel}`}>
                  {" "}
                  / {SHELF_SLOT_COUNT}
                </span>
              </p>
              <p className={`mt-0.5 text-[11px] ${theme.statsLabel}`}>棚のフィギュア数</p>
            </div>
            <div className="flex-1 px-4 py-3 text-center">
              <p className={`text-lg font-bold ${theme.statsValue}`}>
                ¥{totalValue.toLocaleString()}
              </p>
              <p className={`mt-0.5 text-[11px] ${theme.statsLabel}`}>推定総額</p>
            </div>
          </div>
        </>
      )}

      {activeSlotIndex !== null && (
        <FigureFormModal
          slotIndex={activeSlotIndex}
          existing={activeSlotItem}
          autoRemoveBackground={autoRemoveBackground}
          onClose={() => setActiveSlotIndex(null)}
          onSaved={(item) => {
            setSlots((prev) => prev.map((s, i) => (i === activeSlotIndex ? item : s)));
          }}
          onDeleted={(slotIndex) => {
            setSlots((prev) => prev.map((s, i) => (i === slotIndex ? null : s)));
          }}
        />
      )}

      {settingsOpen && (
        <ShelfSettingsModal
          onClose={() => setSettingsOpen(false)}
          caseColor={caseColor}
          onChangeCaseColor={setCaseColor}
          rowTitles={rowTitles}
          rowLighting={rowLighting}
          onChangeRowLighting={handleSetRowLighting}
          autoRemoveBackground={autoRemoveBackground}
          onChangeAutoRemoveBackground={handleChangeAutoRemoveBackground}
        />
      )}
    </div>
  );
}

function RowTitleLabel({
  rowIndex,
  title,
  editable,
  onRequestLogin,
  onSave,
  theme,
}: {
  rowIndex: number;
  title: string | null;
  editable: boolean;
  onRequestLogin: () => void;
  onSave: (rowIndex: number, value: string) => Promise<void>;
  theme: CaseTheme;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setValue(title ?? "");
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setValue(title ?? "");
    setError(null);
    setEditing(false);
  };

  const commit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(rowIndex, value);
      setEditing(false);
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="mb-1.5 flex min-w-[160px] flex-1 flex-wrap items-center gap-1.5">
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          maxLength={40}
          placeholder={`${rowIndex + 1}段目のタイトル`}
          disabled={saving}
          className={`min-w-0 flex-1 rounded-md border px-2 py-1 text-xs outline-none ${theme.titleInput}`}
        />
        <button
          type="button"
          onClick={commit}
          disabled={saving}
          className="rounded-md bg-pink-600 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-pink-700 disabled:opacity-50"
        >
          保存
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          className={`rounded-md px-2 py-1 text-[11px] transition hover:opacity-80 ${theme.titleDim}`}
        >
          キャンセル
        </button>
        {error && <span className="w-full text-[10px] text-red-400">{error}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (editable ? startEditing() : onRequestLogin())}
      className={`group mb-1.5 flex min-w-0 max-w-full items-center gap-1 text-left ${
        editable ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <span className="min-w-0 truncate text-[11px]">
        <span className={`font-medium ${theme.titleDim}`}>{rowIndex + 1}段目</span>
        {title && (
          <>
            <span className={theme.titleSeparator}>：</span>
            <span className={`font-medium ${theme.titleBright}`}>{title}</span>
          </>
        )}
      </span>
      {editable && (
        <svg
          className={`h-3 w-3 shrink-0 transition ${theme.titleEditIcon}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z"
          />
        </svg>
      )}
    </button>
  );
}

function GlassShelf({ theme }: { theme: CaseTheme }) {
  return (
    <div className="relative mx-2.5 h-2.5 shrink-0 sm:mx-3 sm:h-3">
      <div className={`absolute inset-x-0 top-0 h-px ${theme.glassHighlight}`} />
      <div className={`absolute inset-0 ${theme.glassTint}`} />
      <div className={`absolute inset-x-0 bottom-0 h-px ${theme.glassShadowLine}`} />
      <div className={`absolute inset-x-0 bottom-0 h-3 ${theme.glassShadowFade}`} />
    </div>
  );
}

function ShelfSlot({
  figure,
  onClick,
  theme,
}: {
  figure: ShelfItem | null;
  onClick: () => void;
  theme: CaseTheme;
}) {
  if (!figure) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="フィギュアを追加"
        className={`flex aspect-[3/4] w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed transition ${theme.emptySlot}`}
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

  // backgroundRemoved picks the transparent (imageUrl) vs. original version;
  // falls back to imageUrl if this figure predates the toggle (no stored
  // original to fall back to).
  const displaySrc = figure.backgroundRemoved
    ? figure.imageUrl
    : (figure.originalImageUrl ?? figure.imageUrl);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="フィギュアを編集"
      className={`group relative aspect-[3/4] w-full overflow-hidden rounded-md ${theme.slotRing}`}
    >
      <Image
        src={displaySrc}
        alt={figure.figureName ?? "フィギュア"}
        fill
        sizes="(max-width: 640px) 33vw, 160px"
        className="object-contain object-bottom p-1"
        style={{ transform: `scale(${figure.displayScale})`, transformOrigin: "center bottom" }}
      />
      {figure.figureName && (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 p-1.5 pt-4 ${theme.captionGradient}`}
        >
          <p className={`truncate text-[10px] font-medium ${theme.captionText}`}>
            {figure.figureName}
          </p>
        </div>
      )}
    </button>
  );
}
