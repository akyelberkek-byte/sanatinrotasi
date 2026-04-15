import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Libre_Franklin } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { trTR } from "@clerk/localizations";
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

export const metadata: Metadata = {
  title: {
    default: "Sanatın Rotası — Sanat & Kültür Platformu",
    template: "%s — Sanatın Rotası",
  },
  description:
    "Türkiye'nin sanat ve kültür platformu. Kurucu & Kreatif Direktör: Ela Kantarcı",
  metadataBase: new URL("https://sanatinrotasi.com"),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://sanatinrotasi.com",
    siteName: "Sanatın Rotası",
    title: "Sanatın Rotası — Sanat & Kültür Platformu",
    description:
      "Türkiye'nin sanat ve kültür platformu. Kurucu & Kreatif Direktör: Ela Kantarcı",
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
      className={`${playfair.variable} ${cormorant.variable} ${libre.variable}`}
    >
      <body>
        {hasClerkKeys ? (
          <ClerkProvider localization={trTR}>{children}</ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
