import type { MetadataRoute } from "next";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";

const SITE_URL = "https://sanatinrotasi.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, events, routes, categories] = await Promise.all([
    client.fetch<{ slug: string; _updatedAt: string }[]>(
      groq`*[_type == "article"]{ "slug": slug.current, _updatedAt }`,
    ),
    client.fetch<{ slug: string; _updatedAt: string }[]>(
      groq`*[_type == "event"]{ "slug": slug.current, _updatedAt }`,
    ),
    client.fetch<{ slug: string; _updatedAt: string }[]>(
      groq`*[_type == "route"]{ "slug": slug.current, _updatedAt }`,
    ),
    client.fetch<{ slug: string; _updatedAt: string }[]>(
      groq`*[_type == "category"]{ "slug": slug.current, _updatedAt }`,
    ),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/yazilar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/etkinlikler`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/rotalar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/hakkinda`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/topluluk`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/iletisim`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/kvkk`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/acik-riza`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const articleEntries: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${SITE_URL}/yazilar/${a.slug}`,
    lastModified: new Date(a._updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const eventEntries: MetadataRoute.Sitemap = (events ?? []).map((e) => ({
    url: `${SITE_URL}/etkinlikler/${e.slug}`,
    lastModified: new Date(e._updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const routeEntries: MetadataRoute.Sitemap = (routes ?? []).map((r) => ({
    url: `${SITE_URL}/rotalar/${r.slug}`,
    lastModified: new Date(r._updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${SITE_URL}/kategori/${c.slug}`,
    lastModified: new Date(c._updatedAt),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...articleEntries,
    ...eventEntries,
    ...routeEntries,
    ...categoryEntries,
  ];
}
