import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { writeClient } from "@/sanity/writeClient";
import { isAdminEmail } from "@/lib/admin";
import { revalidatePath } from "next/cache";

/**
 * DELETE /api/comments/[id]
 * Admin only (by email whitelist).
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

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "ID eksik" }, { status: 400 });
    }

    await writeClient.delete(id);

    const articleSlug = request.nextUrl.searchParams.get("articleSlug");
    if (articleSlug) {
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
