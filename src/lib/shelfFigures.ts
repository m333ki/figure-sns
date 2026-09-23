import { supabase } from "@/lib/supabase";
import type { ShelfItem } from "@/types";

export const SHELF_SLOT_COUNT = 12;

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
