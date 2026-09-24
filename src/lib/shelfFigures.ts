import { supabase } from "@/lib/supabase";
import type { ShelfItem } from "@/types";

export const SHELF_SLOT_COUNT = 12;

const MAX_FIGURE_PHOTO_DIMENSION = 1600;

// A phone camera photo (often 4000x3000px+) fed untouched into the manual
// mask editor means decoding 2+ full-resolution ImageBitmaps and several
// same-size canvases at once -- enough to crash the tab on a memory-
// constrained mobile browser. Downscaling the source once, right after
// picking it, keeps every downstream step (auto/manual background removal,
// the canvases, the upload) working with a manageable image instead.
// Returns the original file untouched if it's already small enough, or if
// decoding fails for any reason (e.g. a format canvas can't read).
export async function resizeFigurePhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_FIGURE_PHOTO_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) {
      bitmap.close();
      return file;
    }

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas context unavailable");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );
    if (!blob) throw new Error("resize produced no output");
    const name = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch (e) {
    console.error("figure photo resize failed, using original", e);
    return file;
  }
}

type DbShelfFigure = {
  id: string;
  user_id: string;
  slot_index: number;
  figure_name: string | null;
  maker_name: string | null;
  description: string | null;
  price: number | null;
  image_url: string;
  original_image_url: string | null;
  background_removed: boolean;
  display_scale: number;
  offset_x: number | null;
  offset_y: number | null;
};

function mapShelfFigure(row: DbShelfFigure): ShelfItem {
  return {
    id: row.id,
    slotIndex: row.slot_index,
    figureName: row.figure_name,
    makerName: row.maker_name,
    description: row.description,
    price: row.price,
    imageUrl: row.image_url,
    originalImageUrl: row.original_image_url,
    backgroundRemoved: row.background_removed,
    displayScale: row.display_scale,
    offsetX: row.offset_x ?? 0,
    offsetY: row.offset_y ?? 0,
  };
}

// Fixed-length 9-slot array matching the display grid; empty slots are
// null. Returns all-null (not an error) when logged out — there's no
// "my shelf" without a session.
export async function fetchMyShelf(): Promise<(ShelfItem | null)[]> {
  const empty: (ShelfItem | null)[] = Array.from({ length: SHELF_SLOT_COUNT }, () => null);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return empty;

  const { data, error } = await supabase
    .from("shelf_figures")
    .select("*")
    .eq("user_id", session.user.id);
  if (error) throw error;

  const slots = [...empty];
  for (const row of data as DbShelfFigure[]) {
    if (row.slot_index >= 0 && row.slot_index < SHELF_SLOT_COUNT) {
      slots[row.slot_index] = mapShelfFigure(row);
    }
  }
  return slots;
}

export type SaveShelfFigureInput = {
  slotIndex: number;
  figureName: string | null;
  makerName: string | null;
  description: string | null;
  price: number | null;
  imageUrl: string;
  originalImageUrl: string | null;
  backgroundRemoved: boolean;
  displayScale: number;
  offsetX: number;
  offsetY: number;
};

// One row per (user, slot) — upsert so callers don't need to know whether
// this slot already has a figure in it.
export async function saveShelfFigure(input: SaveShelfFigureInput): Promise<ShelfItem> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("ログインが必要です");

  const { data, error } = await supabase
    .from("shelf_figures")
    .upsert(
      {
        user_id: session.user.id,
        slot_index: input.slotIndex,
        figure_name: input.figureName,
        maker_name: input.makerName,
        description: input.description,
        price: input.price,
        image_url: input.imageUrl,
        original_image_url: input.originalImageUrl,
        background_removed: input.backgroundRemoved,
        display_scale: input.displayScale,
        offset_x: input.offsetX,
        offset_y: input.offsetY,
      },
      { onConflict: "user_id,slot_index" }
    )
    .select()
    .single();
  if (error) throw error;
  return mapShelfFigure(data as DbShelfFigure);
}

export async function deleteShelfFigure(id: string): Promise<void> {
  const { error } = await supabase.from("shelf_figures").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadShelfFigureImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `shelf-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("figures")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("figures").getPublicUrl(path);
  return publicUrl;
}
