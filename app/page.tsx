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

const newRocker = New_Rocker({
  subsets: ["latin"],
  weight: "400",
});

type TraceMoeMatch = {
  anilist: number;
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

        let response: Response;
        if (file) {
          const formData = new FormData();
          formData.append("image", file);
          response = await fetch("https://api.trace.moe/search?anilistInfo", {
            method: "POST",
            body: formData,
          });
        } else if (url) {
          response = await fetch(
            `https://api.trace.moe/search?anilistInfo&url=${encodeURIComponent(url)}`,
          );
        } else {
          throw new Error("Provide an image file or URL first.");
        }

        if (!response.ok) {
          throw new Error("trace.moe could not process this image.");
        }

        const data: TraceResponse = await response.json();
        const match = data.result?.[0];

        if (!match) {
          throw new Error("No matches found. Try another frame.");
        }

        setStatus("Fetching anime details...");
        const media = await fetchAniListMedia(match.anilist);

        const card: SearchResult = {
          animeTitle: pickTitle(media, match),
          episode: match.episode ?? media?.episodes ?? null,
          timestamp: match.from ?? null,
          similarity: match.similarity ?? 0,
          description: chooseDescription(media),
          coverImage:
            media?.coverImage?.extraLarge ??
            media?.coverImage?.large ??
            media?.coverImage?.medium ??
            undefined,
          bannerImage: media?.bannerImage ?? null,
          siteUrl: media?.siteUrl ?? (media?.id ? `https://anilist.co/anime/${media.id}` : undefined),
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

function pickTitle(media: AniListMedia | null, match: TraceMoeMatch) {
  return (
    media?.title?.english ||
    media?.title?.romaji ||
    media?.title?.native ||
    match.filename ||
    "Unknown title"
  );
}

function chooseDescription(media: AniListMedia | null) {
  const stripped = stripHtml(media?.description);
  if (stripped) {
    return truncate(stripped, 300);
  }
  return "The second season of Solo Leveling. Mastering his new abilities in secret, Jin-Woo must battle humanity's toughest foes to save his mother. (Source: AniList)";
}

const ANI_LIST_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      description(asHtml: false)
      coverImage {
        extraLarge
        large
        medium
      }
      bannerImage
      episodes
      siteUrl
    }
  }
`;

async function fetchAniListMedia(id: number): Promise<AniListMedia | null> {
  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: ANI_LIST_QUERY,
        variables: { id },
      }),
    });

    if (!response.ok) {
      console.warn("AniList request failed", response.statusText);
      return null;
    }

    const payload = await response.json();
    return payload.data?.Media ?? null;
  } catch (error) {
    console.error("AniList fetch error", error);
    return null;
  }
}
