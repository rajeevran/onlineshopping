export function imageUrl(src) {
  if (!src) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/api/uploads/")) return src;
  if (src.startsWith("/uploads/")) return `/api${src}`;
  return src;
}
