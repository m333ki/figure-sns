const STORAGE_KEY = "figure-sns:saved-post-ids";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function getSavedPostIds(): Set<string> {
  return new Set(readIds());
}

export function setPostSaved(postId: string, saved: boolean): void {
  const ids = new Set(readIds());
  if (saved) ids.add(postId);
  else ids.delete(postId);
  writeIds(Array.from(ids));
}
