"use client";

import styles from "@/app/page.module.css";
import { SearchHero } from "./SearchHero";
import { SearchForm } from "./SearchForm";
import { SearchStatus } from "./SearchStatus";
import { useSauceSearch } from "../hooks/useSauceSearch";
import { APP_TAGLINE, APP_TITLE, SEARCH_INSTRUCTIONS } from "../constants";

export function SauceSearchScreen() {
  const {
    urlInput,
    onUrlChange,
    handleUrlSubmit,
    fileInputRef,
    onFileInputChange,
    handlePaste,
    openFileDialog,
    dragActive,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    status,
    error,
    loading,
  } = useSauceSearch();

  return (
    <main
      className={`${styles.screen} ${dragActive ? styles.screenDrag : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className={styles.content}>
        <SearchHero
          title={APP_TITLE}
          tagline={APP_TAGLINE}
          instructions={SEARCH_INSTRUCTIONS}
        />

        <SearchForm
          urlValue={urlInput}
          dragActive={dragActive}
          onUrlChange={onUrlChange}
          onSubmit={handleUrlSubmit}
          onPaste={handlePaste}
          onBrowseClick={openFileDialog}
          onFileChange={onFileInputChange}
          fileInputRef={fileInputRef}
        />

        <SearchStatus status={status} error={error} loading={loading} />
      </div>
    </main>
  );
}
