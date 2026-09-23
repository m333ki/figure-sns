import { supabase } from "@/lib/supabase";

export const SHELF_ROW_COUNT = 4;

type DbShelfRowTitle = {
  row_index: number;
  title: string;
};

// Fixed-length array matching the number of shelf rows; entries are null
// until the user sets a custom title. Returns all-null (not an error) when
// logged out, same convention as fetchMyShelf().
export async function fetchMyShelfRowTitles(): Promise<(string | null)[]> {
  const empty: (string | null)[] = Array.from({ length: SHELF_ROW_COUNT }, () => null);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return empty;

  const { data, error } = await supabase
    .from("shelf_row_titles")
    .select("row_index, title")
    .eq("user_id", session.user.id);
  if (error) throw error;

  const titles = [...empty];
  for (const row of data as DbShelfRowTitle[]) {
    if (row.row_index >= 0 && row.row_index < SHELF_ROW_COUNT) {
      titles[row.row_index] = row.title;
    }
  }
  return titles;
}

// Saves the custom label for one shelf row, or clears it (deletes the row)
// when the trimmed title is blank. Returns the saved title (or null when
// cleared) so callers can sync local state without a refetch.
export async function saveShelfRowTitle(
  rowIndex: number,
  title: string
): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("ログインが必要です");

  const trimmed = title.trim();

  if (!trimmed) {
    const { error } = await supabase
      .from("shelf_row_titles")
      .delete()
      .eq("user_id", session.user.id)
      .eq("row_index", rowIndex);
    if (error) throw error;
    return null;
  }

  const { data, error } = await supabase
    .from("shelf_row_titles")
    .upsert(
      { user_id: session.user.id, row_index: rowIndex, title: trimmed },
      { onConflict: "user_id,row_index" }
    )
    .select("title")
    .single();
  if (error) throw error;
  return (data as DbShelfRowTitle).title;
}
