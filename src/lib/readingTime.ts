/**
 * Portable Text bloklarından ortalama okuma süresini hesaplar.
 * Ortalama Türkçe okuma hızı: ~200 kelime/dk.
 * En az 1 dk döner.
 */

type TextChild = { _type?: string; text?: string };
type PortableBlock = {
  _type?: string;
  children?: TextChild[];
};

export function readingTimeMinutes(
  body: unknown,
  wordsPerMinute = 200,
): number {
  if (!Array.isArray(body)) return 1;

  let wordCount = 0;
  for (const block of body as PortableBlock[]) {
    if (!block || typeof block !== "object") continue;
    if (block._type !== "block" || !Array.isArray(block.children)) continue;
    for (const child of block.children) {
      if (child && typeof child.text === "string") {
        // Whitespace split — Türkçe için yeterli
        wordCount += child.text.trim().split(/\s+/).filter(Boolean).length;
      }
    }
  }

  const minutes = Math.max(1, Math.round(wordCount / wordsPerMinute));
  return minutes;
}
