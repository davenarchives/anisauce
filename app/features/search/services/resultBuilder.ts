import type { SearchResult } from "@/app/types";
import type { TraceMoeMatch } from "../types";
import { fetchAniListMedia } from "./anilist";
import { chooseDescription, pickTitle } from "../utils/media";
import {
  getTraceAniListInfo,
  pickTraceCoverImage,
  pickTraceTitle,
  resolveAniListId,
} from "../utils/trace";
import { sanitizeFilename } from "../utils/text";

export async function buildResultFromMatch(match: TraceMoeMatch, preview: string | null): Promise<SearchResult> {
  const traceInfo = getTraceAniListInfo(match.anilist);
  const aniListId = resolveAniListId(match.anilist);
  const media = aniListId ? await fetchAniListMedia(aniListId) : null;
  const fallbackTitle = pickTraceTitle(traceInfo) ?? sanitizeFilename(match.filename);

  const traceCoverImage = pickTraceCoverImage(traceInfo);

  const aniListCoverImage =
    media?.coverImage?.extraLarge ??
    media?.coverImage?.large ??
    media?.coverImage?.medium ??
    traceCoverImage ??
    null;

  const bannerImage =
    media?.bannerImage ??
    traceInfo?.bannerImage ??
    aniListCoverImage ??
    null;

  return {
    animeTitle: pickTitle(media, fallbackTitle),
    episode: match.episode ?? media?.episodes ?? traceInfo?.episodes ?? null,
    timestamp: match.from ?? null,
    similarity: match.similarity ?? 0,
    description: chooseDescription(media),
    coverImage: aniListCoverImage ?? match.image ?? preview ?? undefined,
    bannerImage,
    seasonYear: media?.seasonYear ?? null,
    averageScore: media?.averageScore ?? null,
    siteUrl:
      media?.siteUrl ??
      traceInfo?.siteUrl ??
      (aniListId ? `https://anilist.co/anime/${aniListId}` : undefined),
    frameImage: match.image ?? preview ?? null,
    videoUrl: match.video ?? null,
  };
}
