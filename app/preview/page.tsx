"use client";

/* eslint-disable @next/next/no-img-element */

import type { CSSProperties } from "react";
import { startTransition, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";
import type { SearchResult } from "../types";
import { loadResult } from "../lib/storage";
import { buildVideoUrl } from "../lib/media";
import { formatTimestamp } from "../lib/format";
import { useTraceSearch } from "../features/search/hooks/useTraceSearch";
import { usePasteHandler } from "../features/search/hooks/usePasteHandler";
import { SearchStatus } from "../features/search/components/SearchStatus";

export default function PreviewPage() {
  const router = useRouter();
  const [result, setResult] = useState<SearchResult | null>(null);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoErrored, setVideoErrored] = useState(false);

  const {
    executeSearch,
    loading,
    error,
    status,
    setState: setSearchState,
  } = useTraceSearch();

  useEffect(() => {
    const stored = loadResult();
    if (stored) {
      startTransition(() => setResult(stored));
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      setVideoMuted(true);
      setVideoErrored(false);
    });
  }, [result?.videoUrl]);

  const handleSearchSuccess = useCallback(() => {
    // Reload result from storage after a successful search
    const stored = loadResult();
    if (stored) {
      startTransition(() => setResult(stored));
    }
    // Clear search status after a short delay so the user sees "Sauce acquired!"
    setTimeout(() => {
      setSearchState((prev) => ({ ...prev, status: "", error: null }));
    }, 1500);
  }, [setSearchState]);

  const handleFileSelection = useCallback(
    (file: File) => {
      const preview = URL.createObjectURL(file);
      executeSearch({ file, preview }, handleSearchSuccess);
    },
    [executeSearch, handleSearchSuccess],
  );

  const submitImageUrl = useCallback(
    (url: string) => {
      executeSearch({ url, preview: url }, handleSearchSuccess);
    },
    [executeSearch, handleSearchSuccess],
  );

  usePasteHandler({
    onFile: handleFileSelection,
    onUrl: submitImageUrl,
    attachGlobal: true,
  });

  const videoUrl =
    result?.videoUrl && !videoErrored ? buildVideoUrl(result.videoUrl) : null;

  // Show loading overlay if searching
  if (loading || status && !result) {
    return (
      <main className={styles.resultScreen}>
        <div className={styles.resultContent}>
          <SearchStatus status={status} error={error} loading={loading} />
        </div>
      </main>
    )
  }

  if (!result) {
    return (
      <main className={styles.resultScreen}>
        <div className={styles.resultContent}>
          {/* Also show status here if we have an error but no result yet */}
          {(status || error) && (
            <div style={{ marginBottom: "2rem" }}>
              <SearchStatus status={status} error={error} loading={loading} />
            </div>
          )}
          <p className={styles.ghostState}>
            No preview available yet. Run a search first.
          </p>
          <div className={styles.navRow}>
            <button className={styles.secondaryButton} onClick={() => router.push("/")}>
              back to search
            </button>
          </div>
        </div>
      </main>
    );
  }

  const stillFrame = result.frameImage;
  const displayCover = result.coverImage ?? null;
  const cardBackdrop = result.bannerImage ?? displayCover ?? result.frameImage ?? null;
  const similarityPercent = Math.max(0, Math.round(result.similarity * 100));

  return (
    <main className={styles.resultScreen}>
      {/* Overlay for loading state on top of existing result */}
      {(loading || (status && status !== "Sauce acquired!")) && (
        <div className={styles.loadingOverlay}>
          <SearchStatus status={status} error={error} loading={loading} />
        </div>
      )}

      <div className={styles.resultContent}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionRule} />
          <span className={styles.sectionLabel}>anime preview</span>
          <span className={styles.sectionRule} />
        </div>

        <div className={styles.previewFrame}>
          {videoUrl ? (
            <>
              <video
                className={styles.previewVideo}
                key={videoUrl}
                poster={stillFrame ?? undefined}
                muted={videoMuted}
                loop
                playsInline
                autoPlay
                preload="metadata"
                crossOrigin="anonymous"
                onError={() => setVideoErrored(true)}
              >
                <source src={videoUrl} type="video/mp4" />
              </video>
              <button
                type="button"
                className={styles.soundButton}
                onClick={() => setVideoMuted((prev) => !prev)}
                aria-label={videoMuted ? "Unmute preview" : "Mute preview"}
              >
                <i
                  className={`fa-solid ${videoMuted ? "fa-volume-xmark" : "fa-volume-high"
                    }`}
                  aria-hidden="true"
                />
              </button>
            </>
          ) : stillFrame ? (
            <img src={stillFrame} alt="Preview frame" />
          ) : (
            <p className={styles.ghostState}>Preview not available.</p>
          )}
        </div>

        <div className={styles.sectionHeader}>
          <span className={styles.sectionRule} />
          <span className={styles.sectionLabel}>sauce</span>
          <span className={styles.sectionRule} />
        </div>

        <article className={styles.resultCard}>
          <div
            className={styles.cardHero}
            style={
              cardBackdrop
                ? ({ "--banner-url": `url(${cardBackdrop})` } as CSSProperties)
                : undefined
            }
            aria-hidden="true"
          />
          <div className={styles.cardBody}>
            <div className={styles.coverWrap}>
              {displayCover ? (
                <img src={displayCover} alt={`${result.animeTitle} cover art`} />
              ) : (
                <div className={styles.coverFallback}>Ani</div>
              )}
            </div>
            <div className={styles.info}>
              <h2 className={styles.resultTitle}>{result.animeTitle}</h2>
              <p className={styles.sourceLine}>
                sauce:
                {typeof result.episode === "number" ? ` Ep ${result.episode}` : " unknown"}
                {typeof result.timestamp === "number"
                  ? ` at ${formatTimestamp(result.timestamp)}`
                  : ""}
                <span className={styles.similarity}>
                  {similarityPercent}% Similarity
                </span>
              </p>
              {(result.seasonYear || typeof result.averageScore === "number") && (
                <p className={styles.metaLine}>
                  {result.seasonYear && (
                    <span className={styles.metaPill}>Season Year: {result.seasonYear}</span>
                  )}
                  {typeof result.averageScore === "number" && (
                    <span className={styles.metaPill}>
                      AniList Score: {result.averageScore}%
                    </span>
                  )}
                </p>
              )}
              <p className={styles.description}>
                {result.description || "We couldn't load a synopsis for this match."}
              </p>
              <div className={styles.actionRow}>
                {result.siteUrl && (
                  <a
                    href={result.siteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.actionLink}
                  >
                    view on anilist
                  </a>
                )}
              </div>
            </div>
          </div>
        </article>

        <div className={styles.navRow}>
          <button className={styles.secondaryButton} onClick={() => router.push("/")}>
            new search
          </button>
        </div>
      </div>
    </main>
  );
}

