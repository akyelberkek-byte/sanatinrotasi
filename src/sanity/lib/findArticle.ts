import { client } from "@/sanity/client";
import {
  ARTICLE_BY_SLUG_QUERY,
  ALL_ARTICLE_SLUGS_QUERY,
} from "@/sanity/queries";
import { turkishSlugify } from "./slugify";

/**
 * Fetch an article by slug.
 * First tries exact match; if not found, normalizes both the param and
 * stored slugs using turkishSlugify and retries.
 * This makes URLs work even if an editor forgot to press "Generate" on the
 * Sanity slug field and saved a raw Turkish title as the slug.
 *
 * Cached via Next.js fetch cache (revalidate: 60s). This prevents an N+1
 * lookup on every 404 for bot traffic / random URLs.
 */
export async function findArticleBySlug(slug: string) {
  // Try exact match first (cached by Next)
  const article = await client.fetch(
    ARTICLE_BY_SLUG_QUERY,
    { slug },
    { next: { revalidate: 60 } }
  );
  if (article) return article;

  // Fallback: normalize the incoming slug and check all stored slugs.
  // Next.js 16 params'ı zaten decode ediyor, yine de bozuk encoding gelirse
  // URIError fırlatmasın diye güvenli decode.
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    /* Zaten decoded ya da hatalı encoding — raw slug'ı kullan */
  }
  const normalizedIncoming = turkishSlugify(decoded);
  if (!normalizedIncoming) return null;

  // This list of slugs is cached for 60s to avoid hammering Sanity when
  // random 404-inducing URLs come in (bots, broken links, etc.)
  const allSlugs = await client.fetch(
    ALL_ARTICLE_SLUGS_QUERY,
    {},
    { next: { revalidate: 60, tags: ["articles:slugs"] } }
  );
  const matched = allSlugs?.find(
    (a: { slug: string }) => turkishSlugify(a.slug) === normalizedIncoming
  );

  if (matched?.slug && matched.slug !== slug) {
    return client.fetch(
      ARTICLE_BY_SLUG_QUERY,
      { slug: matched.slug },
      { next: { revalidate: 60 } }
    );
  }

  return null;
}
