import { draftMode } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.SANITY_PREVIEW_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const dm = await draftMode();
  dm.enable();

  const redirect = request.nextUrl.searchParams.get("redirect") || "/";
  // Prevent open redirect by ensuring the path is relative
  const safePath = redirect.startsWith("/") ? redirect : "/";
  return NextResponse.redirect(new URL(safePath, request.url));
}
