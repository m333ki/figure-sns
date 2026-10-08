import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

// Display preferences for the shelf case (lighting, case color). Case color
// lives on profiles (one value per user); per-row lighting lives on
// shelf_row_titles (see lib/shelfRowTitles.ts) since that table already
// models one row per user_id+row_index.

export type Lighting = "warm" | "cool" | "pink" | "off";

export const LIGHTING_OPTIONS: { id: Lighting; label: string; swatchClass: string }[] = [
  { id: "warm", label: "Warm", swatchClass: "bg-amber-400" },
  { id: "cool", label: "Cool", swatchClass: "bg-sky-400" },
  { id: "pink", label: "Pink", swatchClass: "bg-pink-400" },
  { id: "off", label: "Off", swatchClass: "bg-gray-500" },
];

export const LIGHTING_STYLES: Record<Lighting, { glow: CSSProperties }> = {
  warm: {
    glow: {
      background:
        "radial-gradient(ellipse 70% 100% at 50% -10%, rgba(251,191,36,0.55), transparent 65%)",
    },
  },
  cool: {
    glow: {
      background:
        "radial-gradient(ellipse 70% 100% at 50% -10%, rgba(56,189,248,0.55), transparent 65%)",
    },
  },
  pink: {
    glow: {
      background:
        "radial-gradient(ellipse 70% 100% at 50% -10%, rgba(244,114,182,0.55), transparent 65%)",
    },
  },
  off: {
    glow: { background: "transparent" },
  },
};

export type CaseColor = "black" | "white";

export const CASE_COLOR_OPTIONS: { id: CaseColor; label: string; swatchClass: string }[] = [
  { id: "black", label: "ブラック", swatchClass: "bg-neutral-950 border border-white/40" },
  { id: "white", label: "ホワイト", swatchClass: "bg-white border border-black/30" },
];

const DEFAULT_CASE_COLOR: CaseColor = "black";

export async function fetchMyShelfCaseColor(): Promise<CaseColor> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return DEFAULT_CASE_COLOR;

  const { data, error } = await supabase
    .from("profiles")
    .select("shelf_case_color")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) throw error;
  return (data?.shelf_case_color as CaseColor | undefined) ?? DEFAULT_CASE_COLOR;
}

export async function saveMyShelfCaseColor(color: CaseColor): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("ログインが必要です");

  const { error } = await supabase
    .from("profiles")
    .update({ shelf_case_color: color })
    .eq("user_id", session.user.id);
  if (error) throw error;
}
