/**
 * Yazı / Rota / Etkinlik publish helper'ları.
 * Telegram bot, MCP, web form gibi farklı giriş noktalarından kullanılır.
 */

import { writeClient } from "@/sanity/writeClient";
import { client } from "@/sanity/client";
import { turkishSlugify } from "@/sanity/lib/slugify";
import { groq } from "next-sanity";

const SITE_URL = "https://sanatinrotasi.com";

function uniqueKey(prefix: string, i: number): string {
  return `${prefix}-${Date.now().toString(36)}-${i}`;
}

/** Düz metni Sanity portable text bloklarına çevirir (paragraf bazlı). */
function textToPortableBlocks(text: string) {
  return text
    .trim()
    .split(/\n\n+/)
    .map((para, i) => {
      const trimmed = para.trim();
      if (!trimmed) return null;
      return {
        _type: "block",
        _key: uniqueKey("b", i),
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: uniqueKey("s", i),
            text: trimmed,
            marks: [],
          },
        ],
      };
    })
    .filter(Boolean);
}

/** Sanity Asset'ine görsel yükler — buffer alır, asset {_id, url} döner. */
export async function uploadImageAsset(
  buffer: Buffer,
  type: string,
  filename?: string,
): Promise<{ _id: string; url: string } | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (await (writeClient as any).assets.upload("image", buffer, {
      contentType: type,
      filename: filename || `upload-${Date.now()}.jpg`,
    })) as { _id: string; url: string };
    return result?._id ? { _id: result._id, url: result.url } : null;
  } catch (e) {
    console.error("Image upload failed:", e);
    return null;
  }
}

/** Slug'a göre kategori _id ve title getirir. */
export async function findCategoryBySlug(
  slug?: string,
): Promise<{ _id: string; title: string; slug: string } | null> {
  if (slug) {
    const cat = await client
      .fetch<{ _id: string; title: string; slug: { current: string } } | null>(
        groq`*[_type=="category" && slug.current==$slug][0]{_id, title, slug}`,
        { slug },
        { cache: "no-store" },
      )
      .catch(() => null);
    if (cat?._id) return { _id: cat._id, title: cat.title, slug: cat.slug.current };
  }
  return null;
}

/** Tüm kategorileri getir (button seçimi için). */
export async function listCategories(): Promise<
  Array<{ _id: string; title: string; slug: string }>
> {
  const cats = await client
    .fetch<Array<{ _id: string; title: string; slug: { current: string } }>>(
      groq`*[_type=="category" && defined(slug.current)] | order(order asc, title asc) {_id, title, slug}`,
      {},
      { cache: "no-store" },
    )
    .catch(() => []);
  return cats.map((c) => ({ _id: c._id, title: c.title, slug: c.slug.current }));
}

/** Tüm yazarları getir (button seçimi için). */
export async function listAuthors(): Promise<
  Array<{ _id: string; name: string }>
> {
  const authors = await client
    .fetch<Array<{ _id: string; name: string }>>(
      groq`*[_type=="author"] | order(featured desc, name asc) {_id, name}`,
      {},
      { cache: "no-store" },
    )
    .catch(() => []);
  return authors;
}

