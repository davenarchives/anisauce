import type { TraceMoeAniListInfo, TraceMoeMatch } from "../types";

export function getTraceAniListInfo(value: TraceMoeMatch["anilist"]) {
  if (value && typeof value === "object") {
    return value;
  }
  return null;
}

export function resolveAniListId(value: TraceMoeMatch["anilist"]) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const info = getTraceAniListInfo(value);
  if (typeof info?.id === "number" && Number.isFinite(info.id)) {
    return info.id;
  }
  return null;
}

export function pickTraceTitle(info: TraceMoeAniListInfo | null) {
  if (!info?.title) return null;
  return info.title.english || info.title.romaji || info.title.native || null;
}

export function pickTraceCoverImage(info: TraceMoeAniListInfo | null) {
  if (!info?.coverImage) return null;
  return (
    info.coverImage.extraLarge ||
    info.coverImage.large ||
    info.coverImage.medium ||
    null
  );
}
