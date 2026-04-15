import type { Metadata } from "next";
import GirisClient from "./GirisClient";

export const metadata: Metadata = {
  title: "Giris Yap",
  description: "Sanatin Rotasi hesabiniza giris yapin.",
  robots: { index: false, follow: false },
};

export default function GirisPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-20 flex justify-center">
      <GirisClient />
    </div>
  );
}
