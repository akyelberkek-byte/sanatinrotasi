import type { MetadataRoute } from "next";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";

const SITE_URL = "https://sanatinrotasi.com";

// Sitemap'i her istekte rebuild etme — bot trafiği Sanity'yi hammer etmesin.
export const revalidate = 3600; // 1 saat

type SlugEntry = { slug: string; _updatedAt: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Her fetch ayrı catch'te — Sanity kısmi hata verirse sitemap komple düşmesin.
  const [articles, events, routes, categories] = await Promise.all([
    client
      .fetch<SlugEntry[]>(
        groq`*[_type == "article" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`,
      )
      .catch(() => []),
    client
      .fetch<SlugEntry[]>(
        groq`*[_type == "event" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`,
      )
      .catch(() => []),
    client
      .fetch<SlugEntry[]>(
        groq`*[_type == "route" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`,
      )
      .catch(() => []),
    client
      .fetch<SlugEntry[]>(
        groq`*[_type == "category" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`,
      )
      .catch(() => []),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/yazilar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/roportajlar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/etkinlikler`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/rotalar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/hakkinda`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/topluluk`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/iletisim`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/kvkk`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/acik-riza`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const toEntry = (
    prefix: string,
    items: SlugEntry[],
    changeFrequency: "weekly" | "monthly",
    priority: number,
  ): MetadataRoute.Sitemap =>
    items
      .filter((i) => i && i.slug)
      .map((i) => ({
        url: `${SITE_URL}${prefix}/${i.slug}`,
        lastModified: i._updatedAt ? new Date(i._updatedAt) : new Date(),
        changeFrequency,
        priority,
      }));

  return [
    ...staticPages,
    ...toEntry("/yazilar", articles, "weekly", 0.8),
    ...toEntry("/etkinlikler", events, "weekly", 0.7),
    ...toEntry("/rotalar", routes, "monthly", 0.7),
    ...toEntry("/kategori", categories, "weekly", 0.6),
  ];
}
