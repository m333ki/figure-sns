import { supabase } from "@/lib/supabase";
import type { Lighting } from "@/lib/shelfDisplay";

export const SHELF_ROW_COUNT = 4;

const DEFAULT_LIGHTING: Lighting = "warm";

type DbShelfRowSetting = {
  row_index: number;
  title: string | null;
  lighting: Lighting;
};

export type ShelfRowSetting = { title: string | null; lighting: Lighting };

// Fixed-length array matching the number of shelf rows; entries fall back to
// {title: null, lighting: "warm"} until the user customizes a row. Returns
// all-default (not an error) when logged out, same convention as
// fetchMyShelf().
export async function fetchMyShelfRowSettings(): Promise<ShelfRowSetting[]> {
  const empty: ShelfRowSetting[] = Array.from({ length: SHELF_ROW_COUNT }, () => ({
    title: null,
    lighting: DEFAULT_LIGHTING,
  }));
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return empty;

  const { data, error } = await supabase
    .from("shelf_row_titles")
    .select("row_index, title, lighting")
    .eq("user_id", session.user.id);
  if (error) throw error;

  const settings = empty.map((s) => ({ ...s }));
  for (const row of data as DbShelfRowSetting[]) {
    if (row.row_index >= 0 && row.row_index < SHELF_ROW_COUNT) {
      settings[row.row_index] = {
        title: row.title,
        lighting: row.lighting ?? DEFAULT_LIGHTING,
      };
    }
  }
  return settings;
}

// Saves the custom label for one shelf row, or clears it when the trimmed
// title is blank. Upserts (rather than deleting the row on clear) so a
// lighting choice already saved for the same row survives -- PostgREST's
// upsert only ever touches the columns in this payload, leaving an
// unrelated `lighting` value on the existing row untouched either way.
export async function saveShelfRowTitle(
  rowIndex: number,
  title: string
): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("ログインが必要です");

  const trimmed = title.trim();

  const { data, error } = await supabase
    .from("shelf_row_titles")
    .upsert(
      { user_id: session.user.id, row_index: rowIndex, title: trimmed || null },
      { onConflict: "user_id,row_index" }
    )
    .select("title")
    .single();
  if (error) throw error;
  return (data as DbShelfRowSetting).title;
}

// Same upsert-only-the-given-columns reasoning as saveShelfRowTitle above --
// a title already saved for this row is left untouched.
export async function saveShelfRowLighting(
  rowIndex: number,
  lighting: Lighting
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("ログインが必要です");

  const { error } = await supabase
    .from("shelf_row_titles")
    .upsert(
      { user_id: session.user.id, row_index: rowIndex, lighting },
      { onConflict: "user_id,row_index" }
    );
  if (error) throw error;
}