/** Slug çakışmasını kontrol et ve gerekirse rastgele suffix ekle. */
async function uniqueSlugForType(
  type: string,
  baseSlug: string,
): Promise<string> {
  const existing = await client
    .fetch<{ _id: string } | null>(
      groq`*[_type==$type && slug.current==$slug][0]{_id}`,
      { type, slug: baseSlug },
      { cache: "no-store" },
    )
    .catch(() => null);
  if (!existing) return baseSlug;
  return `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ============================================================
   YAZI publish
   ============================================================ */

export interface PublishArticleParams {
  title: string;
  slug?: string; // verilirse override eder, yoksa turkishSlugify(title)
  bodyText: string;
  authorRef?: string;
  categoryRef?: string;
  mainImageAssetId?: string;
  altText?: string;
  excerpt?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  ogImageAssetId?: string;
  publishNow?: boolean;
}

export async function publishArticle(params: PublishArticleParams): Promise<{
  _id: string;
  slug: string;
  url: string;
  studioUrl: string;
}> {
  const baseSlug =
    params.slug || turkishSlugify(params.title).slice(0, 96) || "haber";
  const slug = await uniqueSlugForType("article", baseSlug);

  const body = textToPortableBlocks(params.bodyText || params.title);

  const mainImage = params.mainImageAssetId
    ? {
        _type: "image",
        asset: { _type: "reference", _ref: params.mainImageAssetId },
        alt: params.altText,
      }
    : null;

  const ogImage = params.ogImageAssetId
    ? {
        _type: "image",
        asset: { _type: "reference", _ref: params.ogImageAssetId },
      }
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = {
    _type: "article",
    title: params.title,
    slug: { _type: "slug", current: slug },
    excerpt: params.excerpt || params.bodyText?.slice(0, 180),
    body,
    publishedAt: params.publishNow ? new Date().toISOString() : null,
  };
  if (mainImage) doc.mainImage = mainImage;
  if (params.authorRef)
    doc.author = { _type: "reference", _ref: params.authorRef };
  if (params.categoryRef)
    doc.category = { _type: "reference", _ref: params.categoryRef };
  if (params.tags && params.tags.length > 0) doc.tags = params.tags;
  if (
    params.metaTitle ||
    params.metaDescription ||
    ogImage
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seo: any = {};
    if (params.metaTitle) seo.metaTitle = params.metaTitle;
    if (params.metaDescription) seo.metaDescription = params.metaDescription;
    if (ogImage) seo.ogImage = ogImage;
    doc.seo = seo;
  }

  const created = await writeClient.create(doc);
  return {
    _id: created._id,
    slug,
    url: `${SITE_URL}/yazilar/${slug}`,
    studioUrl: `${SITE_URL}/studio/structure/article;${created._id}`,
  };
}

/* ============================================================
   ROTA publish
   ============================================================ */

export interface PublishRouteParams {
  title: string;
  slug?: string;
  subtitle?: string;
  city?: string;
  descriptionText: string;
  mainImageAssetId?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  ogImageAssetId?: string;
  publishNow?: boolean;
}

export async function publishRoute(params: PublishRouteParams): Promise<{
  _id: string;
  slug: string;
  url: string;
  studioUrl: string;
}> {
  const baseSlug =
    params.slug || turkishSlugify(params.title).slice(0, 96) || "rota";
  const slug = await uniqueSlugForType("route", baseSlug);

  const description = textToPortableBlocks(params.descriptionText || params.title);

  const mainImage = params.mainImageAssetId
    ? {
        _type: "image",
        asset: { _type: "reference", _ref: params.mainImageAssetId },
      }
    : null;

  const ogImage = params.ogImageAssetId
    ? {
        _type: "image",
        asset: { _type: "reference", _ref: params.ogImageAssetId },
      }
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = {
    _type: "route",
    title: params.title,
    slug: { _type: "slug", current: slug },
    subtitle: params.subtitle,
    city: params.city || "Eskişehir",
    description,
  };
  if (mainImage) doc.mainImage = mainImage;
  if (params.tags && params.tags.length > 0) doc.tags = params.tags;
  if (params.metaTitle || params.metaDescription || ogImage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seo: any = {};
    if (params.metaTitle) seo.metaTitle = params.metaTitle;
    if (params.metaDescription) seo.metaDescription = params.metaDescription;
    if (ogImage) seo.ogImage = ogImage;
    doc.seo = seo;
  }
  if (params.publishNow === false) {
    // route'da publishedAt field'ı yok — draft modu için kullanılmaz
    // Studio'dan publish/unpublish edilebilir, default published
  }

  const created = await writeClient.create(doc);
  return {
    _id: created._id,
    slug,
    url: `${SITE_URL}/rotalar/${slug}`,
    studioUrl: `${SITE_URL}/studio/structure/route;${created._id}`,
  };
}
