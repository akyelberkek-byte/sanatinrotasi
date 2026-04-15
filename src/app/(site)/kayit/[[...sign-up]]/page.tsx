import type { Metadata } from "next";
import KayitClient from "./KayitClient";

export const metadata: Metadata = {
  title: "Kayit Ol",
  description: "Sanatin Rotasi hesabi olusturun.",
  robots: { index: false, follow: false },
};

export default function KayitPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-20 flex justify-center">
      <KayitClient />
    </div>
  );
}
