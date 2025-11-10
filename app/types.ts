export type SearchResult = {
  animeTitle: string;
  episode?: number | null;
  timestamp?: number | null;
  similarity: number;
  description?: string;
  coverImage?: string;
  bannerImage?: string | null;
  siteUrl?: string | null;
  frameImage?: string | null;
  videoUrl?: string | null;
};
