"use client";

import SectionLabel from "@/components/shared/SectionLabel";
import dynamic from "next/dynamic";

const ClerkProfile = dynamic(() => import("@/components/auth/ProfileContent"), {
  ssr: false,
  loading: () => (
    <div className="text-center py-20">
      <p className="font-serif text-warm-gray">Yükleniyor...</p>
    </div>
  ),
});

export default function ProfilPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-8">
        <SectionLabel label="Hesabım" className="mb-3 block" />
        <h1 className="font-display text-3xl font-bold text-ink">Profilim</h1>
      </header>
      <ClerkProfile />
    </div>
  );
}
