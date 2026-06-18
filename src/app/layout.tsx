import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Libre_Franklin, Urbanist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { trTR } from "@clerk/localizations";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const hasClerkKeys = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY
);

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  display: "swap",
});

const libre = Libre_Franklin({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

// Urbanist — site genelinde tek font (geometric sans-serif, "Urbane" benzeri).
// Tüm weight'ler dahil (300-900) çünkü navbar/manifesto/heading/UI hepsi
// bu fontu kullanıyor — farklı yerlerin farklı weight ihtiyacı var.
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
      className={`${playfair.variable} ${cormorant.variable} ${libre.variable} ${urbanist.variable}`}
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
