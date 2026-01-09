"use client";

import type {
  ChangeEvent,
  ClipboardEvent as ReactClipboardEvent,
  DragEvent,
  FormEvent,
} from "react";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTraceSearch } from "./useTraceSearch";
import { usePasteHandler } from "./usePasteHandler";

export function useSauceSearch() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [urlInput, setUrlInput] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const {
    executeSearch,
    loading,
    error,
    status,
    setState: setSearchState,
  } = useTraceSearch();

  const handleFileSelection = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setSearchState((prev) => ({
          ...prev,
          error: "Please choose an image file.",
        }));
        return;
      }

      const preview = URL.createObjectURL(file);
      setPreviewSrc(preview);
      setUrlInput("");

      executeSearch({ file, preview }, () => {
        setSearchState((prev) => ({
          ...prev,
          status: "Sauce acquired! Sending you to the preview...",
        }));
        router.push("/preview");
      });
    },
    [executeSearch, router, setSearchState],
  );

  const submitImageUrl = useCallback(
    (rawUrl: string) => {
      const trimmed = rawUrl.trim();
      if (!trimmed) {
        setSearchState((prev) => ({
          ...prev,
          error: "Paste an image URL first.",
        }));
        return;
      }
      try {
        const parsed = new URL(trimmed);
        if (!/^https?:/i.test(parsed.protocol)) {
          throw new Error("Invalid protocol");
        }
      } catch {
        setSearchState((prev) => ({
          ...prev,
          error: "That doesn't look like a valid image URL.",
        }));
        return;
      }

      setUrlInput(trimmed);
      setPreviewSrc(trimmed);
      setSearchState((prev) => ({ ...prev, error: null }));

      executeSearch({ url: trimmed, preview: trimmed }, () => {
        setSearchState((prev) => ({
          ...prev,
          status: "Sauce acquired! Sending you to the preview...",
        }));
        router.push("/preview");
      });
    },
    [executeSearch, router, setSearchState],
  );

  const handleUrlSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submitImageUrl(urlInput);
    },
    [submitImageUrl, urlInput],
  );

  const onFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelection(file);
        event.target.value = "";
      }
    },
    [handleFileSelection],
  );

  const { handleReactPaste } = usePasteHandler({
    onFile: handleFileSelection,
    onUrl: submitImageUrl,
    attachGlobal: true, // Existing behavior attaches global paste on home page
  });

  const handleDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragCounter.current += 1;
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      dragCounter.current = 0;
      setDragActive(false);
      const file = event.dataTransfer.files?.[0];
      if (file) {
        handleFileSelection(file);
      }
    },
    [handleFileSelection],
  );

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onUrlChange = useCallback((value: string) => {
    setSearchState((prev) => ({ ...prev, error: null }));
    setUrlInput(value);
  }, [setSearchState]);

  return {
    urlInput,
    onUrlChange,
    handleUrlSubmit,
    fileInputRef,
    onFileInputChange,
    handlePaste: handleReactPaste,
    dragActive,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    openFileDialog,
    status,
    error,
    loading,
  };
}
