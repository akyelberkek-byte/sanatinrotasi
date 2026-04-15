import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Korunan rotalar — sadece giriş yapan kullanıcılar
const isProtectedRoute = createRouteMatcher(["/profil(.*)"]);

// Herkese açık rotalar (auth gerekmez)
const isPublicRoute = createRouteMatcher([
  "/",
  "/yazilar(.*)",
  "/rotalar(.*)",
  "/etkinlikler(.*)",
  "/hakkinda",
  "/topluluk",
  "/iletisim",
  "/kvkk",
  "/acik-riza",
  "/kategori(.*)",
  "/giris(.*)",
  "/kayit(.*)",
  "/api(.*)",
  "/studio(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
