import { UserProfile } from "@clerk/nextjs";
import SectionLabel from "@/components/shared/SectionLabel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profilim",
  description: "Sanatın Rotası hesap profiliniz.",
};

export default function ProfilPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-8">
        <SectionLabel label="Hesabım" className="mb-3 block" />
        <h1 className="font-display text-3xl font-bold text-ink">Profilim</h1>
      </header>
      <UserProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border-2 border-ink/10 rounded-none bg-cream",
          },
        }}
      />
    </div>
  );
}
