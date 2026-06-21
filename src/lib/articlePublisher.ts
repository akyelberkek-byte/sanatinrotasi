/**
 * Haber/yazı oluşturma helper'ı — Telegram bot, MCP, web form gibi
 * birden fazla giriş noktasından kullanılabilir.
 */

import { writeClient } from "@/sanity/writeClient";
import { client } from "@/sanity/client";
import { turkishSlugify } from "@/sanity/lib/slugify";
import { groq } from "next-sanity";

export interface PublishArticleParams {
  title: string;
  bodyText: string; // düz metin veya double-newline ile ayrılmış paragraflar
  imageBuffer?: Buffer;
  imageType?: string; // 'image/jpeg', 'image/png' vb.
  imageFilename?: string;
  categorySlug?: string; // verilirse Sanity'de bu slug'lı kategori aranır
  authorRef?: string; // _id; verilmezse featured yazar (Ela) atanır
  publishNow?: boolean; // false → draft (publishedAt null)
  excerpt?: string;
  source?: string; // log için (telegram, mcp, web)
}

export interface PublishResult {
  _id: string;
  slug: string;
  title: string;
  url: string;
  studioUrl: string;
  isDraft: boolean;
}

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

/** Sanity Asset'ine görsel yükler — buffer alır, asset _id döner. */
async function uploadImageAsset(
  buffer: Buffer,
  type: string,
  filename?: string,
): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (await (writeClient as any).assets.upload("image", buffer, {
      contentType: type,
      filename: filename || `upload-${Date.now()}.jpg`,
    })) as { _id: string };
    return result?._id || null;
  } catch (e) {
    console.error("Image upload failed:", e);
    return null;
  }
}

/** Slug'a göre kategori _id getirir, bulamazsa ilk kategoriyi döner. */
async function findCategoryRef(slug?: string): Promise<string | null> {
  if (slug) {
    const cat = await client
      .fetch<{ _id: string } | null>(
        groq`*[_type=="category" && slug.current==$slug][0]{_id}`,
        { slug },
        { cache: "no-store" },
      )
      .catch(() => null);
    if (cat?._id) return cat._id;
  }
  // Fallback: ilk kategori
  const first = await client
    .fetch<{ _id: string } | null>(
      groq`*[_type=="category"] | order(order asc) [0]{_id}`,
      {},
      { cache: "no-store" },
    )
    .catch(() => null);
  return first?._id || null;
}

/** Featured yazar (Ela) _id — yazar atanmazsa default. */
async function findDefaultAuthorRef(): Promise<string | null> {
  const founder = await client
    .fetch<{ _id: string } | null>(
      groq`*[_type=="author" && featured==true][0]{_id}`,
      {},
      { cache: "no-store" },
    )
    .catch(() => null);
  return founder?._id || null;
}

export async function publishArticle(
  params: PublishArticleParams,
): Promise<PublishResult> {
  // 1) Görsel yükle (varsa)
  let mainImage: object | null = null;
  if (params.imageBuffer) {
    const assetId = await uploadImageAsset(
      params.imageBuffer,
      params.imageType || "image/jpeg",
      params.imageFilename,
    );
    if (assetId) {
      mainImage = {
        _type: "image",
        asset: { _type: "reference", _ref: assetId },
      };
    }
  }

  // 2) Kategori
  const categoryId = await findCategoryRef(params.categorySlug);

  // 3) Yazar
  const authorId = params.authorRef || (await findDefaultAuthorRef());

  // 4) Body → portable text
  const body = textToPortableBlocks(params.bodyText || params.title);

  // 5) Slug
  const baseSlug = turkishSlugify(params.title).slice(0, 96) || "haber";

  // Slug çakışması varsa rastgele suffix
  const existing = await client
    .fetch<{ _id: string } | null>(
      groq`*[_type=="article" && slug.current==$slug][0]{_id}`,
      { slug: baseSlug },
      { cache: "no-store" },
    )
    .catch(() => null);
  const slug = existing
    ? `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    : baseSlug;

  // 6) Excerpt
  const excerpt =
    params.excerpt ||
    (params.bodyText || "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 180) ||
    params.title;

  // 7) Create
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = {
    _type: "article",
    title: params.title,
    slug: { _type: "slug", current: slug },
    excerpt,
    body,
    publishedAt: params.publishNow
      ? new Date().toISOString()
      : null,
  };
  if (mainImage) doc.mainImage = mainImage;
  if (categoryId)
    doc.category = { _type: "reference", _ref: categoryId };
  if (authorId) doc.author = { _type: "reference", _ref: authorId };

  const created = await writeClient.create(doc);

  return {
    _id: created._id,
    slug,
    title: params.title,
    url: `${SITE_URL}/yazilar/${slug}`,
    studioUrl: `${SITE_URL}/studio/structure/article;${created._id}`,
    isDraft: !params.publishNow,
  };
}
