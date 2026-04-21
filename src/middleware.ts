import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Korunan rotalar — sadece giriş yapan kullanıcılar
const isProtectedRoute = createRouteMatcher([
  "/profil(.*)",
  "/yonetim(.*)",
  "/kaydettiklerim(.*)",
]);

// Clerk API key'leri yoksa middleware'ı atla
const hasClerkKeys =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY;

function fallbackMiddleware(req: NextRequest) {
  // Profil sayfasına giriş yapılmadan erişilmesini engelle
  if (isProtectedRoute(req)) {
    return NextResponse.redirect(new URL("/giris", req.url));
  }
  return NextResponse.next();
}

export default hasClerkKeys
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
    })
  : fallbackMiddleware;

// Matcher:
// - Tüm sayfa route'ları (statik asset'ler hariç)
// - Sadece AUTH GEREKEN API'lar: /api/comments/:path, /api/favorites/:path
//   → diğer API'lar (revalidate webhook, search, contact, newsletter,
//      draft-mode) Clerk overhead'ı olmadan çalışır.
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/api/comments/:path*",
    "/api/favorites/:path*",
  ],
};
