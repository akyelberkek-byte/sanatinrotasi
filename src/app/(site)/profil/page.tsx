import type { Metadata } from "next";
import SectionLabel from "@/components/shared/SectionLabel";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Profilim",
  description: "Sanatın Rotası hesap profil sayfası.",
  robots: { index: false, follow: false },
};

export default function ProfilPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-8">
        <SectionLabel label="Hesabım" className="mb-3 block" />
        <h1 className="font-display text-3xl font-bold text-ink">Profilim</h1>
      </header>
      <ProfileClient />
    </div>
  );
}
