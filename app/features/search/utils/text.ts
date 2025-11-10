export function stripHtml(value?: string | null) {
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

export function truncate(text: string, length: number) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length - 1)}...` : text;
}

export function sanitizeFilename(name?: string | null) {
  if (!name) return null;
  let value = name;
  value = value.replace(/\.[a-z0-9]{2,4}$/i, " ");
  value = value.replace(/[\[\(][^\]\)]+[\]\)]/g, " ");
  value = value.replace(/\b(BD|WEB[- ]?DL|RAW|x264|x265|AAC|FLAC|1080p|720p|480p|HEVC|HDR|MP4|MKV)\b/gi, " ");
  value = value.replace(/[-_.]/g, " ");
  value = value.replace(/\s+/g, " ").trim();
  return value || null;
}
