/**
 * Turkish-aware slugifier.
 * Converts Turkish characters to ASCII equivalents, lowercases, replaces
 * non-alphanumeric characters with hyphens, and trims edges.
 * Ensures URLs are safe: e.g. "Sanatın Rotası Nasıl Kuruldu?" → "sanatin-rotasi-nasil-kuruldu"
 */
export function turkishSlugify(input: string): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "c")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}
