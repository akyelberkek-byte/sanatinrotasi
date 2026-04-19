import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
// Next 16 revalidateTag imzası için wrapper
function safeRevalidateTag(tag: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (revalidateTag as any)(tag);
  } catch {
    // ignore
  }
}
import { parseBody } from "next-sanity/webhook";
import { captureError } from "@/lib/observability";

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
 *   Projection: { "_type": _type, "slug": slug.current }
 */

type Body = {
  _type?: string;
  slug?: string;
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

    const { _type, slug } = body;

    // Tip bazlı revalidation — sadece etkilenen sayfalar
    switch (_type) {
      case "article":
        revalidatePath("/");
        revalidatePath("/yazilar");
        revalidatePath("/roportajlar");
        if (slug) revalidatePath(`/yazilar/${slug}`);
        safeRevalidateTag("articles:slugs");
        break;
      case "event":
        revalidatePath("/");
        revalidatePath("/etkinlikler");
        if (slug) revalidatePath(`/etkinlikler/${slug}`);
        break;
      case "route":
        revalidatePath("/");
        revalidatePath("/rotalar");
        if (slug) revalidatePath(`/rotalar/${slug}`);
        break;
      case "category":
        revalidatePath("/");
        revalidatePath("/yazilar");
        if (slug) revalidatePath(`/kategori/${slug}`);
        break;
      case "comment":
        // Comment'in slug'ı yok, article referansı var; safe fallback: comment içinden article slug iletmek istersen projection güncelle
        // Şimdilik tüm yorum sayfalarını etkileyecek ortak bir path yok, sadece ana sayfaya dokunma yeterli
        break;
      case "siteSettings":
      case "page":
      case "author":
        // Bu tip değişince tüm site etkileniyor — toptan revalidate
        revalidatePath("/", "layout");
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
