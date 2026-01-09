import { useCallback, useEffect } from "react";
import type { ClipboardEvent as ReactClipboardEvent } from "react";

type PasteHandlerProps = {
    onFile: (file: File) => void;
    onUrl: (url: string) => void;
    attachGlobal?: boolean;
};

export function usePasteHandler({ onFile, onUrl, attachGlobal = false }: PasteHandlerProps) {
    const handleClipboardData = useCallback(
        (data: DataTransfer | null) => {
            if (!data) return false;

            // 1. Check for files
            if (data.files?.length) {
                const file = data.files[0];
                if (file && file.type.startsWith("image/")) {
                    onFile(file);
                    return true;
                }
            }

            // 2. Check for text/URL
            const text = data.getData("text/plain");
            if (text) {
                // Simple check to avoid random text, though caller usually validates
                if (text.startsWith("http")) {
                    onUrl(text);
                    return true;
                }
            }
            return false;
        },
        [onFile, onUrl],
    );

    const handleReactPaste = useCallback(
        (event: ReactClipboardEvent<HTMLInputElement | HTMLElement>) => {
            if (handleClipboardData(event.clipboardData)) {
                event.preventDefault();
            }
        },
        [handleClipboardData],
    );

    useEffect(() => {
        if (!attachGlobal) return;

        const onWindowPaste = (event: ClipboardEvent) => {
            // For global paste, we might want to be more selective or just try handling it
            if (handleClipboardData(event.clipboardData)) {
                event.preventDefault();
            }
        };
        window.addEventListener("paste", onWindowPaste);
        return () => window.removeEventListener("paste", onWindowPaste);
    }, [attachGlobal, handleClipboardData]);

    return { handleReactPaste };
}
