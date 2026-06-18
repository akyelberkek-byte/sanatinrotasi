import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { trTR } from "@clerk/localizations";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const hasClerkKeys = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY
);

// Site genelinde TEK font — Urbanist.
// Eski Playfair Display + Cormorant Garamond + Libre Franklin kaldırıldı,
// site kimliği tek geometric sans'a indirildi (kullanıcı isteği).
// 3 farklı CSS variable'a bağlanmıştır (display/serif/sans) ki mevcut
// className'ler bozulmasın — hepsi aynı font'u gösterir.
const urbanist = Urbanist({
  variable: "--font-urbane",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sanatın Rotası — Sanatın İzini Sür!",
    template: "%s — Sanatın Rotası",
  },
  description:
    "Türkiye'nin sanat ve kültür platformu — sanatçılar, sergiler ve yaratıcı üretimler için. Kurucu: Ela Kantarcı",
  metadataBase: new URL("https://sanatinrotasi.com"),
  icons: {
    icon: "/images/favicon.png",
    apple: "/images/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://sanatinrotasi.com",
    siteName: "Sanatın Rotası",
    title: "Sanatın Rotası — Sanatın İzini Sür!",
    description:
      "Türkiye'nin sanat ve kültür platformu — sanatçılar, sergiler ve yaratıcı üretimler için. Kurucu: Ela Kantarcı",
    images: [
      {
        url: "/images/logo.png",
        width: 512,
        height: 512,
        alt: "Sanatın Rotası",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Sanatın Rotası — Sanatın İzini Sür!",
    description:
      "Türkiye'nin sanat ve kültür platformu — sanatçılar, sergiler ve yaratıcı üretimler için. Kurucu: Ela Kantarcı",
    images: ["/images/logo.png"],
  },
  alternates: {
    canonical: "https://sanatinrotasi.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={urbanist.variable}
    >
      <body>
        {hasClerkKeys ? (
          <ClerkProvider localization={trTR}>{children}</ClerkProvider>
        ) : (
          children
        )}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
