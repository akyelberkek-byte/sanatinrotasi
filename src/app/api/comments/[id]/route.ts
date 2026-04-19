import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { writeClient } from "@/sanity/writeClient";
import { isAdminEmail } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { commentDeleteLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Sanity document ID format: _id (en fazla 64 char, harf/rakam/-/.)
const SANITY_ID_REGEX = /^[a-zA-Z0-9._-]{1,64}$/;

/**
 * DELETE /api/comments/[id]
 * Admin only (by email whitelist).
 * Yalnızca "comment" tipi document silinebilir — admin hesabı ele geçse bile
 * makale/ayar document'ları silinemez.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Giriş yapmalısın" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (!isAdminEmail(email)) {
      return NextResponse.json(
        { error: "Yetkisiz işlem" },
        { status: 403 }
      );
    }

    // Rate limit: admin hesabı ele geçse bile toplu silme yapamasın
    const limit = commentDeleteLimiter.check(`comment-del:${userId}`);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Çok sık istek, biraz bekle." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) },
        }
      );
    }

    const { id } = await context.params;
    if (!id || !SANITY_ID_REGEX.test(id)) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }

    // Type-safety: sadece "comment" document'ı silebilsin (GROQ filter ile delete)
    // Bu sayede yanlışlıkla/istismar ile başka tipler silinemez.
    await writeClient.delete({
      query: `*[_id == $id && _type == "comment"]`,
      params: { id },
    });

    const articleSlug = request.nextUrl.searchParams.get("articleSlug");
    if (articleSlug && typeof articleSlug === "string") {
      try {
        revalidatePath(`/yazilar/${articleSlug}`);
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comment DELETE error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
