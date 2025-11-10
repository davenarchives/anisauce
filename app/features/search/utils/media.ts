import type { AniListMedia } from "../types";
import { stripHtml, truncate } from "./text";

export function pickTitle(media: AniListMedia | null, fallbackName: string | null) {
  const title =
    media?.title?.english ||
    media?.title?.romaji ||
    media?.title?.native ||
    fallbackName ||
    "Unknown title";
  return title;
}

export function chooseDescription(media: AniListMedia | null) {
  const stripped = stripHtml(media?.description);
  if (stripped) {
    return truncate(stripped, 300);
  }
  return "Synopsis unavailable on AniList right now. Try another frame or check again later.";
}
