export type TraceMoeAniListInfo = {
  id?: number;
  idMal?: number | null;
  title?: {
    english?: string | null;
    romaji?: string | null;
    native?: string | null;
  };
  coverImage?: {
    extraLarge?: string | null;
    large?: string | null;
    medium?: string | null;
  };
  bannerImage?: string | null;
  siteUrl?: string | null;
  episodes?: number | null;
};

export type TraceMoeMatch = {
  anilist: number | TraceMoeAniListInfo | null;
  filename?: string;
  episode?: number | null;
  from?: number | null;
  similarity: number;
  image?: string | null;
  video?: string | null;
};

export type TraceResponse = {
  result?: TraceMoeMatch[];
};

export type AniListMedia = {
  id: number;
  idMal?: number | null;
  title?: {
    english?: string | null;
    romaji?: string | null;
    native?: string | null;
  };
  description?: string | null;
  coverImage?: {
    extraLarge?: string | null;
    large?: string | null;
    medium?: string | null;
  };
  bannerImage?: string | null;
  seasonYear?: number | null;
  averageScore?: number | null;
  siteUrl?: string | null;
  episodes?: number | null;
};

export type TraceSearchRequest = {
  file?: File;
  url?: string;
};

export type TraceSearchPayload = TraceSearchRequest & {
  preview?: string | null;
};
