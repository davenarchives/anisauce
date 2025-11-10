import { aniListInstance, ANI_LIST_QUERY } from "@/app/lib/api";
import type { AniListMedia } from "../types";

export async function fetchAniListMedia(id: number): Promise<AniListMedia | null> {
  try {
    const response = await aniListInstance.post("", {
      query: ANI_LIST_QUERY,
      variables: { id },
    });
    return response.data?.data?.Media ?? null;
  } catch (error) {
    console.error("AniList fetch error", error);
    return null;
  }
}
