"use client";

import type {
  ChangeEvent,
  ClipboardEvent as ReactClipboardEvent,
  DragEvent,
  FormEvent,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveResult } from "@/app/lib/storage";
import { buildResultFromMatch } from "../services/resultBuilder";
import { searchTraceMatch } from "../services/traceSearch";
import type { TraceSearchPayload } from "../types";

type ClipboardOptions = {
  silentErrors?: boolean;
};

export function useSauceSearch() {
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
    async ({ file, url, preview }: TraceSearchPayload) => {
      try {
        setLoading(true);
        setError(null);
        setStatus("Contacting trace.moe...");

        const match = await searchTraceMatch({ file, url });

        setStatus("Fetching anime details...");
        const card = await buildResultFromMatch(match, preview ?? null);

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

  const handleUrlSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submitImageUrl(urlInput, true);
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

  const handleClipboardData = useCallback(
    (data: DataTransfer | null, options: ClipboardOptions = {}) => {
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
        return submitImageUrl(text, !options.silentErrors);
      }
      return false;
    },
    [handleFileSelection, submitImageUrl],
  );

  const handlePaste = useCallback(
    (event: ReactClipboardEvent<HTMLInputElement>) => {
      if (handleClipboardData(event.clipboardData, { silentErrors: false })) {
        event.preventDefault();
      }
    },
    [handleClipboardData],
  );

  useEffect(() => {
    const onWindowPaste = (event: ClipboardEvent) => {
      if (handleClipboardData(event.clipboardData, { silentErrors: true })) {
        event.preventDefault();
      }
    };
    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [handleClipboardData]);

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
    setError(null);
    setUrlInput(value);
  }, []);

  return {
    urlInput,
    onUrlChange,
    handleUrlSubmit,
    fileInputRef,
    onFileInputChange,
    handlePaste,
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
