import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SANITY_ID_REGEX = /^[a-zA-Z0-9._-]{1,64}$/;
const MAX_FAVORITES = 500;

async function getFavorites(userId: string): Promise<string[]> {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const raw = user.publicMetadata?.favorites;
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === "string");
}

async function setFavorites(userId: string, favorites: string[]): Promise<void> {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  await clerk.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      favorites,
    },
  });
}

/** GET /api/favorites → mevcut kullanıcının favori article ID listesi */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ favorites: [] });
    }
    const favorites = await getFavorites(userId);
    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Favorites GET error:", error);
    return NextResponse.json({ favorites: [] });
  }
}

/**
 * POST /api/favorites
 * Body: { articleId: string, action: "add" | "remove" }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Giriş yapmalısın" }, { status: 401 });
    }

    const { articleId, action } = await request.json();

    if (!articleId || typeof articleId !== "string" || !SANITY_ID_REGEX.test(articleId)) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }
    if (action !== "add" && action !== "remove") {
      return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
    }

    const existing = await getFavorites(userId);
    let next: string[];
    if (action === "add") {
      if (existing.includes(articleId)) {
        return NextResponse.json({ favorites: existing });
      }
      if (existing.length >= MAX_FAVORITES) {
        return NextResponse.json(
          { error: `En fazla ${MAX_FAVORITES} favori ekleyebilirsin` },
          { status: 400 }
        );
      }
      next = [...existing, articleId];
    } else {
      next = existing.filter((id) => id !== articleId);
    }

    await setFavorites(userId, next);
    return NextResponse.json({ favorites: next });
  } catch (error) {
    console.error("Favorites POST error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
