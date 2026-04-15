import { draftMode } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const dm = await draftMode();
  dm.enable();
  const url = request.nextUrl.searchParams.get("redirect") || "/";
  return NextResponse.redirect(new URL(url, request.url));
}
