export function normalizeId(value) {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value instanceof String || value instanceof Number) return String(value);
  if (value._id) return normalizeId(value._id);
  if (value.$oid) return String(value.$oid);
  if (typeof value.toString === "function") {
    const text = value.toString();
    if (text && text !== "[object Object]") return text;
  }
  return "";
}
