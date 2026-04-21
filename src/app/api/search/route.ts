import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { searchLimiter, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const revalidate = 60;

// GROQ injection ve match operator manipulation koruması.
// $term parameterized; ek olarak wildcard/control karakterlerini literal yapıyoruz.
// NOT: `&` korunuyor — Türkçe arama için önemli ("Sanat & Kültür" gibi).
function sanitizeQuery(q: string): string {
  return q
    .replace(/[*?]/g, " ") // GROQ match wildcard
    .replace(/["\\]/g, "") // string delimiter
    .replace(/[()[\]{}]/g, " ") // grup/paren
    .replace(/[|!]/g, " ") // logical operatörler (&& || ise iki kez gerekir, & ise logical değil)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
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
