import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { writeClient } from "@/sanity/writeClient";
import { revalidatePath } from "next/cache";
import { commentPostLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Sanity reference ID validation — arbitrary metin gönderilemesin
const SANITY_ID_REGEX = /^[a-zA-Z0-9._-]{1,64}$/;

/**
 * POST /api/comments
 * Body: { articleId: string, body: string, articleSlug?: string }
 * Requires Clerk authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Yorum yapmak için giriş yapmalısın." },
        { status: 401 }
      );
    }

    // Rate limit: 5 yorum / dakika (kullanıcı bazlı — çok yorum spam'ı önler)
    const limit = commentPostLimiter.check(`comment-post:${userId}`);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Çok sık yorum gönderiyorsun, biraz bekle." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) },
        }
      );
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });
    }

    const { articleId, body, articleSlug } = await request.json();

    if (!articleId || !body || typeof body !== "string" || typeof articleId !== "string") {
      return NextResponse.json(
        { error: "Eksik veya hatalı veri" },
        { status: 400 }
      );
    }

    // articleId format kontrolü — injection / rastgele veri gönderilemesin
    if (!SANITY_ID_REGEX.test(articleId)) {
      return NextResponse.json(
        { error: "Geçersiz makale referansı" },
        { status: 400 }
      );
    }

    const trimmed = body.trim();
    if (trimmed.length < 1 || trimmed.length > 2000) {
      return NextResponse.json(
        { error: "Yorum 1-2000 karakter arasında olmalı" },
        { status: 400 }
      );
    }

    const authorName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      "Anonim";
    const authorEmail = user.emailAddresses?.[0]?.emailAddress || "";

    const doc = await writeClient.create({
      _type: "comment",
      article: { _type: "reference", _ref: articleId },
      authorName,
      authorEmail,
      authorId: userId,
      authorImage: user.imageUrl || "",
      body: trimmed,
      approved: true,
      createdAt: new Date().toISOString(),
    });

    // Revalidate the article page so the new comment appears immediately
    if (articleSlug && typeof articleSlug === "string") {
      try {
        revalidatePath(`/yazilar/${articleSlug}`);
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      comment: {
        _id: doc._id,
        authorName: doc.authorName,
        authorImage: doc.authorImage,
        body: doc.body,
        createdAt: doc.createdAt,
      },
    });
  } catch (error) {
    console.error("Comment POST error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
