export function documentTypeLabel(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return "Document";
  return value.replaceAll("_", " ");
}

export function fileSizeLabel(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "Size unavailable";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
