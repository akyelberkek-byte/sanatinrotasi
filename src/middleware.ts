import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Korunan rotalar — sadece giriş yapan kullanıcılar
// /yonetim middleware'den çıkarıldı çünkü Clerk auth.protect() bot/crawler
// için 404 dönüyordu ("protect-rewrite" davranışı). Sayfa kendi auth
// check'ini yapıyor: giriş yoksa "Giriş Gerekli" CTA, admin değilse
// "Yetkisiz" mesajı gösterir.
const isProtectedRoute = createRouteMatcher([
  "/profil(.*)",
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
// - İlk pattern uzantısı olmayan TÜM path'leri yakalar; /api/* de buna dahil,
//   yani her API isteği de clerkMiddleware'den geçiyor. Sadece isProtectedRoute
//   ile eşleşenlerde auth.protect() çalıştığı için diğer API'lar (revalidate
//   webhook, search, contact, newsletter, draft-mode) auth zorunluluğu olmadan
//   çalışmaya devam ediyor.
// - Sonraki iki satır /api/comments ve /api/favorites'i açıkça kapsama alır
//   (ilk pattern değişirse bu auth gerektiren API'lar dışarıda kalmasın diye).
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/api/comments/:path*",
    "/api/favorites/:path*",
  ],
};
