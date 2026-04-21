import { client } from "@/sanity/client";
import { ROUTE_BY_SLUG_QUERY } from "@/sanity/queries";
import { turkishSlugify } from "./slugify";
import { groq } from "next-sanity";

const ALL_ROUTE_SLUGS_QUERY = groq`
  *[_type == "route" && defined(slug.current)] { "slug": slug.current }
`;

/**
 * Slug değişse bile eski paylaşımların çalışmaya devam etmesi için:
 * 1) Tam eşleşme dene (normal yol)
 * 2) Bulunamazsa: turkishSlugify ile normalize et, ortak kelimeler içeren
 *    en yakın rotayı bul (fuzzy match)
 *
 * findArticleBySlug ile aynı mantık, rotalar için.
 */
export async function findRouteBySlug(slug: string) {
  // 1) Tam eşleşme
  const route = await client.fetch(
    ROUTE_BY_SLUG_QUERY,
    { slug },
    { next: { revalidate: 60 } },
  );
  if (route) return route;

  // 2) Fuzzy fallback — güvenli decode
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    /* ignore */
  }
  const normalizedIncoming = turkishSlugify(decoded);
  if (!normalizedIncoming) return null;

  const allSlugs = await client.fetch<{ slug: string }[]>(
    ALL_ROUTE_SLUGS_QUERY,
    {},
    { next: { revalidate: 60, tags: ["routes:slugs"] } },
  );

  if (!Array.isArray(allSlugs) || allSlugs.length === 0) return null;

  // Önce tam slugify eşleşmesi ara
  const exact = allSlugs.find(
    (s) => turkishSlugify(s.slug) === normalizedIncoming,
  );
  if (exact?.slug) {
    return client.fetch(
      ROUTE_BY_SLUG_QUERY,
      { slug: exact.slug },
      { next: { revalidate: 60 } },
    );
  }

  // Son çare: ortak kelimeler bazlı en iyi eşleşme (eski slug'larda olası)
  const incomingWords = new Set(
    normalizedIncoming.split("-").filter((w) => w.length > 2),
  );
  if (incomingWords.size === 0) return null;

  let bestMatch: { slug: string; score: number } | null = null;
  for (const s of allSlugs) {
    const candidateWords = turkishSlugify(s.slug).split("-");
    let score = 0;
    for (const w of candidateWords) {
      if (incomingWords.has(w)) score++;
    }
    if (score >= 2 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { slug: s.slug, score };
    }
  }

  if (bestMatch?.slug) {
    return client.fetch(
      ROUTE_BY_SLUG_QUERY,
      { slug: bestMatch.slug },
      { next: { revalidate: 60 } },
    );
  }

  return null;
}
