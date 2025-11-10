/** @format */

import axios from "axios";

export const TRACE_MOE_QUERY = "https://api.trace.moe/search";
export const ANILIST_QUERY = "https://graphql.anilist.co";

const traceHeaders: Record<string, string> = {
  Accept: "application/json",
};

const traceKey =
  process.env.NEXT_PUBLIC_API_KEY ??
  process.env.NEXT_PUBLIC_TRACE_KEY ??
  process.env.API_KEY ??
  null;

if (traceKey) {
  traceHeaders["x-trace-key"] = traceKey;
}

export const options = {
  headers: traceHeaders,
};

export const traceInstance = axios.create({
  baseURL: TRACE_MOE_QUERY,
  ...options,
});

export const aniListInstance = axios.create({
  baseURL: ANILIST_QUERY,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const ANI_LIST_QUERY = `
query ($id: Int) {
  Media (id:$id , type: ANIME) { 
    id
    idMal
    title {
      english
      native
      romaji
    }
    description(asHtml:false)
    seasonYear
    coverImage {
      extraLarge
      large
      medium
    }
    bannerImage
    genres
    externalLinks {
      id
      url
      site
    }
    averageScore
    siteUrl
    episodes
  }
}
`;
