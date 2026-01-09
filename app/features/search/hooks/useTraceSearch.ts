import { useCallback, useState } from "react";
import { saveResult } from "@/app/lib/storage";
import { buildResultFromMatch } from "../services/resultBuilder";
import { searchTraceMatch } from "../services/traceSearch";
import type { TraceSearchPayload } from "../types";

type SearchState = {
    loading: boolean;
    error: string | null;
    status: string;
};

export function useTraceSearch() {
    const [state, setState] = useState<SearchState>({
        loading: false,
        error: null,
        status: "",
    });

    const executeSearch = useCallback(
        async ({ file, url, preview }: TraceSearchPayload, onSuccess?: () => void) => {
            try {
                setState({ loading: true, error: null, status: "Contacting trace.moe..." });

                const match = await searchTraceMatch({ file, url });

                setState((prev) => ({ ...prev, status: "Fetching anime details..." }));
                const card = await buildResultFromMatch(match, preview ?? null);

                saveResult(card);
                setState((prev) => ({
                    ...prev,
                    status: "Sauce acquired!",
                }));

                onSuccess?.();
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Something unexpected happened.";
                setState({ loading: false, error: message, status: "Try another frame or URL." });
            } finally {
                setState((prev) => ({ ...prev, loading: false }));
            }
        },
        [],
    );

    return {
        ...state,
        executeSearch,
        setState, // Expose setState in case parent needs to reset/modify manually (e.g. status)
    };
}
