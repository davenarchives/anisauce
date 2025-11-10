import { traceInstance } from "@/app/lib/api";
import type { TraceMoeMatch, TraceResponse, TraceSearchRequest } from "../types";

const TRACE_PARAMS = { anilistInfo: true };

export async function searchTraceMatch({ file, url }: TraceSearchRequest): Promise<TraceMoeMatch> {
  const response = await (async () => {
    if (file) {
      const formData = new FormData();
      formData.append("image", file);
      return traceInstance.post("", formData, {
        params: TRACE_PARAMS,
      });
    }
    if (url) {
      return traceInstance.get("", {
        params: { ...TRACE_PARAMS, url },
      });
    }
    throw new Error("Provide an image file or URL first.");
  })();

  const data: TraceResponse = response.data;
  const match = data.result?.[0];

  if (!match) {
    throw new Error("No matches found. Try another frame.");
  }

  return match;
}
