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
 */
export async function findArticleBySlug(slug: string) {
  // Try exact match first
  const article = await client.fetch(ARTICLE_BY_SLUG_QUERY, { slug });
  if (article) return article;

  // Fallback: normalize the incoming slug and check all stored slugs
  const normalizedIncoming = turkishSlugify(decodeURIComponent(slug));
  const allSlugs = await client.fetch(ALL_ARTICLE_SLUGS_QUERY);
  const matched = allSlugs?.find(
    (a: { slug: string }) => turkishSlugify(a.slug) === normalizedIncoming
  );

  if (matched?.slug) {
    return client.fetch(ARTICLE_BY_SLUG_QUERY, { slug: matched.slug });
  }

  return null;
}
