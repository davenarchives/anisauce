export function buildVideoUrl(base?: string | null) {
  if (!base) return null;
  if (base.includes("size=")) return base;
  return `${base}${base.includes("?") ? "&" : "?"}size=l`;
}
