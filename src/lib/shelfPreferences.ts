const AUTO_REMOVE_BACKGROUND_KEY = "figure-sns:auto-remove-background";

// Off by default: background removal runs on every upload otherwise, which
// is slow (client-side WASM) and not always wanted.
export function getAutoRemoveBackground(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(AUTO_REMOVE_BACKGROUND_KEY) === "true";
  } catch {
    return false;
  }
}

export function setAutoRemoveBackground(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTO_REMOVE_BACKGROUND_KEY, String(value));
  } catch {
    // best-effort; ignore write failures (e.g. private browsing storage caps)
  }
}
