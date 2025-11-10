import type { SearchResult } from "../types";

export const RESULT_STORAGE_KEY = "anisauce:lastResult";

export function saveResult(result: SearchResult) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      RESULT_STORAGE_KEY,
      JSON.stringify({ savedAt: Date.now(), result }),
    );
  } catch (error) {
    console.warn("Failed to persist result", error);
  }
}

export function loadResult(): SearchResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.result ?? null;
  } catch (error) {
    console.warn("Failed to parse stored result", error);
    return null;
  }
}
