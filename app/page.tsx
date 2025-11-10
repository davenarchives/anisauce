"use client";

import type {
  ChangeEvent,
  ClipboardEvent as ReactClipboardEvent,
  DragEvent,
  FormEvent,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { New_Rocker } from "next/font/google";
import styles from "./page.module.css";
import type { SearchResult } from "./types";
import { saveResult } from "./lib/storage";
import { traceInstance, aniListInstance, ANI_LIST_QUERY } from "./lib/api";

const newRocker = New_Rocker({
  subsets: ["latin"],
  weight: "400",
});

type TraceMoeAniListInfo = {
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

type TraceMoeMatch = {
  anilist: number | TraceMoeAniListInfo | null;
  filename?: string;
  episode?: number | null;
  from?: number | null;
  similarity: number;
  image?: string | null;
  video?: string | null;
};

type TraceResponse = {
  result?: TraceMoeMatch[];
};

type AniListMedia = {
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

type SearchPayload = {
  file?: File;
  url?: string;
  preview?: string | null;
};

const instructions = "browse, drop, or ctrl + v to paste a screenshot~";

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [urlInput, setUrlInput] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    return () => {
      if (previewSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  const runTraceSearch = useCallback(
    async ({ file, url, preview }: SearchPayload) => {
      try {
        setLoading(true);
        setError(null);
        setStatus("Contacting trace.moe...");

        const traceParams = { anilistInfo: true };
        const response = await (async () => {
          if (file) {
            const formData = new FormData();
            formData.append("image", file);
            return traceInstance.post("", formData, {
              params: traceParams,
            });
          }
          if (url) {
            return traceInstance.get("", {
              params: { ...traceParams, url },
            });
          }
          throw new Error("Provide an image file or URL first.");
        })();

        const data: TraceResponse = response.data;
        const match = data.result?.[0];

        if (!match) {
          throw new Error("No matches found. Try another frame.");
        }

        setStatus("Fetching anime details...");
        const traceInfo = getTraceAniListInfo(match.anilist);
        const aniListId = resolveAniListId(match.anilist);
        const media = aniListId ? await fetchAniListMedia(aniListId) : null;
        const fallbackTitle =
          pickTraceTitle(traceInfo) ?? sanitizeFilename(match.filename);

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

        const card: SearchResult = {
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

        saveResult(card);
        setStatus("Sauce acquired! Sending you to the preview...");
        router.push("/preview");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something unexpected happened.";
        setError(message);
        setStatus("Try another frame or URL.");
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const handleFileSelection = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please choose an image file.");
        return;
      }

      const preview = URL.createObjectURL(file);
      setPreviewSrc(preview);
      setStatus("Finding sauce...");
      setUrlInput("");
      runTraceSearch({ file, preview });
    },
    [runTraceSearch],
  );

  const submitImageUrl = useCallback(
    (rawUrl: string, showErrors = true) => {
      const trimmed = rawUrl.trim();
      if (!trimmed) {
        if (showErrors) {
          setError("Paste an image URL first.");
        }
        return false;
      }
      try {
        const parsed = new URL(trimmed);
        if (!/^https?:/i.test(parsed.protocol)) {
          throw new Error("Invalid protocol");
        }
      } catch {
        if (showErrors) {
          setError("That doesn't look like a valid image URL.");
        }
        return false;
      }

      setUrlInput(trimmed);
      setPreviewSrc(trimmed);
      setStatus("Finding sauce...");
      setError(null);
      runTraceSearch({ url: trimmed, preview: trimmed });
      return true;
    },
    [runTraceSearch],
  );

  const handleUrlSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitImageUrl(urlInput, true);
  };

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelection(file);
      event.target.value = "";
    }
  };

  const handleClipboardData = useCallback(
    (data: DataTransfer | null, { silentErrors = false } = {}) => {
      if (!data) return false;
      if (data.files?.length) {
        const file = data.files[0];
        if (file) {
          handleFileSelection(file);
          return true;
        }
      }
      const text = data.getData("text/plain");
      if (text) {
        return submitImageUrl(text, !silentErrors);
      }
      return false;
    },
    [handleFileSelection, submitImageUrl],
  );

  const handlePaste = (event: ReactClipboardEvent<HTMLInputElement>) => {
    if (handleClipboardData(event.clipboardData, { silentErrors: false })) {
      event.preventDefault();
    }
  };

  useEffect(() => {
    const onWindowPaste = (event: ClipboardEvent) => {
      if (handleClipboardData(event.clipboardData, { silentErrors: true })) {
        event.preventDefault();
      }
    };
    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [handleClipboardData]);

  const handleDragEnter = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragCounter.current += 1;
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragCounter.current = 0;
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <main
      className={`${styles.screen} ${dragActive ? styles.screenDrag : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className={styles.content}>
        <div className={styles.titleBlock}>
          <h1 className={`${styles.title} ${newRocker.className}`}>AniSauce</h1>
          <p className={styles.tagline}>anime source finder</p>
        </div>
        <p className={styles.instructions}>{instructions}</p>

        <form
          className={`${styles.inputRow} ${dragActive ? styles.inputRowActive : ""}`}
          onSubmit={handleUrlSubmit}
        >
          <button
            type="button"
            className={styles.folderButton}
            onClick={openFileDialog}
            aria-label="Browse for an image"
          >
            <i className="fa-solid fa-folder-open" aria-hidden="true" />
          </button>
          <div className={styles.inputShell}>
            <input
              className={styles.urlInput}
              type="text"
              placeholder="paste image url"
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              onPaste={handlePaste}
              aria-label="Paste image URL"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={onFileInputChange}
          />
        </form>

        {status && <p className={styles.status}>{status}</p>}
        {error && <p className={styles.error}>{error}</p>}
        {loading && <p className={styles.loading}>Searching the multiverse...</p>}
      </div>
    </main>
  );
}

function stripHtml(value?: string | null) {
  if (!value) return null;
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "-")
    .replace(/&ndash;/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, length: number) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length - 1)}...` : text;
}

function sanitizeFilename(name?: string | null) {
  if (!name) return null;
  let value = name;
  value = value.replace(/\.[a-z0-9]{2,4}$/i, " ");
  value = value.replace(/[\[\(][^\]\)]+[\]\)]/g, " ");
  value = value.replace(/\b(BD|WEB[- ]?DL|RAW|x264|x265|AAC|FLAC|1080p|720p|480p|HEVC|HDR|MP4|MKV)\b/gi, " ");
  value = value.replace(/[-_.]/g, " ");
  value = value.replace(/\s+/g, " ").trim();
  return value || null;
}

function getTraceAniListInfo(value: TraceMoeMatch["anilist"]) {
  if (value && typeof value === "object") {
    return value;
  }
  return null;
}

function resolveAniListId(value: TraceMoeMatch["anilist"]) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const info = getTraceAniListInfo(value);
  if (typeof info?.id === "number" && Number.isFinite(info.id)) {
    return info.id;
  }
  return null;
}

function pickTraceTitle(info: TraceMoeAniListInfo | null) {
  if (!info?.title) return null;
  return info.title.english || info.title.romaji || info.title.native || null;
}

function pickTraceCoverImage(info: TraceMoeAniListInfo | null) {
  if (!info?.coverImage) return null;
  return (
    info.coverImage.extraLarge ||
    info.coverImage.large ||
    info.coverImage.medium ||
    null
  );
}

function pickTitle(media: AniListMedia | null, fallbackName: string | null) {
  const title =
    media?.title?.english ||
    media?.title?.romaji ||
    media?.title?.native ||
    fallbackName ||
    "Unknown title";
  return title;
}

function chooseDescription(media: AniListMedia | null) {
  const stripped = stripHtml(media?.description);
  if (stripped) {
    return truncate(stripped, 300);
  }
  return "Synopsis unavailable on AniList right now. Try another frame or check again later.";
}

async function fetchAniListMedia(id: number): Promise<AniListMedia | null> {
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
