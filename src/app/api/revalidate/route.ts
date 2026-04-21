import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { parseBody } from "next-sanity/webhook";
import { captureError } from "@/lib/observability";

// Next 16'da revalidateTag + revalidatePath imzaları değişti (type signature);
// runtime'da aynı çalışıyor ama TypeScript hatalarını bastıran ve throw etse bile
// diğer path'lerin revalidate olmaya devam etmesini sağlayan wrapper'lar.
function safeRevalidateTag(tag: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (revalidateTag as any)(tag);
  } catch {
    /* ignore */
  }
}

function safeRevalidatePath(path: string, type?: "page" | "layout") {
  try {
    if (type) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (revalidatePath as any)(path, type);
    } else {
      revalidatePath(path);
    }
  } catch (e) {
    captureError(e, { path, type, where: "safeRevalidatePath" });
  }
}

export const runtime = "nodejs";

/**
 * Sanity webhook → Next.js revalidate.
 *
 * Sanity Studio'da yazı/etkinlik/rota/siteSettings değişince bu endpoint
 * çağrılır, ilgili sayfalar anında güncellenir (60s beklemeden).
 *
 * Kurulum: Sanity Manage → Project → API → Webhooks
 *   URL: https://sanatinrotasi.com/api/revalidate
 *   Dataset: production
 *   Trigger: Create, Update, Delete
 *   Filter: _type in ["article", "event", "route", "category", "siteSettings", "author", "page", "comment"]
 *   HTTP method: POST
 *   HTTP headers: boş
 *   API version: 2025-01-01
 *   Include drafts: hayır
 *   Secret: SANITY_WEBHOOK_SECRET env var ile aynı değer
 *   Projection: {
 *     "_type": _type,
 *     "slug": slug.current,
 *     "articleSlug": article->slug.current  // comment için (varsa)
 *   }
 */

type Body = {
  _type?: string;
  slug?: string;
  articleSlug?: string; // comment → article.slug projection için
};

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.SANITY_WEBHOOK_SECRET;
    if (!secret) {
      // Secret yapılandırılmamışsa webhook'u hiç açmayalım — forged request riski
      captureError(new Error("SANITY_WEBHOOK_SECRET not configured"), {
        route: "/api/revalidate",
      });
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 503 }
      );
    }

    const { isValidSignature, body } = await parseBody<Body>(request, secret);

    if (!isValidSignature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
    if (!body?._type) {
      return NextResponse.json({ error: "Bad body" }, { status: 400 });
    }

    const { _type, slug, articleSlug } = body;

    // Tip bazlı revalidation — sadece etkilenen sayfalar
    switch (_type) {
      case "article":
        safeRevalidatePath("/");
        safeRevalidatePath("/yazilar");
        safeRevalidatePath("/roportajlar");
        if (slug) safeRevalidatePath(`/yazilar/${slug}`);
        safeRevalidateTag("articles:slugs");
        break;
      case "event":
        safeRevalidatePath("/");
        safeRevalidatePath("/etkinlikler");
        if (slug) safeRevalidatePath(`/etkinlikler/${slug}`);
        break;
      case "route":
        safeRevalidatePath("/");
        safeRevalidatePath("/yazilar"); // rotalar yazılar feed'inde de görünüyor
        safeRevalidatePath("/rotalar");
        if (slug) safeRevalidatePath(`/rotalar/${slug}`);
        break;
      case "category":
        safeRevalidatePath("/");
        safeRevalidatePath("/yazilar");
        if (slug) safeRevalidatePath(`/kategori/${slug}`);
        break;
      case "comment":
        // Ela Studio'dan yorumu onayladığında/reddettiğinde ilgili yazı sayfası yenilensin.
        // Sanity webhook projection'ına `"articleSlug": article->slug.current` eklenmeli.
        if (articleSlug) {
          safeRevalidatePath(`/yazilar/${articleSlug}`);
        }
        break;
      case "siteSettings":
      case "page":
      case "author":
        // Bu tip değişince tüm site etkileniyor — toptan revalidate
        safeRevalidatePath("/", "layout");
        break;
      default:
        break;
    }

    return NextResponse.json({ revalidated: true, type: _type, slug });
  } catch (error) {
    captureError(error, { route: "/api/revalidate" });
    return NextResponse.json(
      { error: "Revalidation failed" },
      { status: 500 }
    );
  }
}
