import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { searchLimiter, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const revalidate = 60;

// GROQ escape — kullanıcı input'u doğrudan GROQ'a konulmaz.
// match operatörü "*" ve "?" wildcard'ları destekler; onları literal yap.
function sanitizeQuery(q: string): string {
  return q
    .replace(/[*?]/g, " ")
    .replace(/["\\]/g, "")
    .trim()
    .slice(0, 100);
}

const SEARCH_QUERY = groq`{
  "articles": *[_type == "article" && (
    title match $term ||
    excerpt match $term ||
    pt::text(body) match $term ||
    $term in tags
  )] | order(publishedAt desc) [0...20] {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    mainImage,
    author-> { name },
    category-> { title, slug }
  },
  "events": *[_type == "event" && (
    title match $term ||
    location match $term
  )] | order(date desc) [0...10] {
    _id,
    title,
    slug,
    date,
    location,
    mainImage
  },
  "routes": *[_type == "route" && (
    title match $term ||
    subtitle match $term ||
    city match $term
  )] [0...10] {
    _id,
    title,
    slug,
    subtitle,
    city,
    mainImage
  }
}`;

export async function GET(request: NextRequest) {
  try {
    // 60 arama/dk/IP — abuse koruması
    const ip = getClientIp(request);
    const limit = await searchLimiter.check(`search:${ip}`);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Çok hızlı arama yapıyorsun", articles: [], events: [], routes: [], query: "" },
        { status: 429 }
      );
    }

    const raw = request.nextUrl.searchParams.get("q") || "";
    const cleaned = sanitizeQuery(raw);

    if (cleaned.length < 2) {
      return NextResponse.json({
        articles: [],
        events: [],
        routes: [],
        query: cleaned,
      });
    }

    // "art" -> "art*" (Sanity match wildcard prefix search için)
    const term = `${cleaned}*`;

    const results = await client.fetch(
      SEARCH_QUERY,
      { term },
      { next: { revalidate: 60 } },
    );

    return NextResponse.json({ ...results, query: cleaned });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Arama başarısız" }, { status: 500 });
  }
}
