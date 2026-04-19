import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeClient } from "@/sanity/writeClient";
import { commentPostLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";

const SANITY_ID_REGEX = /^[a-zA-Z0-9._-]{1,64}$/;

/**
 * POST /api/comments/[id]/like
 * Toggles like for authenticated user.
 * Same userId can like once (idempotent).
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Giriş yapmalısın" },
        { status: 401 }
      );
    }

    // Rate limit: kullanıcı bazlı, aynı kullanıcı 5 saniyede en fazla 5 toggle
    const limit = await commentPostLimiter.check(`comment-like:${userId}`);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Çok hızlı, biraz bekle" },
        { status: 429 }
      );
    }

    const { id } = await context.params;
    if (!id || !SANITY_ID_REGEX.test(id)) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }

    // Mevcut yorumu çek (sadece type=comment ise)
    const existing = await writeClient.fetch<{
      _id: string;
      likedBy?: string[];
    } | null>(`*[_type == "comment" && _id == $id][0]{ _id, likedBy }`, { id });

    if (!existing) {
      return NextResponse.json({ error: "Yorum bulunamadı" }, { status: 404 });
    }

    const already = existing.likedBy?.includes(userId) ?? false;
    const newLikedBy = already
      ? (existing.likedBy || []).filter((u) => u !== userId)
      : [...(existing.likedBy || []), userId];

    await writeClient
      .patch(id)
      .set({
        likedBy: newLikedBy,
        likeCount: newLikedBy.length,
      })
      .commit();

    return NextResponse.json({
      liked: !already,
      count: newLikedBy.length,
    });
  } catch (error) {
    console.error("Comment like error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
