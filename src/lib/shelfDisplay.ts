import type { CSSProperties } from "react";

// Display-only preferences for the shelf case (lighting, case color). These
// are cosmetic and client-only — never persisted to Supabase — so this file
// holds just the shared shapes/constants, not a data-access layer.

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
